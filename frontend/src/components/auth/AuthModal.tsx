import { useState } from "react";
import { X, Cloud, History, Download, Github, Mail } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, register, authError, isAuthenticating } = useAppStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password);
    }

    if (!useAppStore.getState().authError) {
      onClose();
    }
  };

  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E293B] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-700 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* LEFT SIDE: The Pitch */}
        <div className="bg-slate-800 p-8 md:w-5/12 border-r border-slate-700 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade Your Stack
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Create a free account to unlock professional infrastructure tools
            and bypass the guest limits.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-blue-900/50 p-3 rounded-lg h-fit">
                <Cloud className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Multi-Cloud Targets
                </h3>
                <p className="text-sm text-slate-400">
                  Deploy to AWS, unlock GCP architectures, or target Azure
                  environments.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-emerald-900/50 p-3 rounded-lg h-fit">
                <History className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Architecture History
                </h3>
                <p className="text-sm text-slate-400">
                  We automatically save your visual nodes and Terraform code to
                  your dashboard.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-purple-900/50 p-3 rounded-lg h-fit">
                <Download className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">One-Click Exports</h3>
                <p className="text-sm text-slate-400">
                  Download production-ready zip files containing main.tf,
                  variables.tf, and outputs.tf.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The Form */}
        <div className="p-8 md:w-7/12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isLogin
                ? "Enter your credentials to access your workspace."
                : "Join the next generation of cloud engineering."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-400 mb-1 block">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="developer@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              {isAuthenticating
                ? "Processing..."
                : isLogin
                ? "Sign In with Email"
                : "Create Account"}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          {/* NEW: Live GitHub Auth Button */}
          <button
            type="button"
            onClick={handleGithubLogin}
            className="mt-6 w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="mt-8 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
