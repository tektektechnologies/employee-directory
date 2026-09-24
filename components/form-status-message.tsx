type FormStatusMessageProps = {
  tone: "error" | "success" | "info";
  message: string;
};

const toneClassNames: Record<FormStatusMessageProps["tone"], string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-stone-200 bg-stone-100 text-stone-800",
};

export function FormStatusMessage({ tone, message }: FormStatusMessageProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2.5 text-sm ${toneClassNames[tone]}`}
    >
      {message}
    </p>
  );
}
