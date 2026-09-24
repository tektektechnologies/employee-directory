const inputClassName =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 aria-invalid:border-red-600 aria-invalid:focus-visible:ring-red-600/30 sm:text-sm";

type SharedFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  errorMessage?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
};

type FormFieldProps = SharedFieldProps & {
  type: "email" | "password" | "text" | "url";
  autoComplete: string;
  minLength?: number;
  inputMode?: "text" | "email" | "url";
};

type TextAreaFieldProps = SharedFieldProps & {
  rows?: number;
};

function describeField(name: string, hint?: string, errorMessage?: string) {
  const inputId = `field-${name}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { inputId, hintId, errorId, describedBy };
}

function FieldLabel({ inputId, label, required }: { inputId: string; label: string; required: boolean }) {
  return (
    <label htmlFor={inputId} className="text-sm font-medium text-stone-800">
      {label}
      {!required && <span className="font-normal text-stone-500"> (optional)</span>}
    </label>
  );
}

function FieldMessages({
  hint,
  hintId,
  errorMessage,
  errorId,
}: {
  hint?: string;
  hintId?: string;
  errorMessage?: string;
  errorId?: string;
}) {
  return (
    <>
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
    </>
  );
}

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
  maxLength,
  inputMode,
}: FormFieldProps) {
  const { inputId, hintId, errorId, describedBy } = describeField(name, hint, errorMessage);

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel inputId={inputId} label={label} required={required} />
      <input
        id={inputId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={describedBy}
        className={inputClassName}
      />
      <FieldMessages hint={hint} hintId={hintId} errorMessage={errorMessage} errorId={errorId} />
    </div>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  errorMessage,
  hint,
  required = true,
  maxLength,
  rows = 4,
}: TextAreaFieldProps) {
  const { inputId, hintId, errorId, describedBy } = describeField(name, hint, errorMessage);

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel inputId={inputId} label={label} required={required} />
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClassName} resize-y`}
      />
      <FieldMessages hint={hint} hintId={hintId} errorMessage={errorMessage} errorId={errorId} />
    </div>
  );
}
