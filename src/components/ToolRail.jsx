"use client";

import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Calculator,
  Search,
  Calendar,
  Mic,
  LayoutTemplate,
  Globe,
  TrendingUp,
} from "lucide-react";

export const TOOLS = [
  { id: "chat", label: "Chat", icon: MessageSquare, command: "" },
  { id: "research", label: "Research", icon: Search, command: "/research" },
  { id: "math", label: "Math", icon: Calculator, command: "/math" },
  { id: "image", label: "Image", icon: ImageIcon, command: "/image" },
  { id: "video", label: "Video", icon: Video, command: "/video", comingSoon: true },
{ id: "meeting", label: "Meeting", icon: Mic, command: "/meeting", comingSoon: true },
  { id: "schedule", label: "Schedule", icon: Calendar, command: "/schedule" },
  { id: "design", label: "Design", icon: LayoutTemplate, command: "/design" },
  { id: "website", label: "Website", icon: Globe, command: "/website" },
  { id: "seo", label: "SEO", icon: TrendingUp, command: "/seo" },
];
export function ToolRail({ activeTool, onSelect }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => !tool.comingSoon && onSelect(tool)}
            disabled={tool.comingSoon}
            className={`flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-violet text-white"
                : tool.comingSoon
                ? "text-muted/50 dark:text-muted-dark/50 cursor-not-allowed"
                : "text-muted dark:text-muted-dark hover:bg-surface dark:hover:bg-surface-dark"
            }`}
          >
            <Icon size={17} />
            {tool.label}
            {tool.comingSoon && (
              <span className="ml-auto rounded-full bg-violet/10 px-2 py-0.5 text-[10px] text-violet">
                Soon
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
