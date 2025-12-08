import React from "react";
import { AlertTriangle, WifiOff } from "lucide-react";

const AuthErrorScreen = ({ error, onGuestMode }) => (
  <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <div className="bg-dark-card p-8 rounded-3xl shadow-xl max-w-md w-full border-2 border-dark-accent/40 animate-pop-in">
      <div className="bg-dark-accent/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-dark-accent animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-dark-text mb-3">
        Authentication Error
      </h2>
      <p className="text-dark-text opacity-80 text-sm mb-6">
        {error.message && error.message.includes("configuration-not-found")
          ? "It looks like Anonymous Authentication is disabled in your Firebase Console." 
          : "We couldn't connect to the authentication server."}
      </p>

      <div className="bg-dark-bg p-4 rounded-xl text-left text-xs text-dark-text opacity-70 mb-6 font-mono border border-dark-text/20 overflow-x-auto">
        {error.message || JSON.stringify(error)}
      </div>

      <p className="text-xs text-dark-text opacity-60 mb-6">
        To fix: Go to Firebase Console  Authentication  Sign-in method 
        Enable Anonymous.
      </p>

      <button
        onClick={onGuestMode}
        className="w-full bg-dark-primary hover:bg-dark-secondary text-white font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg animate-slide-in-left"
      >
        <WifiOff size={18} /> Continue as Guest (Local Mode)
      </button>
    </div>
  </div>
);

export default AuthErrorScreen;
