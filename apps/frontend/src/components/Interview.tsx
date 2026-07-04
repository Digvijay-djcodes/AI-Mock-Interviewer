import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, Loader2, PhoneOff, User, Mic } from "lucide-react";
import { VoiceOrb } from "./VoiceOrb";

type Status = "connecting" | "live" | "ending";

export function Interview() {
    const { interviewId } = useParams();
    const navigate = useNavigate();

    const [hasStarted, setHasStarted] = useState(false); // NEW: Controls the start screen
    const [status, setStatus] = useState<Status>("connecting");
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef<any>(null);
    const utteranceRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const current = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setTranscript(current);
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        } else {
            alert("Your browser does not support Web Speech API. Use Chrome.");
        }

        return () => cleanup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    const cleanup = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        window.speechSynthesis.cancel();
    };

    // NEW: This function triggers from the physical tap, unlocking mobile audio
    const handleStartInterview = () => {
        setHasStarted(true);
        setStatus("live");

        // The Magic Trick: Play a silent utterance immediately on click to unlock Safari/Chrome audio
        const unlockAudio = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(unlockAudio);

        // Small delay to ensure the engine is awake before speaking the actual text
        setTimeout(() => {
            const initialGreeting = "Hi, I'm your AI interviewer. I have reviewed your GitHub profile, and I'm ready to begin. Could you start by briefly introducing yourself?";
            speak(initialGreeting);
            
            const token = localStorage.getItem("token");
            axios.post(`${BACKEND_URL}/api/v1/interview/${interviewId}/init`, { 
                message: initialGreeting 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(console.error);
        }, 100);
    };

    const startListening = () => {
        if (recognitionRef.current && !isAiSpeaking) {
            setTranscript('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {}
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const speak = (text: string) => {
        setIsAiSpeaking(true);
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; 
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.includes('en-') && v.name.includes('Google')) || voices.find(v => v.lang.includes('en-'));
        if (englishVoice) utterance.voice = englishVoice;
        utterance.rate = 1.05;

        // NEW: Safety net timeout. If the mobile browser swallows the event, force a turn switch after 15 seconds.
        const safetyTimer = setTimeout(() => {
            console.warn("Audio 'onend' event dropped by browser. Forcing turn switch.");
            setIsAiSpeaking(false);
            startListening();
        }, 15000);

        utterance.onend = () => {
            clearTimeout(safetyTimer); // Clear the safety net if it works properly
            setIsAiSpeaking(false);
            startListening(); 
        };

        utterance.onerror = (e) => {
            clearTimeout(safetyTimer); // Clear the safety net if it errors
            console.error("TTS Error:", e);
            setIsAiSpeaking(false);
            startListening();
        };

        window.speechSynthesis.speak(utterance);
    };

    const handleConversation = async (userMessage: string) => {
        stopListening();
        setTranscript("");
        
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/api/v1/message/${interviewId}`, {
                message: userMessage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const aiText = response.data.reply;
            speak(aiText);
        } catch (error) {
            console.error("Failed to get AI response", error);
        }
    };

    const submitAnswer = () => {
        if (!transcript.trim()) return;
        setIsAiSpeaking(false); 
        window.speechSynthesis.cancel(); 
        handleConversation(transcript);
    };

    const endInterview = async () => {
        setStatus("ending");
        cleanup();
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${BACKEND_URL}/api/v1/interview/${interviewId}/end`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/result/${interviewId}`);
        } catch (error) {
            console.error("Failed to end interview");
        }
    };

    // NEW: Render the start screen if they haven't tapped yet
    if (!hasStarted) {
        return (
            <main className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 px-4 text-center">
                <div className="max-w-md space-y-6 w-full">
                    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-xl">
                        <Bot className="size-16 text-emerald-500 mx-auto mb-6 animate-pulse" />
                        <h2 className="text-2xl font-bold mb-3">Interviewer is Ready</h2>
                        <p className="text-zinc-400 text-sm mb-8">
                            To ensure your device's audio works correctly, please tap the button below to start the session.
                        </p>
                        <button 
                            onClick={handleStartInterview}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl px-6 py-4 text-lg transition-colors"
                        >
                            Tap to Start
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // EXISTING: The main interview UI
    return (
        <main className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
            <header className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50 bg-zinc-900/20 backdrop-blur">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="relative flex size-2.5">
                        <span className={status === "live" ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" : "hidden"} />
                        <span className={"relative inline-flex size-2.5 rounded-full " + (status === "live" ? "bg-emerald-500" : "bg-amber-500")} />
                    </span>
                    {status === "connecting" ? "Connecting…" : status === "ending" ? "Generating Feedback…" : "Interview live"}
                </div>
                <span className="text-sm text-zinc-500">AI Mock Interview</span>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center px-6 gap-12">
                <div className="flex w-full max-w-3xl items-center justify-center gap-12 sm:gap-24">
                    <VoiceOrb level={isAiSpeaking ? 0.8 : 0.1} speaking={isAiSpeaking} label="Interviewer" sublabel={isAiSpeaking ? "Speaking" : "Waiting"} icon={Bot} accent="violet" />
                    <VoiceOrb level={isListening ? 0.8 : 0.1} speaking={isListening} label="You" sublabel={isListening ? "Listening..." : "Mic Off"} icon={User} accent="emerald" />
                </div>

                {status === "live" && (
                    <div className="w-full max-w-2xl bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500/20">
                        <p className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                            <Mic className="size-4" /> Your active answer:
                        </p>
                        <textarea 
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="w-full h-24 bg-transparent border-none resize-none focus:outline-none placeholder:text-zinc-600"
                            placeholder="Start speaking, or manually type your answer here..."
                        />
                        <div className="flex justify-end mt-2">
                            <button 
                                onClick={submitAnswer} 
                                disabled={!transcript.trim()}
                                className="bg-zinc-100 text-zinc-900 hover:bg-white font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
                            >
                                Send Answer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <footer className="flex justify-center px-6 py-8">
                <button 
                    onClick={endInterview} 
                    disabled={status === "ending"} 
                    className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-medium rounded-full px-6 py-3 text-sm transition-colors disabled:opacity-50"
                >
                    {status === "ending" ? <Loader2 className="size-4 animate-spin" /> : <PhoneOff className="size-4" />}
                    End interview
                </button>
            </footer>
        </main>
    );
}