import { Heart, Sparkles } from "lucide-react";
import { usePinkTheme } from "@/hooks/use-pink-theme";
import { useTheme } from "@/hooks/use-theme";
import { useRetroMode } from "@/hooks/use-retro-mode";
import { Button } from "@/components/ui/button";

export function PinkThemeToggle() {
  const { isPinkActive, togglePinkTheme } = usePinkTheme();
  const { theme } = useTheme();
  const { mode } = useRetroMode();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (mode === "retro") return; // Disable in retro mode
        togglePinkTheme?.();
      }}
      className={`h-10 w-10 rounded-full backdrop-blur-md border transition-all duration-500 group relative overflow-hidden ${
        mode === "retro"
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-110 cursor-pointer"
      } ${
        isPinkActive
          ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-400/50 hover:from-pink-500/30 hover:to-rose-500/30 hover:border-pink-400/70 shadow-lg shadow-pink-500/25"
          : "bg-white/10 border-white/20 hover:bg-white/20"
      }`}
      style={{
        background: isPinkActive
          ? theme === "light"
            ? "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(244, 114, 182, 0.15))"
            : "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(244, 114, 182, 0.25))"
          : theme === "light"
            ? "rgba(0, 0, 0, 0.1)"
            : "rgba(255, 255, 255, 0.1)",
        borderColor: isPinkActive
          ? "rgba(236, 72, 153, 0.5)"
          : theme === "light"
            ? "rgba(0, 0, 0, 0.2)"
            : "rgba(255, 255, 255, 0.2)",
        boxShadow: isPinkActive
          ? "0 0 20px rgba(236, 72, 153, 0.3), 0 0 40px rgba(236, 72, 153, 0.1)"
          : "none",
      }}
    >
      {/* Background sparkle animation */}
      {isPinkActive && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1 left-1 w-1 h-1 bg-pink-300 rounded-full animate-ping"></div>
          <div className="absolute bottom-2 right-1 w-0.5 h-0.5 bg-rose-300 rounded-full animate-pulse"></div>
          <div className="absolute top-2 right-2 w-0.5 h-0.5 bg-pink-400 rounded-full animate-bounce"></div>
        </div>
      )}

      {/* Main icon with enhanced animations */}
      <div className="relative z-10 flex items-center justify-center">
        {isPinkActive ? (
          <div className="relative">
            <Heart
              className="h-5 w-5 text-pink-400 transition-all duration-300 fill-current animate-pulse"
              style={{
                filter: "drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))",
              }}
            />
            <Sparkles
              className="absolute -top-1 -right-1 h-3 w-3 text-rose-300 animate-spin"
              style={{ animationDuration: "3s" }}
            />
          </div>
        ) : (
          <Heart className="h-5 w-5 text-gray-500 transition-all duration-300 group-hover:text-pink-400" />
        )}
      </div>

      {/* Hover ripple effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/0 to-rose-400/0 group-hover:from-pink-400/20 group-hover:to-rose-400/20 transition-all duration-300"></div>

      <span className="sr-only">Toggle Pink Theme</span>
    </Button>
  );
}
