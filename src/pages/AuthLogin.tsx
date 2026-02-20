import { useState } from "react";

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"commuter" | "operator">("commuter");

  const handleLogin = () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      alert("Enter valid 10-digit Indian mobile number");
      return;
    }

    if (password.length < 4) {
      alert("Password too short");
      return;
    }

    // ✅ Save role for dashboard use
    localStorage.setItem("userRole", role);

    // ✅ Role-based redirect
    if (role === "operator") {
      window.location.hash = "#/operator";
    } else {
      window.location.hash = "#/dashboard";
    }

    onLoginSuccess?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600">
      <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-10 w-full max-w-md border border-white/40">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/safety-dost-logo.png"
            alt="Safety Dost"
            className="w-28 h-28 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold mt-3 bg-gradient-to-r from-pink-600 to-purple-700 bg-clip-text text-transparent">
            Safety Dost
          </h1>
          <p className="text-gray-500 text-sm">Your Guardian Friend</p>
        </div>

        {/* ✅ Role Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setRole("commuter")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              role === "commuter"
                ? "bg-white shadow text-purple-700"
                : "text-gray-500"
            }`}
          >
            Commuter
          </button>

          <button
            onClick={() => setRole("operator")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              role === "operator"
                ? "bg-white shadow text-purple-700"
                : "text-gray-500"
            }`}
          >
            Operator
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Mobile */}
          <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
            <span className="px-3 text-gray-500 font-medium">+91</span>
            <input
              type="tel"
              placeholder="Mobile number"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, ""))
              }
              maxLength={10}
              className="w-full px-2 py-3 outline-none text-gray-900 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 placeholder:text-gray-400"
          />

          {/* Button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-700 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
          >
            Login
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          New user?{" "}
          <span className="text-purple-600 font-semibold cursor-pointer">
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;