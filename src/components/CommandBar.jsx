"use client";

import { useRef, useState } from "react";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { TOOLS } from "./ToolRail";

const MAX_FILES = 20;

export function CommandBar({ activeTool, onSend }) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef(null);
  const tool = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];
  const Icon = tool.icon;

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() && files.length === 0) return;
    onSend(value, files);
    setValue("");
    setFiles([]);
  }

  async function processFile(selected) {
    if (selected.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({ name: selected.name, mimeType: selected.type, dataUrl: reader.result });
        };
        reader.onerror = () => {
          resolve({ name: selected.name, mimeType: selected.type, error: true });
        };
        reader.readAsDataURL(selected);
      });
    }

    try {
      const { extractFileText } = await import("@/lib/extractText");
      const extractedText = await extractFileText(selected);
      if (extractedText === null) {
        return { name: selected.name, mimeType: selected.type, unsupported: true };
      }
      return { name: selected.name, mimeType: selected.type, extractedText };
    } catch (err) {
      return { name: selected.name, mimeType: selected.type, extractedText: "", error: true };
    }
  }

  async function addFiles(incoming) {
    if (!incoming.length) return;
    const room = MAX_FILES - files.length;
    if (room <= 0) return;
    const toProcess = incoming.slice(0, room);

    setExtracting(true);
    try {
      const processed = await Promise.all(toProcess.map(processFile));
      setFiles((prev) => [...prev, ...processed]);
    } finally {
      setExtracting(false);
    }
  }

  async function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    await addFiles(selected);
  }

  async function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || []);
    const pastedFiles = items
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (pastedFiles.length === 0) return;
    e.preventDefault();
    await addFiles(pastedFiles);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const placeholders = {
    chat: "Ask anything…",
    research: "What do you want to dig into?",
    math: "Type a problem to solve…",
    image: "Describe the image to generate…",
    video: "Describe a 15–20s clip…",
    schedule: "What should I put on your calendar?",
    meeting: "Paste notes or start recording…",
    design: "Describe the slide or layout you need…",
    website: "Describe the site you want to build…",
    seo: "Paste a URL or topic to optimize…",
  };

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl2 border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3 py-2 text-xs"
            >
              {file.dataUrl ? (
                <img src={file.dataUrl} alt={file.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <Paperclip size={14} />
              )}
              <span className="max-w-[160px] truncate text-muted dark:text-muted-dark">
                {file.name}
              </span>
              {file.error && <span className="text-red-400">couldn't read file</span>}
              {file.unsupported && <span className="text-red-400">unsupported file type</span>}
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
                className="text-muted dark:text-muted-dark hover:text-violet"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {extracting && (
            <span className="self-center text-xs text-violet">reading files…</span>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-xl2 border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3 shadow-sm"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet/10 text-violet">
          <Icon size={16} />
        </span>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholders[tool.id]}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted dark:placeholder:text-muted-dark font-mono"
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.docx,.pptx,.xlsx,.zip,.txt,.md,.csv,.json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted dark:text-muted-dark hover:text-violet transition-colors"
        >
          <Paperclip size={16} />
        </button>

        <button
          type="submit"
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          disabled={(!value.trim() && files.length === 0) || extracting}
        >
          <ArrowUp size={15} />
        </button>
      </form>
    </div>
  );
}