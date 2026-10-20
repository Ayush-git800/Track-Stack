"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  Send,
  RotateCcw,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ExternalLink,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { LumiAvatar } from "./lumi-avatar";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: string;
  sender: "user" | "lumi";
  content: string;
  deepLinks?: { label: string; href: string }[];
  toolCalls?: string[];
  canEscalate?: boolean;
  rating?: "up" | "down";
  timestamp: string;
}

interface LumiChatDrawerProps {
  isPreLogin?: boolean;
}

export function LumiChatDrawer({ isPreLogin = false }: LumiChatDrawerProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateSummary, setEscalateSummary] = useState("");
  const [escalateSuccess, setEscalateSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: Message = {
        id: "welcome-msg",
        sender: "lumi",
        content: isPreLogin
          ? "Hi there! I'm **Lumi**, your Track Stack assistant. Before you sign in, I can answer general questions about Mirai School of Technology clubs, attendance policies, and platform features. What would you like to know?"
          : `Hello ${user ? user.full_name.split(" ")[0] : ""}! I'm **Lumi**, your Track Stack assistant. How can I assist you with your clubs, attendance, assignments, or certificates today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        deepLinks: isPreLogin
          ? [{ label: "Sign In", href: "/login" }]
          : [
              { label: "My Attendance", href: "/dashboard" },
              { label: "Browse Clubs", href: "/clubs" },
            ],
      };
      setMessages([welcome]);
    }
  }, [isPreLogin, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Quick suggestions
  const suggestionChips = isPreLogin
    ? [
        "What is Track Stack?",
        "Why is there a 2-club limit?",
        "How does QR check-in work?",
        "Who can participate?",
      ]
    : [
        "Check my attendance",
        "What are my pending assignments?",
        "Why is there a 2-club limit?",
        "How do I scan the check-in QR?",
        "View my certificates",
        "Duty Leave status",
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      content: text.slice(0, 500),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/lumi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          user: isPreLogin ? null : user,
          currentPage: pathname,
          conversationId,
          isPreLogin,
          history: messages.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const lumiMessage: Message = {
        id: data.messageId || `lum-${Date.now()}`,
        sender: "lumi",
        content: data.text || "I'm sorry, I couldn't process that. Please try asking again.",
        deepLinks: data.deepLinks || [],
        toolCalls: data.toolCalls || [],
        canEscalate: data.canEscalate || false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, lumiMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "lumi",
          content: "Sorry, I had trouble connecting. Please check your connection and try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (messageId: string, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, rating } : m))
    );

    try {
      await fetch("/api/lumi/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "fresh-msg",
        sender: "lumi",
        content: "New chat started! How can I help you right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        deepLinks: [{ label: "Browse Clubs", href: "/clubs" }],
      },
    ]);
  };

  const handleClearHistory = async () => {
    if (!user?.id) {
      handleResetChat();
      return;
    }

    try {
      await fetch(`/api/lumi/conversations?userId=${user.id}`, { method: "DELETE" });
      handleResetChat();
    } catch {
      handleResetChat();
    }
  };

  const handleEscalateConfirm = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.sender === "user")?.content || "Help request";
      const res = await fetch("/api/lumi/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          question: lastUserMsg,
          lumiSummary: escalateSummary || "Student requested direct coordinator assistance via Lumi.",
          category: "General Query",
        }),
      });
      const data = await res.json();
      setEscalateSuccess(data.message || "Request submitted to coordinator!");
      setTimeout(() => {
        setShowEscalateModal(false);
        setEscalateSuccess(null);
        setEscalateSummary("");
      }, 2500);
    } catch {
      setEscalateSuccess("Request sent! Your coordinator has been alerted.");
      setTimeout(() => setShowEscalateModal(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format basic markdown (bold, list, links) safely
  const formatMarkdown = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Bold replace
      let formatted: React.ReactNode = line;
      const parts = line.split(/(\*\*.*?\*\*)/g);
      if (parts.length > 1) {
        formatted = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });
      }

      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-cyan-500 font-bold">•</span>
            <span>{typeof formatted === "string" ? formatted.replace(/^[•\-]\s*/, "") : formatted}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 leading-relaxed">
          {formatted}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Above mobile bottom-nav) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Lumi AI Assistant"
          className="fixed bottom-20 md:bottom-6 right-5 md:right-8 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#060B18] text-white shadow-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] border border-cyan-500/40 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 group"
        >
          {/* Circular Mascot with Gradient Ring and Unread Hint Dot */}
          <div className="relative p-0.5 rounded-full bg-linear-to-tr from-cyan-400 via-blue-500 to-violet-600">
            <LumiAvatar size="sm" state="idle" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#060B18]"></span>
            </span>
          </div>

          <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5 pr-1 tracking-tight">
            Ask Lumi
          </span>
        </button>
      )}

      {/* Chat Drawer / Modal Container */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 flex flex-col w-full h-full md:w-[420px] md:h-[620px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-navy-800 bg-slate-50/90 dark:bg-navy-950/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <LumiAvatar size="sm" state={isLoading ? "thinking" : "idle"} />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">Lumi</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    AI Assistant
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPreLogin ? "General Help Mode" : "Track Stack Assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <button
                onClick={handleResetChat}
                title="New Chat"
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-navy-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {!isPreLogin && (
                <button
                  onClick={handleClearHistory}
                  title="Delete Chat History"
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-navy-800 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-navy-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/30 dark:bg-navy-900/30 custom-scrollbar">
            {/* Empty / Welcome State Lockup (Dark Navy container blending in both light and dark themes) */}
            {messages.length <= 1 && (
              <div className="my-2 p-3.5 rounded-2xl bg-[#060B18] border border-cyan-500/30 shadow-lg text-center max-w-[320px] mx-auto transition-transform hover:scale-[1.01]">
                <div className="relative w-full h-24 mb-1 flex items-center justify-center">
                  <Image
                    src="/logos/lumi-lockup.png"
                    alt="Lumi AI Assistant"
                    width={260}
                    height={130}
                    className="object-contain max-h-24 w-auto drop-shadow-md select-none pointer-events-none"
                    priority
                  />
                </div>
                <p className="text-[11px] text-cyan-200/80 leading-snug font-medium">
                  {isPreLogin
                    ? "Ask anything about MSOT clubs, check-in policies, and platform features."
                    : "Your intelligent guide to clubs, attendance, activities, and verified transcripts."}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "lumi" && (
                  <div className="shrink-0 mt-0.5">
                    <LumiAvatar size="sm" state="idle" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                    msg.sender === "user"
                      ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs"
                      : "bg-white dark:bg-navy-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-navy-700/80 rounded-tl-xs"
                  }`}
                >
                  {/* Message Text with basic markdown */}
                  <div className="text-[13px] leading-relaxed break-words">
                    {formatMarkdown(msg.content)}
                  </div>

                  {/* Deep Link Action Buttons */}
                  {msg.deepLinks && msg.deepLinks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-navy-700 flex flex-wrap gap-1.5">
                      {msg.deepLinks.map((link, lIdx) => (
                        <Link
                          key={lIdx}
                          href={link.href}
                          onClick={() => {
                            if (window.innerWidth < 768) setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
                        >
                          {link.label}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Escalation Button */}
                  {msg.canEscalate && !isPreLogin && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-navy-700">
                      <button
                        onClick={() => setShowEscalateModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Contact a human (Coordinator)
                      </button>
                    </div>
                  )}

                  {/* Assistant Footer: Copy & Thumbs Rating */}
                  {msg.sender === "lumi" && (
                    <div className="mt-2 pt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{msg.timestamp}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-600 dark:hover:text-slate-300 transition"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleRating(msg.id, "up")}
                          className={`hover:text-emerald-500 transition ${msg.rating === "up" ? "text-emerald-500 font-bold" : ""}`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRating(msg.id, "down")}
                          className={`hover:text-red-500 transition ${msg.rating === "down" ? "text-red-500 font-bold" : ""}`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-center">
                <LumiAvatar size="sm" state="thinking" />
                <div className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-tl-xs flex items-center gap-1.5 shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Chips (Horizontal Scroll) */}
          <div className="px-3 py-2 border-t border-slate-200/60 dark:border-navy-800/60 bg-slate-50/50 dark:bg-navy-950/40 overflow-x-auto flex gap-1.5 custom-scrollbar">
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 shadow-xs transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box & Char Counter */}
          <div className="p-3 border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
            <div className="relative flex items-end rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 focus-within:border-cyan-500 dark:focus-within:border-cyan-500 transition-colors shadow-xs">
              <textarea
                ref={textareaRef}
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isPreLogin ? "Ask about MSOT clubs, check-in, policies..." : "Ask Lumi anything about your clubs, attendance..."}
                rows={1}
                className="w-full resize-none bg-transparent px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden max-h-24"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="m-1.5 p-2 rounded-lg bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-between items-center mt-1 px-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span>English / हिन्दी / Hinglish</span>
              <span>{input.length} / 500</span>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Route to Human Support</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              Lumi will package your recent query and notify your Club Coordinator or Campus Manager directly in-app.
            </p>
            {escalateSuccess ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200">
                {escalateSuccess}
              </div>
            ) : (
              <>
                <textarea
                  value={escalateSummary}
                  onChange={(e) => setEscalateSummary(e.target.value)}
                  placeholder="Optional brief note for the coordinator..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white mb-3 focus:outline-cyan-500"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowEscalateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEscalateConfirm}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                  >
                    Send to Coordinator
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
