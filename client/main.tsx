import { createRoot } from "react-dom/client";
import App from "./App";
import "./performance-optimizations.css";
import "./mobile-services-animation-fix.css";
import "./services-smooth-animation.css";
import "./simple-view-desktop.css";
import "./simple-view-responsive.css";
import "./framer-motion-fixes.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Use React's concurrent features for better performance
const root = createRoot(rootElement);

// Render with error boundary
root.render(<App />);
