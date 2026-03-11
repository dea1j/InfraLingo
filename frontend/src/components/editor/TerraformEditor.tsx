import Editor from "@monaco-editor/react";
import { useAppStore } from "../../store/useAppStore";
import { Copy, Check, Download, Lock } from "lucide-react";
import { useState } from "react";

export default function TerraformEditor() {
  const { terraformCode, user } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(terraformCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!user) {
      alert(
        "Downloading Terraform files is a premium feature. Please sign in to unlock!"
      );
      return;
    }

    const blob = new Blob([terraformCode], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "main.tf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full relative group">
      {/* Action Buttons Container */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Premium Download Button */}
        <button
          onClick={handleDownload}
          className={`p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-medium border ${
            user
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              : "bg-slate-800 text-slate-400 hover:text-slate-300 border-slate-700"
          }`}
          title={user ? "Download main.tf" : "Sign in to download"}
        >
          {user ? (
            <Download className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {user ? "Download" : "Pro"}
        </button>

        {/* Free Copy Button */}
        <button
          onClick={handleCopy}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-medium border border-slate-600"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy HCL"}
        </button>
      </div>

      {/* The Monaco Editor Instance */}
      <Editor
        height="100%"
        width="100%"
        language="hcl"
        theme="vs-dark"
        value={terraformCode}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          padding: { top: 48 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
        }}
      />
    </div>
  );
}
