import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Loader2, Github, LogOut, Code2, Target, Play, History, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [githubUrl, setGithubUrl] = useState("");
    const [interviewType, setInterviewType] = useState("Technical"); 
    const [starting, setStarting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/auth");
                return;
            }
            try {
                const response = await axios.get(`${BACKEND_URL}/api/v1/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (error) {
                localStorage.removeItem("token");
                navigate("/auth");
            }
        };
        fetchDashboard();
    }, [navigate]);

    const startInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!githubUrl.trim()) return;
        
        setStarting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`, 
                { 
                    github: githubUrl.trim(),
                    type: interviewType
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            navigate(`/interview/${response.data.id}`);
        } catch (error) {
            toast.error("Failed to initialize. Check your repository URL.");
            setStarting(false);
        }
    };

    if (!data) return (
        <div className="flex h-screen items-center justify-center bg-[#09090b]">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <main className="min-h-screen bg-[#09090b] text-zinc-50 pb-20">
            {/* Top Navigation */}
            <nav className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-1.5 rounded-md border border-emerald-500/20">
                            <Code2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <span className="font-semibold tracking-tight text-zinc-100">AI Interviewer</span>
                    </div>
                    <button 
                        onClick={() => { localStorage.removeItem("token"); navigate("/auth"); }}
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        Sign Out <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Action & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Primary Action Box */}
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h2 className="text-lg font-semibold text-white mb-2 relative z-10">Start Interview</h2>
                        <p className="text-sm text-zinc-400 mb-6 relative z-10">
                            Connect your GitHub profile to generate a tailored technical interview based on your repositories.
                        </p>
                        
                        <form onSubmit={startInterview} className="space-y-5 relative z-10">
                            {/* Interview Type Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Interview Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["Behavioral", "Technical", "System Design", "HR/Culture Fit"].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setInterviewType(type)}
                                            className={`px-3 py-2 text-xs font-medium rounded-md border transition-all ${
                                                interviewType === type 
                                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                                : "bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* GitHub URL Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Repository Context</label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <input 
                                        type="url"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="github.com/username"
                                        required
                                        className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={starting || !githubUrl}
                                className="w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                                Initialize {interviewType}
                            </button>
                        </form>
                    </div>

                    {/* Stats Bento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5">
                            <Target className="h-5 w-5 text-violet-400 mb-3" />
                            <p className="text-2xl font-bold text-white">{data.totalSessions}</p>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Sessions</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5">
                            <Activity className="h-5 w-5 text-emerald-400 mb-3" />
                            <p className="text-2xl font-bold text-white">{data.avgScore}<span className="text-sm text-zinc-500 font-normal">/10</span></p>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">Avg Score</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Interview History */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 min-h-[500px]">
                        <div className="flex items-center gap-2 mb-6">
                            <History className="h-5 w-5 text-zinc-400" />
                            <h2 className="text-lg font-semibold text-white">Interview History</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {data.history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-zinc-500">
                                    <Code2 className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No interviews completed yet.</p>
                                </div>
                            ) : (
                                data.history.map((session: any) => (
                                    <div 
                                        key={session.id} 
                                        onClick={() => navigate(`/result/${session.id}`)}
                                        className="group flex items-center justify-between p-4 bg-[#09090b] border border-zinc-800/50 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center h-11 w-11 rounded-lg bg-zinc-900 border ${session.score >= 7 ? 'border-emerald-500/30 text-emerald-400' : session.score >= 5 ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}`}>
                                                <span className="font-bold">{session.score}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-200">{session.interviewType || "Technical"} Interview</p>
                                                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-[250px] md:max-w-md">
                                                    {session.feedback.replace(/\*\*/g, '').replace(/\*/g, '•')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-zinc-500 font-medium tracking-wide">
                                                {session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-US", { 
                                                    month: "short", 
                                                    day: "numeric", 
                                                    year: "numeric" 
                                                }) : "N/A"}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}

function Activity(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}