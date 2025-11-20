import React from "react";

interface EnhancedBackgroundEffectsProps {
  sectionName: string;
  theme: "light" | "dark";
}

export const EnhancedBackgroundEffects: React.FC<
  EnhancedBackgroundEffectsProps
> = ({ sectionName, theme }) => {
  return (
    <>
      {/* Animated Noise Texture */}
      <div
        className="absolute inset-0 opacity-5 animate-noise gpu-accelerated"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Desktop Aurora Curtains */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 sm:opacity-60 lg:opacity-60">
        <div
          className="absolute aurora-curtain-1"
          style={{
            top: "20%",
            left: "-15%",
            right: "-15%",
            height: "120px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.4) 15%, rgba(20, 184, 166, 0.5) 30%, rgba(34, 197, 94, 0.4) 50%, rgba(6, 182, 212, 0.5) 70%, rgba(20, 184, 166, 0.4) 85%, transparent 100%)",
            borderRadius: "40% 60% 80% 20% / 60% 40% 80% 20%",
            filter: "blur(15px)",
            animation: "aurora-wave-subtle-1 28s ease-in-out infinite",
            transform: "skewY(-1deg)",
          }}
        />
        <div
          className="absolute aurora-curtain-2"
          style={{
            top: "45%",
            left: "-20%",
            right: "-20%",
            height: "140px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.35) 10%, rgba(6, 182, 212, 0.45) 25%, rgba(16, 185, 129, 0.4) 40%, rgba(20, 184, 166, 0.45) 60%, rgba(34, 197, 94, 0.4) 75%, rgba(6, 182, 212, 0.35) 90%, transparent 100%)",
            borderRadius: "30% 70% 40% 60% / 70% 30% 60% 40%",
            filter: "blur(18px)",
            animation: "aurora-wave-subtle-2 34s ease-in-out infinite",
            transform: "skewY(0.5deg)",
          }}
        />

        {/* Desktop Floating Energy Orbs */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={`${sectionName}-desktop-orb-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${8 + ((i * 7) % 84)}%`,
                top: `${12 + ((i * 11) % 76)}%`,
                width: `${6 + (i % 4) * 2}px`,
                height: `${6 + (i % 4) * 2}px`,
                background: [
                  "radial-gradient(circle, rgba(34, 197, 94, 0.9) 0%, rgba(34, 197, 94, 0.2) 60%, transparent 80%)",
                  "radial-gradient(circle, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.2) 60%, transparent 80%)",
                  "radial-gradient(circle, rgba(147, 51, 234, 0.9) 0%, rgba(147, 51, 234, 0.2) 60%, transparent 80%)",
                  "radial-gradient(circle, rgba(236, 72, 153, 0.9) 0%, rgba(236, 72, 153, 0.2) 60%, transparent 80%)",
                  "radial-gradient(circle, rgba(6, 182, 212, 0.9) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)",
                  "radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(245, 158, 11, 0.2) 60%, transparent 80%)",
                ][i % 6],
                animation: `desktop-float-${(i % 4) + 1} ${4 + (i % 3)}s ease-in-out infinite ${i * 0.3}s`,
                filter: `blur(${1 + (i % 2) * 0.5}px)`,
                boxShadow: `0 0 ${12 + (i % 3) * 6}px currentColor`,
              }}
            />
          ))}
        </div>

        {/* Desktop Pulsing Corner Accents */}
        <div className="absolute top-8 left-8 w-24 h-24 rounded-full opacity-40">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, rgba(59, 130, 246, 0.6) 40%, rgba(147, 51, 234, 0.3) 70%, transparent 90%)",
              animation: "desktop-pulse-corner 4s ease-in-out infinite",
              filter: "blur(6px)",
            }}
          />
        </div>
        <div className="absolute top-8 right-8 w-20 h-20 rounded-full opacity-35">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(236, 72, 153, 0.6) 40%, rgba(59, 130, 246, 0.3) 70%, transparent 90%)",
              animation: "desktop-pulse-corner 3.5s ease-in-out infinite 0.7s",
              filter: "blur(5px)",
            }}
          />
        </div>
        <div className="absolute bottom-8 left-8 w-28 h-28 rounded-full opacity-45">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(34, 197, 94, 0.6) 40%, rgba(6, 182, 212, 0.3) 70%, transparent 90%)",
              animation: "desktop-pulse-corner 4.5s ease-in-out infinite 1.2s",
              filter: "blur(7px)",
            }}
          />
        </div>
        <div className="absolute bottom-8 right-8 w-22 h-22 rounded-full opacity-38">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, rgba(245, 158, 11, 0.6) 40%, rgba(34, 197, 94, 0.3) 70%, transparent 90%)",
              animation: "desktop-pulse-corner 3.8s ease-in-out infinite 0.4s",
              filter: "blur(4px)",
            }}
          />
        </div>
      </div>

      {/* Mobile/Tablet Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden lg:hidden">
        {/* Animated Gradient Waves */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={`${sectionName}-mobile-wave-${i}`}
              className="absolute w-full h-32 opacity-40"
              style={{
                top: `${20 + i * 25}%`,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  rgba(34, 197, 94, ${0.3 + i * 0.1}) 25%,
                  rgba(59, 130, 246, ${0.4 + i * 0.1}) 50%,
                  rgba(147, 51, 234, ${0.3 + i * 0.1}) 75%,
                  transparent 100%)`,
                borderRadius: `${60 + i * 10}% ${40 - i * 5}% ${30 + i * 15}% ${70 - i * 10}% / ${50 + i * 20}% ${30 - i * 5}% ${40 + i * 10}% ${60 - i * 15}%`,
                filter: `blur(${8 + i * 2}px)`,
                animation: `mobile-wave-${i + 1} ${4 + i}s ease-in-out infinite`,
                transform: `skewY(${-2 + i}deg) rotate(${i * 2}deg)`,
              }}
            />
          ))}
        </div>

        {/* Mobile Floating Energy Dots */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={`${sectionName}-mobile-dot-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${10 + ((i * 11) % 80)}%`,
                top: `${15 + ((i * 13) % 70)}%`,
                width: `${4 + (i % 3)}px`,
                height: `${4 + (i % 3)}px`,
                background: [
                  "radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(236, 72, 153, 0.8) 0%, transparent 70%)",
                ][i % 4],
                animation: `mobile-float-${(i % 3) + 1} ${3 + (i % 2)}s ease-in-out infinite ${i * 0.2}s`,
                filter: `blur(${0.5 + (i % 2) * 0.5}px)`,
                boxShadow: `0 0 ${8 + (i % 3) * 4}px currentColor`,
              }}
            />
          ))}
        </div>

        {/* Mobile Pulsing Corner Accents */}
        <div className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-60">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(34, 197, 94, 0.6) 0%, rgba(59, 130, 246, 0.4) 50%, transparent 80%)",
              animation: "mobile-pulse-corner 3s ease-in-out infinite",
              filter: "blur(4px)",
            }}
          />
        </div>
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full opacity-50">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(147, 51, 234, 0.6) 0%, rgba(236, 72, 153, 0.4) 50%, transparent 80%)",
              animation: "mobile-pulse-corner 2.5s ease-in-out infinite 0.5s",
              filter: "blur(3px)",
            }}
          />
        </div>
        <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full opacity-55">
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(34, 197, 94, 0.4) 50%, transparent 80%)",
              animation: "mobile-pulse-corner 3.5s ease-in-out infinite 1s",
              filter: "blur(5px)",
            }}
          />
        </div>
      </div>

      {/* Dynamic Background Waves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
            radial-gradient(circle at 20% 80%, rgba(73, 146, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(63, 186, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(57, 135, 227, 0.1) 0%, transparent 50%)
          `,
            animation: "subtle-glow 12s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Aurora-like Moving Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-96 h-96 rounded-full opacity-15"
          style={{
            left: "10%",
            top: "20%",
            background:
              "linear-gradient(45deg, rgba(73, 146, 255, 0.4), rgba(63, 186, 255, 0.2))",
            filter: "blur(60px)",
            animation: "aurora 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full opacity-10"
          style={{
            right: "15%",
            bottom: "25%",
            background:
              "linear-gradient(-45deg, rgba(147, 51, 234, 0.4), rgba(236, 72, 153, 0.2))",
            filter: "blur(50px)",
            animation: "aurora 15s ease-in-out infinite reverse",
          }}
        />
      </div>
    </>
  );
};

export default EnhancedBackgroundEffects;
