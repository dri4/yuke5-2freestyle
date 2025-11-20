import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Keep a console trace for debugging routing issues
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
    // Immediately redirect to home so users don't linger on 404
    // Use replace to avoid adding the 404 to the history stack
    navigate("/", { replace: true });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="relative max-w-3xl w-full mx-4 sm:mx-6 md:mx-8 p-8 rounded-2xl">
        <div className="relative z-10 text-center">
          <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-2">
            <span className="inline-block mr-2">404</span>
            <span className="text-lg align-middle font-semibold opacity-90">Oops — Not Found</span>
          </div>

          <p className="mt-4 text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            We couldn’t find the page you were looking for. You will be redirected to the home page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
