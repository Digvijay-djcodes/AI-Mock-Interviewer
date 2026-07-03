import express from "express";
import { PreInterviewBody } from "./types";
import { scrapeGithub } from "./scrapers/github";
import cors from "cors";
import { prisma } from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        "http://localhost:3001", // For local development
        "https://ai-mock-interviewer-platform.vercel.app" // For production deployment
    ], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const JWT_SECRET = process.env.JWT_SECRET as string;

// --- JWT MIDDLEWARE ---
const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });
    
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET as string);
        req.userId = (decoded as any).userId;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// --- AUTHENTICATION ROUTES ---
app.post("/api/v1/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/v1/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// --- DASHBOARD ROUTE ---
app.get("/api/v1/dashboard", authenticate, async (req: any, res: any) => {
    try {
        const interviews = await prisma.interview.findMany({
            where: { userId: req.userId },
            orderBy: { id: 'desc' }
        });

        const completedInterviews = interviews.filter((i: any) => i.status === "Done");
        const totalSessions = completedInterviews.length;
        
        const avgScore = totalSessions > 0 
            ? completedInterviews.reduce((acc: any, curr: any) => acc + curr.score, 0) / totalSessions 
            : 0;

        res.json({
            totalSessions,
            avgScore: Math.round(avgScore * 10) / 10,
            history: completedInterviews.map((i: any) => ({
                id: i.id,
                score: i.score,
                feedback: i.feedback,
                createdAt: i.createdAt,
                interviewType: i.interviewType || "Technical" // Expose type to frontend
            }))
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load dashboard" });
    }
});

// --- UPDATE PRE-INTERVIEW ROUTE ---
app.post("/api/v1/pre-interview", authenticate, async (req: any, res: any) => { 
    const githubUrlRaw = req.body.github;
    const interviewType = req.body.type || "Technical"; 

    if (!githubUrlRaw) {
        return res.status(400).json({ message: "GitHub URL is required" });
    }

    const githubUrl = githubUrlRaw.endsWith("/") ? githubUrlRaw.slice(0, -1) : githubUrlRaw;
    const githubUsername = githubUrl.split("/").pop()!;
    
    try {
        const githubData = await scrapeGithub(githubUsername);

        const interview = await prisma.interview.create({
            data: {
                userId: req.userId, 
                githubMetadata: JSON.stringify(githubData),
                status: "Pre",
                interviewType: interviewType 
            }
        });

        res.json({ id: interview.id });
    } catch (error) {
        res.status(500).json({ error: "Failed to initialize interview" });
    }
});

// 2. INIT ROUTE
app.post("/api/v1/interview/:interviewId/init", authenticate, async (req: any, res: any) => {
    const { interviewId } = req.params;
    const { message } = req.body;
    
    try {
        await prisma.message.create({
            data: { interviewId, type: "User", message: "Hi, I am ready to start my interview." }
        });

        await prisma.message.create({
            data: { interviewId, type: "Assistant", message }
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to init interview" });
    }
});

// 3. LIVE INTERVIEW LOOP
app.post("/api/v1/message/:interviewId", authenticate, async (req: any, res: any) => {
    const { interviewId } = req.params;
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ message: "No text provided" });
    }

    const interview = await prisma.interview.findUnique({
        where: { id: interviewId }
    });

    if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
    }

    await prisma.message.create({
        data: { interviewId, type: "User", message: message }
    });

    const history = await prisma.message.findMany({
        where: { interviewId },
        orderBy: { createdAt: "asc" }
    });

    const transcriptText = history.map((msg: any) => `${msg.type}: ${msg.message}`).join("\n\n");

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are an expert ${interview.interviewType} AI interviewer. The candidate's GitHub profile metadata is: ${interview.githubMetadata}.
        Rules:
        1. Ask ONE ${interview.interviewType.toLowerCase()} question at a time, tailoring it to their GitHub experience if applicable.
        2. Evaluate their previous response and ask a relevant follow-up.
        3. KEEP YOUR RESPONSES INCREDIBLY BRIEF. Never exceed 2 to 3 short sentences. This is critical for latency.
        4. Do NOT use markdown (no asterisks, bolding, etc.).
        5. ONLY output your spoken response. Do NOT include labels like "Assistant:" or "Interviewer:" in your output.`
    });

    const prompt = `Here is the transcript of the interview so far:\n\n${transcriptText}\n\nBased on the transcript above, generate your next brief spoken response.`;

    try {
        const result = await model.generateContent(prompt);
        const aiReply = result.response.text().trim();

        await prisma.message.create({
            data: { interviewId, type: "Assistant", message: aiReply }
        });

        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
});

// 4. END INTERVIEW: Background Feedback Generation
app.post("/api/v1/interview/:interviewId/end", authenticate, async (req: any, res: any) => {
    const { interviewId } = req.params;

    res.json({ success: true });

    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: { conversations: true }
    });

    if (interview && interview.status !== "Done") {
        try {
            const transcriptText = interview.conversations.map((m: any) => `${m.type}: ${m.message}`).join('\n');
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Review this ${interview.interviewType} interview transcript. Provide a highly CONCISE feedback report. 
            Use short bullet points for 3 strengths and 3 weaknesses. Do not write long introductory or concluding paragraphs. 
            Then, on a new line at the very end, provide a single integer score out of 10.
            \n\nTranscript:\n${transcriptText}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            const match = responseText.match(/\d+(?=\s*$)/);
            const score = match ? parseInt(match[0], 10) : 5;
            const feedback = responseText.replace(/\d+(?=\s*$)/, '').trim();

            await prisma.interview.update({
                where: { id: interviewId },
                data: {
                    status: "Done",
                    feedback: feedback,
                    score: score
                }
            });
        } catch (error) {
            console.error("Feedback generation error:", error);
        }
    }
});

// 5. RESULTS POLLING
app.get("/api/v1/result/:interviewId", authenticate, async (req: any, res: any) => {
    const interview = await prisma.interview.findUnique({
        where: { id: req.params.interviewId },
        include: { conversations: true }
    });

    if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
    }

    res.json({
        score: interview.score,
        feedback: interview.feedback,
        transcript: interview.conversations.map((c: any) => ({
            type: c.type,
            content: c.message,
            createdAt: c.createdAt
        })),
        status: interview.status
    });
});

app.listen(3001, () => console.log("Server running on port 3001"));
