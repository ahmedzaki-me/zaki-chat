import { toast } from "sonner";
import { socket } from "@/core/socket/socket";

export const OFFLINE_MESSAGE = "You are offline. Connect to the internet to send messages.";

export function canUseChatConnection(showMessage = false) {
  const available = typeof navigator === "undefined" || (navigator.onLine && socket.connected);
  if (!available && showMessage) toast.error(OFFLINE_MESSAGE);
  return available;
}
