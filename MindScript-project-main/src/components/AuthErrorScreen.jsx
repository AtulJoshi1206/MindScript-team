import React from "react";
import { AlertTriangle } from "lucide-react";

const AuthErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-pop-in">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
           style={{ background: 'rgba(244,63,94,0.1)' }}>
        <AlertTriangle className="w-7 h-7 text-ms-secondary" />
      </div>
      <h2 className="text-xl font-bold text-ms-text mb-2">Something went wrong</h2>
      <p className="text-ms-muted text-sm mb-4">{error}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      )}
    </div>
  </div>
);

export default AuthErrorScreen;
