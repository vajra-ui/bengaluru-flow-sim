import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="h-screen w-full flex items-center justify-center"
      style={{
        background: `
          radial-gradient(circle at center, rgba(255, 0, 150, 0.25) 0%, transparent 40%),
          linear-gradient(135deg, #0f001f, #2a004d, #5f0aa3)
        `,
      }}
    >
      <div className="text-center px-4 animate-fadeIn">
        <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 flex items-center justify-center animate-pulse">
          <span className="text-6xl md:text-7xl drop-shadow-[0_0_40px_rgba(0,200,255,0.6)]">🚦</span>
        </div>

        <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wide font-mono">
          TN TRAFFIC INTEL
        </h1>

        <p className="text-white/80 mt-3 text-sm md:text-base">
          Tamil Nadu Traffic Intelligence System
        </p>
      </div>
    </div>
  );
}
