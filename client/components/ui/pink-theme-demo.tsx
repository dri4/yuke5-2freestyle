import { usePinkTheme } from "@/hooks/use-pink-theme";

export function PinkThemeDemo() {
  const { isPinkActive } = usePinkTheme();

  if (!isPinkActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-pink-900/20 backdrop-blur-lg border border-pink-500/30 rounded-lg">
      <div className="text-pink-300 text-sm font-medium mb-2">
        🌸 Pink Theme Active
      </div>
      <div className="space-y-2">
        <div className="w-16 h-2 bg-pink-500 rounded animate-pink-pulse"></div>
        <div className="text-pink-200 text-xs animate-pink-neon-glow">
          Neon Glow Text
        </div>
        <div className="w-8 h-8 bg-pink-400 rounded-full animate-pink-heartbeat"></div>
      </div>
    </div>
  );
}
