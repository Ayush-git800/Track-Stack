"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  ThumbsDown,
  ThumbsUp,
  HelpCircle,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { LumiAvatar } from "@/components/lumi/lumi-avatar";
import { TrackStackFAQ, FAQCategory } from "@/lib/lumi/knowledge-base";
import { LumiSettings } from "@/lib/lumi/storage";
import { SupportRequest } from "@/lib/lumi/escalation";

export default function AdminLumiPage() {
  const [activeTab, setActiveTab] = useState<"faqs" | "analytics" | "settings" | "escalations">("faqs");
  const [faqs, setFaqs] = useState<TrackStackFAQ[]>([]);
  const [settings, setSettings] = useState<LumiSettings>({
    enabled: true,
    disabled_roles: [],
    maintenance_message: "Lumi is temporarily undergoing scheduled maintenance.",
    max_chars: 500,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // FAQ Modal
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<TrackStackFAQ | null>(null);
  const [modalQuestion, setModalQuestion] = useState("");
  const [modalAnswer, setModalAnswer] = useState("");
  const [modalCategory, setModalCategory] = useState<FAQCategory>("general");
  const [modalRoles, setModalRoles] = useState<string[]>(["student"]);

  // CSV Import
  const [csvText, setCsvText] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // Settings save alert
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [faqsRes, settingsRes, escRes] = await Promise.all([
        fetch("/api/lumi/faqs"),
        fetch("/api/lumi/settings"),
        fetch("/api/lumi/escalate"),
      ]);

      const faqsData = await faqsRes.json();
      const settingsData = await settingsRes.json();
      const escData = await escRes.json();

      setFaqs(faqsData.faqs || []);
      setSettings(settingsData.settings || settings);
      setAnalytics(settingsData.analytics || null);
      setSupportRequests(escData.supportRequests || []);
    } catch (err) {
      console.error("Failed to load Lumi admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/lumi/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSettingsNotice(true);
        setTimeout(() => setSavedSettingsNotice(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const handleToggleFaqActive = async (faq: TrackStackFAQ) => {
    const updated = { ...faq, active: !faq.active };
    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
    await fetch("/api/lumi/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: faq.id, active: updated.active }),
    });
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    await fetch(`/api/lumi/faqs?id=${id}`, { method: "DELETE" });
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setModalQuestion("");
    setModalAnswer("");
    setModalCategory("general");
    setModalRoles(["student"]);
    setShowFaqModal(true);
  };

  const handleOpenEditModal = (faq: TrackStackFAQ) => {
    setEditingFaq(faq);
    setModalQuestion(faq.question);
    setModalAnswer(faq.answer);
    setModalCategory(faq.category);
    setModalRoles(faq.roles || ["student"]);
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQuestion || !modalAnswer) return;

    if (editingFaq) {
      const res = await fetch("/api/lumi/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFaq.id,
          question: modalQuestion,
          answer: modalAnswer,
          category: modalCategory,
          roles: modalRoles,
        }),
      });
      const data = await res.json();
      if (data.faq) {
        setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? data.faq : f)));
      }
    } else {
      const res = await fetch("/api/lumi/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: modalQuestion,
          answer: modalAnswer,
          category: modalCategory,
          roles: modalRoles,
        }),
      });
      const data = await res.json();
      if (data.faq) {
        setFaqs((prev) => [data.faq, ...prev]);
      }
    }

    setShowFaqModal(false);
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) return;
    try {
      const res = await fetch("/api/lumi/faqs", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      });
      const data = await res.json();
      setCsvResult(`Successfully imported ${data.imported || 0} FAQs.`);
      fetchData();
      setTimeout(() => {
        setShowCsvModal(false);
        setCsvResult(null);
        setCsvText("");
      }, 2000);
    } catch {
      setCsvResult("Error parsing CSV.");
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex items-center gap-4">
          <LumiAvatar size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lumi AI Assistant Console</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  settings.enabled
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                    : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800"
                }`}
              >
                {settings.enabled ? "Active / Online" : "Maintenance Mode"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage Track Stack's knowledge base, evaluate query analytics, review downrated answers, and adjust assistant guardrails.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("faqs")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "faqs"
                ? "bg-white dark:bg-navy-850 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            FAQs ({faqs.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "analytics"
                ? "bg-white dark:bg-navy-850 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("escalations")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "escalations"
                ? "bg-white dark:bg-navy-850 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Escalations ({supportRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "settings"
                ? "bg-white dark:bg-navy-850 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* TAB 1: FAQS MANAGEMENT */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions or answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-cyan-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                <option value="membership">Membership</option>
                <option value="checkin">Check-in</option>
                <option value="submissions">Submissions</option>
                <option value="evaluations">Evaluations</option>
                <option value="events">Events</option>
                <option value="certificates">Certificates</option>
                <option value="duty_leave">Duty Leave</option>
                <option value="transcript">Transcript</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCsvModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add FAQ
              </button>
            </div>
          </div>

          {/* FAQs Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-navy-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-navy-800 font-semibold">
                  <tr>
                    <th className="p-3.5">Question</th>
                    <th className="p-3.5 w-32">Category</th>
                    <th className="p-3.5 w-32">Audience</th>
                    <th className="p-3.5 w-20 text-center">Active</th>
                    <th className="p-3.5 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
                  {filteredFaqs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No matching FAQs found.
                      </td>
                    </tr>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <tr key={faq.id} className="hover:bg-slate-50/60 dark:hover:bg-navy-850/40 transition">
                        <td className="p-3.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{faq.question}</p>
                          <p className="text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{faq.answer}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-medium">
                            {faq.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {faq.roles ? faq.roles.join(", ") : "All"}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleToggleFaqActive(faq)}
                            className={`w-7 h-4 rounded-full transition-colors relative inline-block ${
                              faq.active ? "bg-emerald-500" : "bg-slate-300 dark:bg-navy-700"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                                faq.active ? "translate-x-3" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(faq)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & DOWNRATED ANSWERS */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-xs text-slate-500">Total Conversations</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {analytics.total_conversations}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-xs text-slate-500">User Queries Processed</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {analytics.total_user_queries}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-xs text-slate-500">Satisfaction Rate</span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {analytics.satisfaction_rate}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
              <span className="text-xs text-slate-500">Downrated Answers</span>
              <p className="text-2xl font-bold text-amber-500 mt-1">
                {analytics.downvotes}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
              Top Query Categories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.entries(analytics.category_breakdown || {}).map(([cat, count]) => (
                <div key={cat} className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
                  <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{cat}</span>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{String(count)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Downrated Answers Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Downrated Answers Review (Needs Improvement)
              </h3>
            </div>
            {analytics.downrated_answers && analytics.downrated_answers.length > 0 ? (
              <div className="space-y-3">
                {analytics.downrated_answers.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/20 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">Q: "{item.user_query}"</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-1.5">Lumi Answer: "{item.lumi_response}"</p>
                    {item.comment && (
                      <p className="text-red-600 dark:text-red-400 italic">User Feedback: {item.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No downrated answers recorded. Great job!</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ESCALATIONS QUEUE */}
      {activeTab === "escalations" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              Escalated Support Tickets
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              When Lumi cannot confidently answer or student requests human assistance, requests are logged here and in-app alerts are dispatched.
            </p>

            {supportRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No open support escalations at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-800">
                {supportRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{req.user_name}</span>
                        <span className="text-slate-400">({req.user_email})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                          {req.target_role.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 font-medium">"{req.question}"</p>
                      <p className="text-slate-500 mt-0.5">{req.lumi_summary}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & MASTER TOGGLE */}
      {activeTab === "settings" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xs space-y-6 max-w-2xl">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lumi Controls & Policy</h2>

          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Master Lumi Switch</p>
              <p className="text-[11px] text-slate-500">Enable or disable Lumi across the entire platform.</p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative inline-block ${
                settings.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-navy-700"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Maintenance Message (Shown when Lumi is disabled)
            </label>
            <textarea
              value={settings.maintenance_message}
              onChange={(e) => setSettings((s) => ({ ...s, maintenance_message: e.target.value }))}
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-cyan-500"
            />
          </div>

          {/* Max Input Characters */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Max Characters per User Query
            </label>
            <input
              type="number"
              value={settings.max_chars}
              onChange={(e) => setSettings((s) => ({ ...s, max_chars: Number(e.target.value) || 500 }))}
              className="w-32 text-xs p-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Save Lumi Settings
            </button>
            {savedSettingsNotice && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Settings updated successfully!
              </span>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT FAQ MODAL */}
      {showFaqModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-6 shadow-2xl">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-4">
              {editingFaq ? "Edit Knowledge Base FAQ" : "Add New FAQ to Knowledge Base"}
            </h3>
            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={modalQuestion}
                  onChange={(e) => setModalQuestion(e.target.value)}
                  placeholder="e.g. How does QR check-in work?"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Answer (Markdown Supported)</label>
                <textarea
                  required
                  rows={4}
                  value={modalAnswer}
                  onChange={(e) => setModalAnswer(e.target.value)}
                  placeholder="Detailed answer text..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={modalCategory}
                    onChange={(e) => setModalCategory(e.target.value as FAQCategory)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  >
                    <option value="membership">membership</option>
                    <option value="checkin">checkin</option>
                    <option value="submissions">submissions</option>
                    <option value="evaluations">evaluations</option>
                    <option value="events">events</option>
                    <option value="certificates">certificates</option>
                    <option value="duty_leave">duty_leave</option>
                    <option value="transcript">transcript</option>
                    <option value="general">general</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Target Roles</label>
                  <input
                    type="text"
                    value={modalRoles.join(", ")}
                    onChange={(e) => setModalRoles(e.target.value.split(",").map((r) => r.trim()))}
                    placeholder="student, coordinator..."
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFaqModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  {editingFaq ? "Save Changes" : "Create FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-6 shadow-2xl">
            <h3 className="font-semibold text-base text-slate-900 dark:text-white mb-2">
              Bulk Import FAQs via CSV
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Format: <code>question,answer,category,roles,active</code> (one per line)
            </p>

            {csvResult ? (
              <div className="p-3 mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs">
                {csvResult}
              </div>
            ) : (
              <>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`"How do I join?","Go to /clubs and tap Join.","membership","student",true`}
                  className="w-full p-2.5 font-mono text-[11px] rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white mb-3"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-navy-700 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportCsv}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
                  >
                    Import FAQs
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
