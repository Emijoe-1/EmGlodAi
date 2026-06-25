"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Check, CalendarPlus, Loader2 } from "lucide-react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

function flattenText(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node?.props?.children) return flattenText(node.props.children);
  return "";
}

function CopyButton({ text, className = "", label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // Clipboard API unavailable — fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`inline-flex items-center gap-1 text-muted dark:text-muted-dark hover:text-violet transition-colors ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

function PreBlock({ children, ...props }) {
  const codeText = flattenText(children).replace(/\n$/, "");
  return (
    <div className="group relative my-2">
      <pre {...props} className="overflow-x-auto rounded-lg">
        {children}
      </pre>
      <CopyButton
        text={codeText}
        label="Copy"
        className="absolute right-2 top-2 rounded-md bg-bg/90 dark:bg-bg-dark/90 px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}

function extractCalendarEvent(content) {
  const match = content.match(/```calendar-event\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function stripCalendarBlock(content) {
  return content.replace(/```calendar-event\s*([\s\S]*?)```/, "").trim();
}

function AddToCalendarButton({ event }) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleAdd() {
    setStatus("loading");
    const { data } = await supabase.auth.getSession();
    const accessToken = data?.session?.provider_token;

    if (!accessToken) {
      setStatus("error");
      setMessage("Please log out and sign in with Google again to grant calendar access.");
      return;
    }

    try {
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, ...event }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add event");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div className="mt-3 rounded-xl2 border border-line dark:border-line-dark bg-bg dark:bg-bg-dark p-3">
      <p className="text-xs font-medium">{event.title}</p>
      <p className="mt-1 text-xs text-muted dark:text-muted-dark">
        {new Date(event.startDateTime).toLocaleString()} —{" "}
        {new Date(event.endDateTime).toLocaleTimeString()}
      </p>
      <button
        onClick={handleAdd}
        disabled={status === "loading" || status === "done"}
        className="mt-2 flex items-center gap-2 rounded-lg bg-violet px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "loading" && <Loader2 size={13} className="animate-spin" />}
        {status === "done" && <Check size={13} />}
        {status === "idle" && <CalendarPlus size={13} />}
        {status === "done" ? "Added to calendar" : "Add to Google Calendar"}
      </button>
      {status === "error" && <p className="mt-2 text-xs text-red-400">{message}</p>}
    </div>
  );
}

export function ChatMessage({ role, content, files, generatedImage }) {
  const isUser = role === "user";
  const imageFiles = (files || []).filter((f) => f.mimeType?.startsWith("image/"));
  const otherFiles = (files || []).filter((f) => !f.mimeType?.startsWith("image/"));

  const calendarEvent = !isUser ? extractCalendarEvent(content) : null;
  const displayContent = calendarEvent ? stripCalendarBlock(content) : content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[75%] flex-col gap-1">
        <div
          className={`rounded-xl2 px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-violet text-white"
              : "bg-surface dark:bg-surface-dark border border-line dark:border-line-dark"
          }`}
        >
          {imageFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {imageFiles.map((f, i) => (
                <img
                  key={i}
                  src={f.dataUrl}
                  alt={f.name}
                  className="max-h-48 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          {otherFiles.length > 0 && (
            <div className="mb-2 flex flex-col gap-0.5">
              {otherFiles.map((f, i) => (
                <p key={i} className="text-xs opacity-80">
                  📎 {f.name}
                </p>
              ))}
            </div>
          )}
          {generatedImage && (
            <img
              src={generatedImage}
              alt="Generated"
              className="mb-2 max-w-full rounded-lg"
            />
          )}
          {isUser ? (
            content
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-li:my-0.5 prose-table:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{ pre: PreBlock }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}
          {calendarEvent && <AddToCalendarButton event={calendarEvent} />}
        </div>

        {!isUser && content && (
          <CopyButton text={content} label="Copy" className="self-start px-1 text-xs" />
        )}
      </div>
    </div>
  );
}