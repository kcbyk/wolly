import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 max-w-md w-full flex flex-col items-center gap-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Bir Hata Oluştu</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || "Beklenmedik bir durum oluştu."}
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  window.location.hash = "";
                  window.location.reload();
                }}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile</span>
              </button>
              <button
                onClick={() => {
                  window.location.hash = "";
                  this.setState({ hasError: false });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#212121] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ana Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
