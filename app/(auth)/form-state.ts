export type AuthField = "email" | "password" | "confirmPassword";

export type AuthState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<AuthField, string>>;
  email?: string;
};

export const initialState: AuthState = { status: "idle" };
