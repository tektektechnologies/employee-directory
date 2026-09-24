export type AuthFieldName = "email" | "password" | "confirmPassword";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<AuthFieldName, string>>;
  submittedEmail?: string;
};

export const initialAuthFormState: AuthFormState = { status: "idle" };
