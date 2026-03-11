import { useState } from "react";
import { useAppStore } from "./store/useAppStore";
import {
  Sparkles,
  Loader2,
  Box,
  Code2,
  FileText,
  Globe,
  UserCircle,
  LogOut,
  Download,
} from "lucide-react";
import ArchitectureCanvas from "./components/canvas/ArchitectureCanvas";
import TerraformEditor from "./components/editor/TerraformEditor";
import ReactMarkdown from "react-markdown";
import AuthModal from "./components/auth/AuthModal";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const {
    generateArchitecture,
    isGenerating,
    error,
    localizedDocs,
    user,
    logout,
    guestGenerations,
  } = useAppStore();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await generateArchitecture(prompt, targetLanguage);
  };

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      {/* LEFT PANEL: Input & Documentation */}
      <div className="w-1/3 min-w-[400px] max-w-[500px] border-r border-slate-700 bg-[#1E293B] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Box className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                InfraLingo
              </h1>
            </div>

            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full border border-slate-600 transition-colors"
              >
                <UserCircle className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>

          {/* AI Input Form */}
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-400 mb-1 block">
                Architecture Request
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A highly available AWS VPC with public and private subnets, an RDS database, and an application load balancer."
                className="w-full h-32 p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Globe className="w-4 h-4" /> Docs Language
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English (Default)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="mt-6 flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {isGenerating ? "Designing..." : "Generate"}
              </button>
            </div>
          </form>
          {/* Guest Generations Counter */}
          {!user && (
            <div className="mt-4 text-center text-xs text-slate-500">
              {guestGenerations > 0 ? (
                `${guestGenerations} free generation${
                  guestGenerations === 1 ? "" : "s"
                } remaining.`
              ) : (
                <span className="text-red-400">
                  Free limits exhausted. Sign in for unlimited access.
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Documentation Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="w-5 h-5" />
              <h2 className="font-semibold text-white">Documentation</h2>
            </div>

            {/* Download Docs Button */}
            <button
              onClick={() => {
                const blob = new Blob([localizedDocs], {
                  type: "text/markdown;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "architecture-docs.md";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              disabled={
                !localizedDocs ||
                localizedDocs.includes("Generated docs will appear here")
              }
              className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600 transition-colors"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              Save .md
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-600">
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              <ReactMarkdown>{localizedDocs}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Canvas & Editor */}
      <div className="flex-1 flex flex-col">
        {/* Top Half: React Flow Canvas */}
        <div className="flex-1 relative border-b border-slate-700 bg-[#0F172A]">
          <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-2 text-sm text-slate-300">
            <Box className="w-4 h-4" /> Visual Architecture
          </div>

          <ArchitectureCanvas />
        </div>

        {/* Bottom Half: Terraform Code */}
        <div className="h-1/3 min-h-[250px] relative bg-[#1E1E1E]">
          <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-2 text-sm text-slate-300">
            <Code2 className="w-4 h-4" /> main.tf
          </div>

          {/* BAM! The VS Code Editor goes here */}
          <TerraformEditor />
        </div>
      </div>
    </div>
  );
}
