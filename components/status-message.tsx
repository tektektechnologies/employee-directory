import type { Ref } from "react";

type StatusMessageProps = {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  ref?: Ref<HTMLDivElement>;
};

const toneClass = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-stone-200 bg-stone-100 text-stone-800",
};

export function StatusMessage({ tone, children, ref }: StatusMessageProps) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40 ${toneClass[tone]}`}
    >
      {children}
    </div>
  );
}
