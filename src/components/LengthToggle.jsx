"use client";

const OPTIONS = [
  { id: "concise", label: "Concise" },
  { id: "balanced", label: "Balanced" },
  { id: "detailed", label: "Detailed" },
];

export function LengthToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-xl2 border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            value === opt.id
              ? "bg-violet text-white"
              : "text-muted dark:text-muted-dark hover:text-violet"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}