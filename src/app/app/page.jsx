"use client";


import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ToolRail, TOOLS } from "@/components/ToolRail";
import { CommandBar } from "@/components/CommandBar";
import { ChatMessage } from "@/components/ChatMessage";
import { LengthToggle } from "@/components/LengthToggle";
import { LogOut, Menu, X, Plus, MessageSquare, Trash2, Zap } from "lucide-react";

export default function HubPage() {
  const router = useRouter();
  const [session, setSession] = useState(undefined);
  const [activeTool, setActiveTool] = useState("chat");
  const [responseLength, setResponseLength] = useState("balanced");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const scrollRef = useRef(null);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) router.replace("/login");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
  if (session) {
    loadConversations();
    loadCredits();
  }
}, [session]);

async function loadCredits() {
  const { data } = await supabase
    .from("user_credits")
    .select("credits")
    .eq("user_id", session.user.id)
    .single();
  if (data) setCredits(data.credits);
}

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false });
    setConversations(data || []);
  }

  async function loadMessages(conversationId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages(
      (data || []).map((m) => ({
        role: m.role,
        content: m.content,
        files: m.files,
        generatedImage: m.generated_image,
      }))
    );
  }

  async function selectConversation(conv) {
    setActiveConversationId(conv.id);
    setActiveTool(conv.tool);
    await loadMessages(conv.id);
    setNavOpen(false);
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setNavOpen(false);
  }

  async function deleteConversation(id, e) {
    e.stopPropagation();
    await supabase.from("conversations").delete().eq("id", id);
    if (id === activeConversationId) startNewChat();
    loadConversations();
  }

  async function ensureConversation(firstMessageText) {
    if (activeConversationId) return activeConversationId;
    const title = (firstMessageText || "New chat").slice(0, 40);
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: session.user.id, tool: activeTool, title })
      .select()
      .single();
    if (error) return null;
    setActiveConversationId(data.id);
    loadConversations();
    return data.id;
  }

  async function saveMessage(conversationId, msg) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      files: msg.files || null,
      generated_image: msg.generatedImage || null,
    });
  }

  async function handleSend(text, files) {
    const userMsg = { role: "user", content: text, files };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    const conversationId = await ensureConversation(text);
    if (conversationId) saveMessage(conversationId, userMsg);

    if (activeTool === "image") {
      const encodedPrompt = encodeURIComponent(text || "an abstract image");
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      const assistantMsg = {
        role: "assistant",
        content: `Here's your image for: "${text}"`,
        generatedImage: imageUrl,
      };
      setMessages((m) => [...m, assistantMsg]);
      if (conversationId) saveMessage(conversationId, assistantMsg);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: nextMessages, tool: activeTool, length: responseLength }),
      });
      const data = await res.json();
      const assistantMsg = { role: "assistant", content: data.text || `Error: ${data.error}` };
      setMessages((m) => [...m, assistantMsg]);
      if (typeof data.creditsRemaining === "number") setCredits(data.creditsRemaining);
      if (conversationId) saveMessage(conversationId, assistantMsg);
    } catch (err) {
      const assistantMsg = { role: "assistant", content: `Error: ${err.message}` };
      setMessages((m) => [...m, assistantMsg]);
      if (conversationId) saveMessage(conversationId, assistantMsg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function selectTool(tool) {
    setActiveTool(tool.id);
    setNavOpen(false);
  }

  if (session === undefined) return null;

  const activeLabel = TOOLS.find((t) => t.id === activeTool)?.label || activeTool;

  const fullName =
    session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name;
  const firstName = fullName ? fullName.split(" ")[0] : session?.user?.email?.split("@")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex h-screen">
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-line dark:border-line-dark bg-bg dark:bg-bg-dark transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 md:flex md:flex-col ${
          navOpen ? "translate-x-0 flex flex-col" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="font-display text-lg font-semibold">EmGlodAi</span>
          <button
            onClick={() => setNavOpen(false)}
            className="text-muted dark:text-muted-dark md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <ToolRail activeTool={activeTool} onSelect={selectTool} />

        <button
          onClick={startNewChat}
          className="mx-3 mt-2 flex items-center gap-2 rounded-xl2 border border-line dark:border-line-dark px-3 py-2 text-sm font-medium hover:border-violet transition-colors"
        >
          <Plus size={15} />
          New chat
        </button>

        <div className="mt-2 flex-1 overflow-y-auto px-3">
          <p className="px-1 py-2 text-[10px] uppercase tracking-wider text-muted dark:text-muted-dark">
            Recent
          </p>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                conv.id === activeConversationId
                  ? "bg-violet/10 text-violet"
                  : "text-muted dark:text-muted-dark hover:bg-surface dark:hover:bg-surface-dark"
              }`}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              <span
                onClick={(e) => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-line dark:border-line-dark p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted dark:text-muted-dark">
            {session?.user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm font-medium text-muted dark:text-muted-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors"
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-line dark:border-line-dark px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              className="text-muted dark:text-muted-dark md:hidden"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <LengthToggle value={responseLength} onChange={setResponseLength} />
<ThemeToggle />
</div>
{credits !== null && (
  <span className="flex items-center gap-1.5 rounded-full border border-line dark:border-line-dark px-3 py-1 text-xs font-medium text-muted dark:text-muted-dark">
    <Zap size={12} className="text-violet" />
    {credits} credit{credits === 1 ? "" : "s"}
  </span>
)}
</header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {greeting}, {firstName}
              </h2>
              <p className="mt-2 text-sm text-muted dark:text-muted-dark">
                What's the goal for today?
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              files={m.files}
              generatedImage={m.generatedImage}
            />
          ))}
          {loading && (
            <p className="text-sm text-muted dark:text-muted-dark font-mono">thinking…</p>
          )}
        </div>

        <div className="px-4 pb-4 md:px-6 md:pb-6">
          <CommandBar activeTool={activeTool} onSend={handleSend} />
        </div>
      </main>
    </div>
  );
}