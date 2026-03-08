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
        <img
          src="/logo.png"
          alt="Safety Dost Logo"
          className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 animate-pulse drop-shadow-[0_0_40px_rgba(255,0,150,0.6)]"
        />

        <h1 className="text-white text-3xl md:text-4xl font-bold tracking-wide">
          SAFETY DOST
        </h1>

        <p className="text-white/80 mt-3 text-sm md:text-base">
          Your Smart Safety Companion
        </p>
      </div>
    </div>
  );
}
