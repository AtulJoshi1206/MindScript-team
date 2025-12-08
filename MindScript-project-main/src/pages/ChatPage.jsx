import React, { useRef, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  Activity,
  Send,
  Smile,
  Frown,
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";

import ScrollingFooter from "../components/ScrollingFooter";

const ChatPage = ({
  chatHistory,
  currentMessage,
  setCurrentMessage,
  handleSendMessage,
  isLoading,
  mentalScore,
  showGraph,
  setShowGraph,
  scoreHistory,
  address,
  setAddress,
  findProfessionals,
  chatEndRef
}) => {
  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // FIX: Wait for modal layout before mounting chart
  const [canRenderChart, setCanRenderChart] = useState(false);

  useEffect(() => {
    if (showGraph) {
      requestAnimationFrame(() => setCanRenderChart(true));
    } else {
      setCanRenderChart(false);
    }
  }, [showGraph]);

  const formatChartDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-dark-text animate-fade-in">

      {/* Header */}
      <header className="bg-dark-card shadow-lg p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-dark-bg rounded-full flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6 text-dark-primary animate-spin-slow" />
          </div>

          <div>
            <h1 className="font-bold text-dark-text text-xl">Sathi</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  mentalScore > 70
                    ? "bg-green-500"
                    : mentalScore > 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                } animate-pulse`}
              ></span>
              <span className="text-sm text-dark-text opacity-80">
                Live Score: {mentalScore}
              </span>
            </div>
          </div>
        </div>

        {/* Chart toggle button */}
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="bg-dark-bg p-2.5 rounded-full hover:bg-dark-primary/20 text-dark-primary transition-colors relative shadow-md animate-pop-in"
        >
          <Activity size={22} />
          {scoreHistory.length >= 3 && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-dark-accent rounded-full border-2 border-dark-card animate-bounce-slow"></span>
          )}
        </button>
      </header>

      {/* ==================== GRAPH MODAL ==================== */}

      {showGraph && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">

          <div className="bg-dark-card rounded-3xl w-full max-w-xl p-8 shadow-2xl animate-pop-in border border-dark-primary/30">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold text-dark-primary">
                Your Mental Curve
              </h3>
              <button
                onClick={() => setShowGraph(false)}
                className="text-dark-text/70 hover:text-dark-accent transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* ==== FIXED GRAPH RENDERING BLOCK ===== */}

            {scoreHistory.length > 1 ? (
              <div
                className="h-72 w-full"
                style={{ minWidth: 0, minHeight: 0 }} // <-- Fix flex shrink issue
              >
                {canRenderChart && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scoreHistory.map((s) => ({
                        ...s,
                        date: new Date(s.timestamp).getTime()
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#4a5568"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        minTickGap={30}
                        tick={{ fill: "#e2e8f0", fontSize: 12 }}
                        axisLine={{ stroke: "#4a5568" }}
                        tickLine={{ stroke: "#4a5568" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#e2e8f0", fontSize: 12 }}
                        axisLine={{ stroke: "#4a5568" }}
                        tickLine={{ stroke: "#4a5568" }}
                      />
                      <Tooltip
                        labelFormatter={(label) =>
                          new Date(label).toLocaleString()
                        }
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                          backgroundColor: "#2d3748",
                          color: "#e2e8f0"
                        }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#81e6d9"
                        strokeWidth={4}
                        dot={{
                          r: 5,
                          fill: "#81e6d9",
                          strokeWidth: 2,
                          stroke: "#1a202c"
                        }}
                        activeDot={{ r: 7, fill: "#81e6d9", stroke: "#fff" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <p className="text-center text-sm text-dark-text opacity-60 mt-4">
                  Score trajectory over time
                </p>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-dark-text/60 text-lg bg-dark-bg rounded-xl border border-dashed border-dark-text/30 animate-fade-in">
                Not enough data points yet. Keep chatting!
              </div>
            )}

            {/* Footer Recommendations */}
            <div className="mt-8 pt-8 border-t border-dark-card">
              {mentalScore >= 70 ? (
                <div className="bg-dark-primary/20 p-5 rounded-2xl border border-dark-primary/40 text-center animate-pop-in">
                  <Smile className="w-10 h-10 text-dark-primary mx-auto mb-3 animate-bounce-small" />
                  <p className="text-dark-text font-medium text-lg">
                    "Happiness is not something ready made. It comes from your
                    own actions."
                  </p>
                  <p className="text-sm text-dark-text opacity-70 mt-2">
                    - Dalai Lama
                  </p>
                </div>
              ) : mentalScore <= 40 ? (
                <div className="bg-dark-accent/20 p-5 rounded-2xl border border-dark-accent/40 animate-pop-in">
                  <div className="flex items-center gap-3 mb-3 justify-center text-dark-accent">
                    <Frown className="w-6 h-6" />
                    <span className="font-semibold text-lg">
                      Professional Support
                    </span>
                  </div>

                  <p className="text-base text-dark-text opacity-80 mb-4 text-center">
                    It seems you are going through a tough time. Consider
                    reaching out to a professional nearby.
                  </p>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter your city/area"
                      className="flex-1 border border-dark-text/20 rounded-xl px-4 py-2.5 text-base focus:ring-2 focus:ring-dark-accent outline-none bg-dark-bg text-dark-text placeholder-dark-text/50"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button
                      onClick={findProfessionals}
                      className="bg-dark-accent text-white px-5 py-2.5 rounded-xl text-base font-semibold hover:bg-orange-600 transition-colors shadow-md"
                    >
                      Find
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-secondary/20 p-5 rounded-2xl border border-dark-secondary/40 text-center animate-pop-in">
                  <RefreshCw className="w-8 h-8 text-dark-secondary mx-auto mb-3 animate-spin-slow" />
                  <p className="text-dark-text font-medium text-lg">
                    "Keep going. Everything you need will come to you at the
                    perfect time."
                  </p>
                  <p className="text-sm text-dark-text opacity-70 mt-2">
                    - Unknown
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4 custom-scrollbar">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div
              className={`max-w-[75%] p-4 rounded-3xl shadow-lg text-base leading-relaxed relative ${
                msg.role === "user"
                  ? "bg-dark-primary text-white rounded-br-none animation-bounce-right"
                  : "bg-dark-card text-dark-text rounded-bl-none border border-dark-text/10 animation-bounce-left"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-dark-card p-3 rounded-2xl rounded-bl-none shadow-md border border-dark-text/10 flex gap-1 items-center">
              <span
                className="w-2.5 h-2.5 bg-dark-primary rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></span>
              <span
                className="w-2.5 h-2.5 bg-dark-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></span>
              <span
                className="w-2.5 h-2.5 bg-dark-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-dark-card border-t border-dark-text/10 pb-12 shadow-xl">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-dark-bg border border-dark-text/20 rounded-full px-5 py-3.5 focus:ring-2 focus:ring-dark-primary outline-none transition-all text-dark-text placeholder-dark-text/50 text-base shadow-inner"
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-dark-primary hover:bg-dark-secondary text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 animate-pop-in"
          >
            <Send size={22} />
          </button>
        </div>
      </div>

      <ScrollingFooter />
    </div>
  );
};

export default ChatPage;
