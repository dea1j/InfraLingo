import { X, Clock, ChevronRight, Server } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export default function HistorySidebar() {
  const { history, isHistoryOpen, setIsHistoryOpen, loadFromHistory } =
    useAppStore();

  return (
    <>
      {/* Background Overlay */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-[#1E293B] border-r border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isHistoryOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white">Architecture History</h2>
          </div>
          <button
            onClick={() => setIsHistoryOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Projects */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-600">
          {history.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 text-sm">
              <Server className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p>No architectures saved yet.</p>
              <p className="mt-1">Generate your first project!</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="w-full text-left p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                    {item.targetLanguage}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed">
                  "{item.originalPrompt}"
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 group-hover:text-blue-400 transition-colors">
                  <span>Click to reload</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
