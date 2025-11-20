import React, { createContext, useContext, useState } from "react";

interface PinkThemeContextType {
  // canonical names used internally
  isPinkTheme: boolean;
  setIsPinkTheme: (isPink: boolean) => void;
  // backward-compatible names expected by some components
  isPinkActive?: boolean;
  togglePinkTheme?: () => void;
  togglePink?: () => void;
}

const PinkThemeContext = createContext<PinkThemeContextType | undefined>(undefined);

export const usePinkTheme = () => {
  const context = useContext(PinkThemeContext);
  if (!context) {
    throw new Error("usePinkTheme must be used within PinkThemeProvider");
  }
  return context;
};

export const PinkThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPinkTheme, setIsPinkTheme] = useState(false);

  // Provide backward-compatible API surface expected by existing components
  const value: PinkThemeContextType = {
    isPinkTheme,
    setIsPinkTheme,
    isPinkActive: isPinkTheme,
    togglePinkTheme: () => setIsPinkTheme((s) => !s),
    togglePink: () => setIsPinkTheme((s) => !s),
  };

  return <PinkThemeContext.Provider value={value}>{children}</PinkThemeContext.Provider>;
};