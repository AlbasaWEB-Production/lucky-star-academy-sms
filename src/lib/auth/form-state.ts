/**
 * Shared shape for the auth forms.
 *
 * Kept out of actions.ts on purpose: a "use server" module may only export
 * async functions, so the state type and its initial value cannot live there.
 */

export type AuthFormState = {
  error: string | null;
};

export const initialAuthFormState: AuthFormState = { error: null };
