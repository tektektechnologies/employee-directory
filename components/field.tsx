const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus-visible:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 aria-invalid:border-red-600 aria-invalid:focus-visible:ring-red-600/30 sm:text-sm";

type BaseProps = {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  maxLength?: number;
};

type FieldProps = BaseProps & {
  type: "email" | "password" | "text" | "url";
  autoComplete: string;
  minLength?: number;
  inputMode?: "text" | "email" | "url";
};

type TextAreaProps = BaseProps & {
  rows?: number;
};

function ids(name: string, hint?: string, error?: string) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return { id, hintId, errorId, describedBy };
}

function Label({ htmlFor, label, required }: { htmlFor: string; label: string; required: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-stone-800">
      {label}
      {!required && <span className="font-normal text-stone-500"> (optional)</span>}
    </label>
  );
}

function Messages(props: { hint?: string; hintId?: string; error?: string; errorId?: string }) {
  return (
    <>
      {props.error && (
        <p id={props.errorId} className="text-sm text-red-700">
          {props.error}
        </p>
      )}
      {props.hint && (
        <p id={props.hintId} className="text-xs text-stone-500">
          {props.hint}
        </p>
      )}
    </>
  );
}

export function Field({
  name,
  label,
  type,
  autoComplete,
  defaultValue,
  error,
  hint,
  required = true,
  minLength,
  maxLength,
  inputMode,
}: FieldProps) {
  const { id, hintId, errorId, describedBy } = ids(name, hint, error);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} label={label} required={required} />
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        defaultValue={defaultValue}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  error,
  hint,
  required = true,
  maxLength,
  rows = 4,
}: TextAreaProps) {
  const { id, hintId, errorId, describedBy } = ids(name, hint, error);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputClass} resize-y`}
      />
      <Messages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}
