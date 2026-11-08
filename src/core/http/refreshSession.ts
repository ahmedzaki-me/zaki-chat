import axios from "axios";
import { AxiosError } from "axios";
import type { RefreshResponse } from "@/shared/types";

let inFlight: Promise<RefreshResponse | null> | null = null;

export function refreshSession(): Promise<RefreshResponse | null> {
  if (inFlight) return inFlight;
  inFlight = axios
    .post<RefreshResponse>(`${import.meta.env.VITE_API_BASE_URL}auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => {
      if (!data?.accessToken || !data.user) throw new Error("Refresh response did not include a session.");
      return data;
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && [401, 403].includes(error.response?.status ?? 0)) return null;
      throw error;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}
