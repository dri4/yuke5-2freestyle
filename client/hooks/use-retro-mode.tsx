import React, { createContext, useContext, useState } from "react";

type RetroMode = "normal" | "retro";

interface RetroModeContextType {
  mode: RetroMode;
  toggleMode: () => void;
}

const RetroModeContext = createContext<RetroModeContextType | undefined>(undefined);

export const useRetroMode = () => {
  const context = useContext(RetroModeContext);
  if (!context) {
    throw new Error("useRetroMode must be used within RetroModeProvider");
  }
  return context;
};

export const RetroModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<RetroMode>("normal");

  const toggleMode = () => setMode(prev => prev === "normal" ? "retro" : "normal");

  return (
    <RetroModeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </RetroModeContext.Provider>
  );
};