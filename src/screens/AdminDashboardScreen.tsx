import { useState, useEffect, useRef } from "react";
import { Booking, BookingStatus, Provider } from "../types";
import { DATE_OPTIONS } from "../data/providers";

interface AdminDashboardScreenProps {
  providers: Provider[];
  bookings: Booking[];
  onToggleSlotAvailability: (providerId: string, dateKey: string, slotTime: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
}

interface KnowledgeDocItem {
  documentId: string;
  title: string;
  category: string;
  sourceType: string;
  providerId?: string;
  chunksCount: number;
  sampleContent: string;
  updatedAt: string;
}

interface ChatbotStats {
  totalQueries: number;
  totalDocs: number;
  totalChunks: number;
  avgResponseTimeMs: number;
  intentCounts: Record<string, number>;
}

export function AdminDashboardScreen({
  providers,
  bookings,
  onToggleSlotAvailability,
  onUpdateBookingStatus,
}: AdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "slots" | "knowledge">("queue");
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id ?? "");
  const [selectedDateKey, setSelectedDateKey] = useState<string>("2024-10-18");

  // Knowledge Base State
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocItem[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbMessage, setKbMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [stats, setStats] = useState<ChatbotStats | null>(null);

  // Form State for Adding / Uploading Document
  const [showAddForm, setShowAddForm] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("General");
  const [docSourceType, setDocSourceType] = useState<"faq" | "policy" | "provider" | "upload">("faq");
  const [docProviderId, setDocProviderId] = useState("");
  const [docContent, setDocContent] = useState("");
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live test search in admin
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [testSearching, setTestSearching] = useState(false);

  const activeBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalRevenue = [...activeBookings, ...completedBookings].reduce(
    (sum, b) => sum + b.price,
    0
  );
  const totalOpenToday = providers.reduce(
    (sum, p) => sum + (p.slotsByDate["2024-10-18"] ?? []).filter((s) => s.available).length,
    0
  );

  const selectedProvider =
    providers.find((p) => p.id === selectedProviderId) ?? providers[0];
  const slotsForDate = selectedProvider?.slotsByDate[selectedDateKey] ?? [];

  // Fetch knowledge base documents and stats when Knowledge tab is opened
  useEffect(() => {
    if (activeTab === "knowledge") {
      fetchKnowledgeDocs();
      fetchStats();
    }
  }, [activeTab]);

  const fetchKnowledgeDocs = async () => {
    setKbLoading(true);
    try {
      const res = await fetch("/api/knowledge/documents");
      if (res.ok) {
        const data = await res.json();
        setKnowledgeDocs(data.documents || []);
      }
    } catch {
      // fallback
    } finally {
      setKbLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/chat/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // fallback
    }
  };

  const handleSyncKnowledge = async () => {
    setKbLoading(true);
    setKbMessage(null);
    try {
      const res = await fetch("/api/knowledge/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeDocs(data.documents || []);
        setKbMessage({
          text: `Successfully synchronized and indexed ${data.count} knowledge base documents with pgvector embeddings!`,
          type: "success",
        });
        fetchStats();
      } else {
        setKbMessage({ text: "Failed to re-index knowledge base.", type: "error" });
      }
    } catch {
      setKbMessage({ text: "Network error while syncing knowledge base.", type: "error" });
    } finally {
      setKbLoading(false);
    }
  };

  const handleDeleteDoc = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document from the vector knowledge base?")) return;
    try {
      const res = await fetch(`/api/knowledge/documents/${documentId}`, { method: "DELETE" });
      if (res.ok) {
        setKnowledgeDocs((prev) => prev.filter((d) => d.documentId !== documentId));
        setKbMessage({ text: "Document removed from knowledge base.", type: "success" });
        fetchStats();
      }
    } catch {
      setKbMessage({ text: "Failed to delete document.", type: "error" });
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setSubmittingDoc(true);
    setKbMessage(null);
    try {
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle.trim(),
          category: docCategory,
          sourceType: docSourceType,
          providerId: docProviderId || undefined,
          content: docContent.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setKbMessage({
          text: `Document '${docTitle}' successfully embedded into ${data.chunksCount} vector chunks!`,
          type: "success",
        });
        setDocTitle("");
        setDocContent("");
        setShowAddForm(false);
        fetchKnowledgeDocs();
        fetchStats();
      } else {
        setKbMessage({ text: data.error || "Failed to ingest document.", type: "error" });
      }
    } catch {
      setKbMessage({ text: "Network error during document ingestion.", type: "error" });
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
        setDocContent(content);
        setDocSourceType("upload");
        setShowAddForm(true);
      }
    };
    reader.readAsText(file);
  };

  const handleTestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setTestSearching(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testQuery,
          context: { providers },
        }),
      });
      const data = await res.json();
      setTestResults(data.sources || []);
    } catch {
      setTestResults([]);
    } finally {
      setTestSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 space-y-space-md">
      <div className="pt-space-xs">
        <h1 className="text-headline-lg-mobile text-on-surface font-bold">
          Provider &amp; RAG Admin Console
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Monitor bookings, toggle live slots, and manage the vector knowledge base for the AI booking assistant.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
          <span className="text-label-sm text-on-surface-variant block">Active Bookings</span>
          <span className="text-headline-md text-primary font-bold mt-1 block tabular-nums">
            {activeBookings.length}
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
          <span className="text-label-sm text-on-surface-variant block">Booked Revenue</span>
          <span className="text-headline-md text-secondary font-bold mt-1 block tabular-nums">
            ${totalRevenue}
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
          <span className="text-label-sm text-on-surface-variant block">Open Slots Today</span>
          <span className="text-headline-md text-on-surface font-bold mt-1 block tabular-nums">
            {totalOpenToday}
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
          <span className="text-label-sm text-on-surface-variant block">RAG Indexed Docs</span>
          <span className="text-headline-md text-tertiary-container font-bold mt-1 block tabular-nums">
            {knowledgeDocs.length || stats?.totalDocs || 10}
          </span>
        </div>
      </div>

      {/* 3-Way Navigation Switcher */}
      <div className="grid grid-cols-3 p-1 bg-surface-container rounded-xl gap-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`py-2 px-3 rounded-lg text-label-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "queue"
              ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>Bookings ({bookings.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("slots")}
          className={`py-2 px-3 rounded-lg text-label-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "slots"
              ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>Live Slots</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("knowledge")}
          className={`py-2 px-3 rounded-lg text-label-md transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "knowledge"
              ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">neurology</span>
          <span>RAG Knowledge</span>
        </button>
      </div>

      {/* TAB 1: BOOKINGS QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl bg-surface-container-lowest p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-outline-variant/20"
            >
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={booking.providerImage}
                  alt={booking.providerName}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 bg-surface-container"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-label-lg text-on-surface font-bold truncate">
                      {booking.customerName}
                    </span>
                    <span className="text-label-sm text-on-surface-variant font-mono">
                      {booking.confirmationCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-label-sm font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-secondary-container text-on-secondary-container"
                          : booking.status === "completed"
                            ? "bg-surface-container-high text-primary"
                            : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface mt-0.5">
                    {booking.providerName} · {booking.serviceName} ({booking.priceLabel})
                  </p>
                  <p className="text-body-sm text-on-surface-variant tabular-nums">
                    {booking.dateLabel} at {booking.time}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {booking.status === "confirmed" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdateBookingStatus(booking.id, "completed")}
                      className="px-3 py-2 rounded-lg bg-secondary text-on-secondary text-label-md font-semibold hover:opacity-95 transition-opacity"
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBookingStatus(booking.id, "cancelled")}
                      className="px-3 py-2 rounded-lg bg-error-container text-on-error-container text-label-md font-semibold hover:opacity-95 transition-opacity"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {booking.status !== "confirmed" && (
                  <button
                    type="button"
                    onClick={() => onUpdateBookingStatus(booking.id, "confirmed")}
                    className="px-3 py-2 rounded-lg bg-surface-container text-primary text-label-md font-semibold hover:bg-surface-container-high transition-colors"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SLOT AVAILABILITY */}
      {activeTab === "slots" && (
        <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-4 border border-outline-variant/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="admin-provider-select"
                className="text-label-md text-on-surface-variant block mb-1.5"
              >
                Select Provider
              </label>
              <select
                id="admin-provider-select"
                value={selectedProvider?.id}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-label-lg focus:outline-none"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-label-md text-on-surface-variant block mb-1.5">
                Select Date
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {DATE_OPTIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDateKey(d.key)}
                    className={`py-2 rounded-xl text-center transition-all ${
                      d.key === selectedDateKey
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <span className="block text-[10px] opacity-80">{d.dayShort}</span>
                    <span className="block text-label-md font-bold tabular-nums">{d.dayNum}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-body-sm text-on-surface-variant mb-2.5">
              Tap any time slot below to toggle it between <strong>Open</strong> and{" "}
              <strong>Blocked / Booked</strong>. Changes update live across Explore &amp; Provider Details.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {slotsForDate.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    selectedProvider &&
                    onToggleSlotAvailability(selectedProvider.id, selectedDateKey, slot.time)
                  }
                  className={`py-3 px-2 rounded-xl text-label-md font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 tabular-nums ${
                    slot.available
                      ? "bg-secondary-container text-on-secondary-container shadow-xs"
                      : "bg-surface-container-high text-outline"
                  }`}
                >
                  <span>{slot.time}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide">
                    {slot.available ? "Open" : "Blocked"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE & RAG MANAGEMENT */}
      {activeTab === "knowledge" && (
        <div className="space-y-4">
          {/* Status Message Alert */}
          {kbMessage && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-center justify-between gap-2 ${
                kbMessage.type === "success"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              <span>{kbMessage.text}</span>
              <button
                type="button"
                onClick={() => setKbMessage(null)}
                className="font-bold text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Action Header & Tools */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-label-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                <span>RAG Knowledge Management</span>
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Upload policy documents, maintain FAQs, and re-embed data into Supabase pgvector.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-label-sm font-semibold hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm((prev) => !prev)}
                className="px-3 py-2 rounded-xl bg-surface-container text-primary text-label-sm font-semibold hover:bg-surface-container-high flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>{showAddForm ? "Close Form" : "Add FAQ / Text"}</span>
              </button>

              <button
                type="button"
                disabled={kbLoading}
                onClick={handleSyncKnowledge}
                className="px-3 py-2 rounded-xl bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    kbLoading ? "animate-spin" : ""
                  }`}
                >
                  sync
                </span>
                <span>Sync All Knowledge</span>
              </button>
            </div>
          </div>

          {/* Add Knowledge Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddDocument}
              className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-primary/30 space-y-3 animate-fade-in"
            >
              <h3 className="text-label-lg font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">post_add</span>
                <span>Ingest Knowledge Document</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Weekend Late Cancellation Policy"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none border border-outline-variant/30"
                  />
                </div>

                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">
                    Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none border border-outline-variant/30"
                  >
                    <option value="General">General</option>
                    <option value="Booking Policies">Booking Policies</option>
                    <option value="User Accounts">User Accounts</option>
                    <option value="FAQ">FAQ</option>
                    <option value="Salon & Spa">Salon &amp; Spa</option>
                    <option value="Fitness & Yoga">Fitness &amp; Yoga</option>
                    <option value="Auto Care">Auto Care</option>
                    <option value="Tutoring & Prep">Tutoring &amp; Prep</option>
                    <option value="Legal & Consulting">Legal &amp; Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">
                    Source Type
                  </label>
                  <select
                    value={docSourceType}
                    onChange={(e) => setDocSourceType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none border border-outline-variant/30"
                  >
                    <option value="faq">FAQ</option>
                    <option value="policy">Policy</option>
                    <option value="provider">Provider Info</option>
                    <option value="upload">Uploaded Document</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1">
                  Document Content (will be automatically chunked &amp; embedded)
                </label>
                <textarea
                  rows={4}
                  required
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Enter full text, instructions, questions and answers, or paste policy clauses..."
                  className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm focus:outline-none border border-outline-variant/30"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-label-md font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc || !docTitle.trim() || !docContent.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingDoc ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Embedding...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Embed &amp; Ingest</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Test Vector Search Playground */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/20">
            <h3 className="text-label-md font-bold text-on-surface flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">search</span>
              <span>Test Vector Semantic Retrieval</span>
            </h3>
            <form onSubmit={handleTestSearch} className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Type a test user question e.g. 'Can I get a refund if I cancel?'"
                className="flex-1 h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm border border-outline-variant/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={testSearching || !testQuery.trim()}
                className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-label-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {testSearching ? "Searching..." : "Test Retrieval"}
              </button>
            </form>

            {testResults && (
              <div className="mt-3 p-3 rounded-xl bg-surface-container-low space-y-2 text-xs">
                <span className="font-semibold text-primary block">
                  Retrieved Chunks ({testResults.length}):
                </span>
                {testResults.length === 0 ? (
                  <p className="text-on-surface-variant">No matching chunks found above threshold.</p>
                ) : (
                  testResults.map((src, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30"
                    >
                      <p className="font-bold text-on-surface">
                        {src.title}{" "}
                        <span className="text-[10px] text-secondary">({src.category})</span>
                      </p>
                      <p className="text-on-surface-variant mt-0.5">{src.excerpt}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 overflow-hidden">
            <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
              <span className="text-label-md font-bold text-on-surface">
                Indexed Documents ({knowledgeDocs.length})
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Stored with 1536-dim embeddings
              </span>
            </div>

            <div className="divide-y divide-outline-variant/20 overflow-x-auto">
              {knowledgeDocs.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant text-sm">
                  <p>No custom documents loaded. Click "Sync All Knowledge" above to load initial documents.</p>
                </div>
              ) : (
                knowledgeDocs.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-label-md font-bold text-on-surface">
                          {doc.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                          {doc.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                          {doc.sourceType}
                        </span>
                        <span className="text-[11px] text-secondary font-semibold">
                          {doc.chunksCount} chunk{doc.chunksCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1">
                        {doc.sampleContent}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.documentId)}
                        title="Delete from vector DB"
                        className="px-2.5 py-1.5 rounded-lg text-error hover:bg-error-container/40 text-label-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
