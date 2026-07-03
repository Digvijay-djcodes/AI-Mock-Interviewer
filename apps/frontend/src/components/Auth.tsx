import { useState } from "react";
import { BACKEND_URL } from "@/lib/config";
import axios from "axios";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Code2, Loader2, ArrowRight } from "lucide-react";

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";
            const payload = isLogin ? { email, password } : { email, password, name };
            
            const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload);
            localStorage.setItem("token", response.data.token);
            toast.success("Successfully authenticated");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Authentication failed. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen w-full items-center justify-center bg-[#09090b] text-zinc-50 font-sans selection:bg-emerald-500/30">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-full max-w-[400px] p-8">
                <div className="flex flex-col items-center mb-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner mb-6">
                        <Code2 className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        {isLogin ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2 text-center">
                        {isLogin ? "Enter your credentials to access your workspace." : "Start deploying mock interviews in seconds."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                            <input 
                                placeholder="John Doe" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-600 text-zinc-200"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Email Address</label>
                        <input 
                            type="email" 
                            placeholder="name@company.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-600 text-zinc-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-600 text-zinc-200"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </main>
    );
}