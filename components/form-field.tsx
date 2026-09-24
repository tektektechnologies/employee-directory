type FormFieldProps = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  defaultValue?: string;
  errorMessage?: string;
  hint?: string;
  required?: boolean;
  minLength?: number;
};

export function FormField({
  name,
  label,
  type,
  autoComplete,
  defaultValue,
  errorMessage,
  hint,
  required = true,
  minLength,
}: FormFieldProps) {
  const inputId = `field-${name}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={describedBy}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 aria-invalid:border-red-600 aria-invalid:focus-visible:ring-red-600/30 sm:text-sm"
      />
      {hint && (
        <p id={hintId} className="text-xs text-stone-500">
          {hint}
        </p>
      )}
      {errorMessage && (
        <p id={errorId} className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
