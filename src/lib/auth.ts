import { supabase } from "./supabase";

export async function signInAnonymously(name: string, captcha?: string | null) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return { user: session.user, session };

  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      captchaToken: captcha ?? undefined,
      data: {
        full_name: name,
      },
    },
  });

  if (error) return error;

  return data;
}

export const signInWithEmail = async (
  email: string,
  password: string,
  captchaToken?: string | null | undefined,
) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken: captchaToken ?? undefined,
    },
  });
  if (error) return error;
  return data;
};

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  captchaToken?: string | null | undefined,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: captchaToken ?? undefined,
      data: { full_name: name },
    },
  });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return error;
}

export async function upgradeAnonymousUser(
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.updateUser({
    email,
    password,
  });

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}