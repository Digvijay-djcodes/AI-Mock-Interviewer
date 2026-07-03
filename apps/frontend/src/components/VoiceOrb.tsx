import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface VoiceOrbProps {
    level: number;
    speaking: boolean;
    label: string;
    sublabel: string;
    icon: LucideIcon;
    accent: "violet" | "emerald";
}

export function VoiceOrb({ speaking, label, sublabel, icon: Icon, accent }: VoiceOrbProps) {
    const isViolet = accent === "violet";
    
    return (
        <div className="flex flex-col items-center gap-6">
            {/* Strict container to prevent margin overflow */}
            <div className="relative flex h-32 w-32 items-center justify-center">
                
                {/* Base background boundary */}
                <div className="absolute inset-0 rounded-full bg-zinc-900 border border-zinc-800/80" />
                
                {/* Dynamic animated rings that only appear when speaking */}
                {speaking && (
                    <>
                        <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20 duration-1000", isViolet ? "bg-violet-500" : "bg-emerald-500")} />
                        <div className={cn("absolute inset-3 rounded-full animate-pulse opacity-30", isViolet ? "bg-violet-500" : "bg-emerald-500")} />
                    </>
                )}

                {/* Inner Icon Container */}
                <div 
                    className={cn(
                        "relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full transition-all duration-300",
                        isViolet ? "bg-violet-600" : "bg-emerald-600",
                        speaking ? "scale-110" : "scale-100",
                        isViolet && speaking ? "shadow-[0_0_30px_rgba(139,92,246,0.4)]" : "",
                        !isViolet && speaking ? "shadow-[0_0_30px_rgba(16,185,129,0.4)]" : ""
                    )}
                >
                    <Icon className="h-7 w-7 text-white" />
                </div>
            </div>
            
            <div className="text-center">
                <p className="text-sm font-semibold tracking-wide text-zinc-200">{label}</p>
                <p className={cn("text-xs mt-1.5 font-medium uppercase tracking-widest transition-colors", 
                    speaking ? (isViolet ? "text-violet-400" : "text-emerald-400") : "text-zinc-600"
                )}>
                    {sublabel}
                </p>
            </div>
        </div>
    );
}