import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RetroToggle } from "@/components/ui/retro-toggle";
import { useTheme } from "@/hooks/use-theme";
import { useRetroMode } from "@/hooks/use-retro-mode";
import { useUnifiedNotifications } from "@/components/ui/unified-notification";

interface NavigationButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

function NavigationButton({ children, onClick, className = "", style = {} }: NavigationButtonProps) {
  const { theme } = useTheme();
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-xl backdrop-blur-lg font-medium text-sm
        transition-all duration-300 hover:scale-105 active:scale-95
        border-2 ${
          theme === "light"
            ? "border-blue-400/40 bg-white/80 hover:bg-white/90 text-gray-800"
            : "border-blue-300/30 bg-blue-400/10 hover:bg-blue-400/20 text-white"
        }
        ${className}
      `}
      style={{
        background:
          theme === "light"
            ? `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`
            : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
        boxShadow: "0 0 20px rgba(73, 146, 255, 0.3)",
        ...style,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

export default function FocusedIndex() {
  const { theme } = useTheme();
  const { mode } = useRetroMode();
  const { showSuccess } = useUnifiedNotifications();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simple entrance animation
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  const scrollToSection = (sectionId: string) => {
    // Emit custom event to scroll to section
    window.dispatchEvent(new CustomEvent('scrollToSection', { 
      detail: ['home', 'about', 'what-we-do', 'services', 'pricing', 'portfolio', 'contact'].indexOf(sectionId)
    }));
    showSuccess(`Navigating to ${sectionId}`, "");
  };

  if (mode === "retro") {
    // Return to original retro mode - user can still access it
    return null;
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden ${
        theme === "light"
          ? "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
          : "bg-black"
      }`}
    >
      {/* Simplified background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {/* Subtle aurora curtains */}
        <div
          className="absolute"
          style={{
            top: "20%",
            left: "-10%",
            right: "-10%",
            height: "80px",
            background: "linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.3) 25%, rgba(34, 197, 94, 0.3) 50%, rgba(6, 182, 212, 0.3) 75%, transparent 100%)",
            borderRadius: "40% 60% 80% 20% / 60% 40% 80% 20%",
            filter: "blur(15px)",
            animation: "gentle-float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "60%",
            left: "-15%",
            right: "-15%",
            height: "100px",
            background: "linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.25) 30%, rgba(6, 182, 212, 0.25) 50%, rgba(16, 185, 129, 0.25) 70%, transparent 100%)",
            borderRadius: "30% 70% 40% 60% / 70% 30% 60% 40%",
            filter: "blur(18px)",
            animation: "gentle-float 25s ease-in-out infinite reverse",
          }}
        />

        {/* Minimal floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full opacity-40"
            style={{
              left: `${10 + ((i * 80) % 80)}%`,
              top: `${15 + ((i * 60) % 70)}%`,
              width: `${4 + (i % 2) * 2}px`,
              height: `${4 + (i % 2) * 2}px`,
              background: `radial-gradient(circle, rgba(73, 146, 255, 0.8) 0%, transparent 70%)`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 6 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Theme toggles - positioned in top right */}
      <div className="fixed top-6 right-6 z-50">
        <div
          className="rounded-xl border-2 backdrop-blur-2xl p-3 flex flex-col gap-2"
          style={{
            background:
              theme === "light"
                ? `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`
                : `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
            borderColor: theme === "light" ? "rgba(59, 130, 246, 0.4)" : "rgba(73, 146, 255, 0.3)",
            boxShadow: "0 0 25px rgba(73, 146, 255, 0.4)",
          }}
        >
          <ThemeToggle />
          <RetroToggle />
        </div>
      </div>

      {/* Main content centered */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Top badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-lg mb-8"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className={`text-sm font-medium ${theme === "light" ? "text-gray-700" : "text-white/80"}`}>
              Future-Ready Solutions, Custom-Built
            </span>
          </motion.div>

          {/* Central "Kor" logo with simplified orb */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          >
            {/* Simplified central orb */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-64 h-64 rounded-full opacity-50"
                style={{
                  background: "radial-gradient(circle, rgba(73, 146, 255, 0.4) 0%, rgba(73, 146, 255, 0.1) 40%, transparent 70%)",
                  filter: "blur(30px)",
                }}
              />
            </div>

            {/* Main text */}
            <div className="relative z-10">
              <h1
                className={`font-bold text-8xl md:text-9xl lg:text-[10rem] tracking-tight ${
                  theme === "light" ? "text-gray-900" : "text-white"
                }`}
                style={{
                  fontFamily: "Poppins, sans-serif",
                  filter: theme === "light" 
                    ? "drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))"
                    : "drop-shadow(0 0 30px rgba(73, 146, 255, 0.6))",
                }}
              >
                Kor
              </h1>
              <motion.p
                className={`text-2xl md:text-3xl font-semibold mt-2 ${
                  theme === "light" ? "text-gray-700" : "text-white/90"
                }`}
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <span aria-label="Development services" role="text">
                  {"Development services".split("").map((ch, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="inline-block relative animate-wavy-text"
                        style={{ animationDelay: `${i * 0.06}s`, animationDuration: "2s" }}
                    >
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  ))}
                </span>
              </motion.p>
            </div>
          </motion.div>

          {/* Navigation buttons arranged around center - matching screenshot */}
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 1 } : {}}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {/* Top buttons */}
            <div className="flex justify-center gap-4 mb-6">
              <NavigationButton onClick={() => scrollToSection('contact')}>
                Contact us
              </NavigationButton>
              <NavigationButton onClick={() => scrollToSection('about')}>
                About us
              </NavigationButton>
            </div>

            {/* Side buttons */}
            <div className="flex justify-center items-center gap-8 mb-6">
              <NavigationButton onClick={() => scrollToSection('portfolio')}>
                Portfolio
              </NavigationButton>
              
              <div className="w-32" /> {/* Spacer for center */}
              
              <NavigationButton onClick={() => scrollToSection('services')}>
                Services
              </NavigationButton>
            </div>

            {/* Bottom scroll indicator */}
            <motion.div
              className="flex flex-col items-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 2, duration: 0.8 }}
            >
              <p className={`text-sm mb-2 ${theme === "light" ? "text-gray-600" : "text-white/60"}`}>
                Scroll Down
              </p>
              <motion.div
                className={`w-6 h-10 border-2 rounded-full ${
                  theme === "light" ? "border-gray-400" : "border-white/40"
                } relative`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className={`w-1 h-1 rounded-full mx-auto mt-2 ${
                    theme === "light" ? "bg-gray-600" : "bg-white"
                  }`}
                  animate={{ y: [0, 16, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Subtle geometric accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <svg className="absolute w-full h-full" viewBox="0 0 1200 800">
          {[...Array(3)].map((_, i) => (
            <circle
              key={i}
              cx={200 + i * 400}
              cy={300 + (i % 2) * 200}
              r={100 + i * 50}
              fill="none"
              stroke="rgba(73, 146, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="20 10"
              style={{
                animation: `rotate-slow ${20 + i * 5}s linear infinite`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(-5px) translateX(-5px); }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
