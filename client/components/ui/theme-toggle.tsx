import { Palette, RotateCcw } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useRetroMode } from "@/hooks/use-retro-mode";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { mode } = useRetroMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (mode === "retro") return; // Disable in retro mode
              toggleTheme();
            }}
            className={`h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ${
              mode === "retro"
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/20 hover:scale-110 cursor-pointer"
            }`}
            style={{
              background:
                theme === "light"
                  ? "rgba(0, 0, 0, 0.1)"
                  : "rgba(255, 255, 255, 0.1)",
              borderColor:
                theme === "light"
                  ? "rgba(0, 0, 0, 0.2)"
                  : "rgba(255, 255, 255, 0.2)",
            }}
          >
            {theme === "light" ? (
              <RotateCcw className="h-5 w-5 text-purple-600 transition-all" />
            ) : (
              <Palette className="h-5 w-5 text-cyan-400 transition-all" />
            )}
            <span className="sr-only">Invert colors</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>
            {mode === "retro"
              ? "Theme disabled in retro mode"
              : theme === "light"
                ? "Switch to dark theme"
                : "Switch to light theme"}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
