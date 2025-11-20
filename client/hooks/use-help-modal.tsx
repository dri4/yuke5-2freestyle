import React, { createContext, useContext, useState } from "react";

interface HelpModalContextType {
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (isOpen: boolean) => void;
}

const HelpModalContext = createContext<HelpModalContextType | undefined>(undefined);

export const useHelpModal = () => {
  const context = useContext(HelpModalContext);
  if (!context) {
    throw new Error("useHelpModal must be used within HelpModalProvider");
  }
  return context;
};

export const HelpModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <HelpModalContext.Provider value={{ isHelpModalOpen, setIsHelpModalOpen }}>
      {children}
    </HelpModalContext.Provider>
  );
};