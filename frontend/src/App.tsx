import { useState, useEffect } from "react";
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
  History,
  GraduationCap,
  Coins,
  CheckCircle2,
  XCircle,
  FileDown,
  ChevronUp,
  ChevronDown,
  Plus,
  Languages,
} from "lucide-react";
import ArchitectureCanvas from "./components/canvas/ArchitectureCanvas";
import TerraformEditor from "./components/editor/TerraformEditor";
import ReactMarkdown from "react-markdown";
import AuthModal from "./components/auth/AuthModal";
import HistorySidebar from "./components/history/HistorySidebar";
import html2pdf from "html2pdf.js";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showExplanations, setShowExplanations] = useState<
    Record<number, boolean>
  >({});

  const {
    generateArchitecture,
    isGenerating,
    error,
    localizedDocs,
    estimatedCost,
    costBreakdown,
    quiz,
    user,
    logout,
    guestGenerations,
    setIsHistoryOpen,
    fetchHistory,
    isGeneratingMore,
    generateMoreQuestions,
    translateExistingDocs,
    isTranslating,
  } = useAppStore();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const githubToken = urlParams.get("token");
    const githubEmail = urlParams.get("email");
    const githubId = urlParams.get("id");

    if (githubToken && githubEmail && githubId) {
      localStorage.setItem("infralingo_token", githubToken);
      localStorage.setItem(
        "infralingo_user",
        JSON.stringify({ id: githubId, email: githubEmail })
      );

      useAppStore.setState({
        token: githubToken,
        user: { id: githubId, email: githubEmail },
      });

      fetchHistory();

      window.history.replaceState({}, document.title, "/");
    }
  }, [user, fetchHistory]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSelectedAnswers({});
    setShowExplanations({});
    await generateArchitecture(prompt, targetLanguage, studyMode);
    setIsFormExpanded(false);
  };

  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: option }));
    setShowExplanations((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("architecture-docs-content");
    if (!element) return;

    const opt = {
      margin: 10,
      filename: "infralingo-architecture.pdf",
      image: { type: "png" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowHeight: element.scrollHeight,
        backgroundColor: "#0F172A",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex h-screen w-full bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <HistorySidebar />

      {/* LEFT PANEL: Input & Documentation */}
      <div className="w-1/3 min-w-100 max-w-125 border-r border-slate-700 bg-[#1E293B] flex flex-col z-20 relative shadow-xl">
        {/* Top Section: Header & Form */}
        <div className="p-6 border-b border-slate-700 flex flex-col transition-all duration-300">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Box className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white tracking-tight">
                InfraLingo
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Form Toggle Button */}
              <button
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-md border border-slate-600 transition-colors"
                title="Toggle Form"
              >
                {isFormExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md border border-slate-600 transition-colors"
                  >
                    <History className="w-4 h-4" /> My Projects
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-full border border-slate-600 transition-colors"
                >
                  <UserCircle className="w-4 h-4" /> Sign In
                </button>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE FORM WRAPPER */}
          {isFormExpanded && (
            <div className="flex flex-col gap-4 mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
              <form onSubmit={handleGenerate} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 mb-1 block">
                    Architecture Request
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. A highly available AWS VPC with public and private subnets..."
                    className="w-full h-32 p-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                      <Globe className="w-4 h-4" /> Docs Language
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="flex-1 p-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English (Default)</option>
                        <optgroup label="Europe">
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                          <option value="nl">Dutch</option>
                          <option value="ru">Russian</option>
                          <option value="uk">Ukrainian</option>
                        </optgroup>
                        <optgroup label="Asia & Middle East">
                          <option value="ja">Japanese</option>
                          <option value="zh">Chinese (Simplified)</option>
                          <option value="ko">Korean</option>
                          <option value="hi">Hindi</option>
                          <option value="ar">Arabic</option>
                          <option value="vi">Vietnamese</option>
                          <option value="tr">Turkish</option>
                          <option value="he">Hebrew</option>
                        </optgroup>
                        <optgroup label="Africa & Others">
                          <option value="sw">Swahili</option>
                          <option value="id">Indonesian</option>
                        </optgroup>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            setIsAuthModalOpen(true);
                          } else {
                            translateExistingDocs(targetLanguage);
                          }
                        }}
                        disabled={
                          isTranslating ||
                          !localizedDocs ||
                          localizedDocs.includes(
                            "Generated docs will appear here"
                          )
                        }
                        className="flex items-center justify-center px-3 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded-lg hover:bg-purple-600/40 transition-colors disabled:opacity-50"
                        title="Premium: Translate Docs On-the-Fly"
                      >
                        {isTranslating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Languages className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Study Mode Toggle */}
                  <div className="flex-1">
                    <label className="text-sm font-medium text-slate-400 mb-1 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" /> Study Mode
                    </label>
                    <button
                      type="button"
                      onClick={() => setStudyMode(!studyMode)}
                      className={`w-full p-2.5 rounded-lg border font-medium focus:outline-none transition-colors flex items-center justify-center gap-2 ${
                        studyMode
                          ? "bg-purple-900/50 border-purple-500 text-purple-300"
                          : "bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {studyMode ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {isGenerating ? "Designing..." : "Generate"}
                </button>
              </form>

              {!user && (
                <div className="text-center text-xs text-slate-500">
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
                <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documentation & Quiz Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-2">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="w-5 h-5" />
              <h2 className="font-semibold text-white">Documentation</h2>
            </div>

            {/* Download Buttons Group */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([localizedDocs], {
                    type: "text/markdown;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "architecture-docs.md";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={
                  !localizedDocs ||
                  localizedDocs.includes("Generated docs will appear here")
                }
                className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> .md
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={
                  !localizedDocs ||
                  localizedDocs.includes("Generated docs will appear here")
                }
                className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-3 py-1.5 rounded-md border border-slate-600 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-600">
            <div
              id="architecture-docs-content"
              className="prose prose-invert max-w-none 
                         prose-p:text-slate-300 prose-p:leading-relaxed 
                         prose-headings:text-indigo-400 prose-headings:font-bold prose-headings:tracking-tight
                         prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-2
                         prose-h3:text-lg prose-h3:text-purple-400
                         prose-strong:text-emerald-400 prose-strong:font-semibold
                         prose-ul:list-disc prose-ul:pl-5 
                         prose-ol:list-decimal prose-ol:pl-5 
                         prose-li:text-slate-300 prose-li:marker:text-purple-500 prose-li:marker:font-bold
                         prose-code:text-pink-400 prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                         prose-pre:bg-[#0F172A] prose-pre:border prose-pre:border-slate-700 prose-pre:shadow-xl
                         prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-a:transition-colors"
            >
              <ReactMarkdown>{localizedDocs}</ReactMarkdown>
            </div>

            {/* Interactive Quiz Area */}
            {quiz && quiz.length > 0 && (
              <div className="mt-10 pt-8 border-t border-slate-700">
                <div className="flex items-center gap-2 mb-6 text-purple-400">
                  <GraduationCap className="w-6 h-6" />
                  <h3 className="text-lg font-bold text-white">
                    Knowledge Check
                  </h3>
                </div>

                <div className="space-y-8">
                  {quiz.map((q, i) => {
                    const isAnswered = showExplanations[i];
                    const selected = selectedAnswers[i];
                    const isCorrect = selected === q.correctAnswer;

                    return (
                      <div
                        key={i}
                        className="bg-slate-800/50 p-5 rounded-xl border border-slate-700"
                      >
                        <p className="font-medium text-slate-200 mb-4">
                          {i + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            let btnClass =
                              "w-full text-left p-3 rounded-lg border text-sm transition-all ";

                            if (!isAnswered) {
                              btnClass +=
                                "border-slate-600 hover:border-blue-500 hover:bg-slate-700 text-slate-300";
                            } else {
                              if (opt === q.correctAnswer) {
                                btnClass +=
                                  "border-emerald-500 bg-emerald-900/30 text-emerald-200";
                              } else if (opt === selected) {
                                btnClass +=
                                  "border-red-500 bg-red-900/30 text-red-200";
                              } else {
                                btnClass +=
                                  "border-slate-700 opacity-50 text-slate-400";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isAnswered}
                                onClick={() => handleAnswerSelect(i, opt)}
                                className={btnClass}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div
                            className={`mt-4 p-4 rounded-lg flex gap-3 ${
                              isCorrect
                                ? "bg-emerald-900/20 border border-emerald-800/50"
                                : "bg-red-900/20 border border-red-800/50"
                            }`}
                          >
                            <div className="mt-0.5">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-sm font-semibold mb-1 ${
                                  isCorrect
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {isCorrect ? "Correct!" : "Incorrect"}
                              </p>
                              <p className="text-sm text-slate-300">
                                {q.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Generate More Questions Button */}
                <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-center">
                  <button
                    onClick={() => generateMoreQuestions(targetLanguage)}
                    disabled={isGeneratingMore}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {isGeneratingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isGeneratingMore
                      ? "Generating..."
                      : "Generate 5 More Questions"}
                  </button>
                </div>
              </div>
            )}
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

          {estimatedCost && (
            <div className="absolute top-4 right-4 z-10 bg-emerald-900/80 backdrop-blur px-3 py-1.5 rounded-md border border-emerald-700 flex flex-col items-end gap-1 text-sm text-emerald-300 group cursor-help transition-all">
              <div className="flex items-center gap-2 font-medium">
                <Coins className="w-4 h-4" /> {estimatedCost}
              </div>

              {costBreakdown && costBreakdown.length > 0 && (
                <div className="hidden group-hover:flex flex-col gap-2 mt-2 bg-slate-900 p-4 rounded-md border border-slate-700 text-xs text-slate-300 w-80 shadow-2xl absolute top-full right-0 z-20">
                  <div className="text-slate-500 font-semibold mb-1 border-b border-slate-700 pb-2">
                    Monthly Cost Breakdown
                  </div>
                  {costBreakdown.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-start gap-4 py-1.5 border-b border-slate-800/50 last:border-0"
                    >
                      <span className="flex-1 leading-relaxed whitespace-normal">
                        {item.component}
                      </span>
                      <span className="text-emerald-400 font-mono whitespace-nowrap shrink-0 pt-0.5">
                        {item.cost}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <ArchitectureCanvas />
        </div>

        {/* Bottom Half: Terraform Code */}
        <div className="h-1/3 min-h-62.5 relative bg-[#1E1E1E]">
          <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-2 text-sm text-slate-300">
            <Code2 className="w-4 h-4" /> main.tf
          </div>

          <TerraformEditor />
        </div>
      </div>
    </div>
  );
}
