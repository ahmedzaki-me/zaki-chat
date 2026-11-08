import { createContext, useContext } from "react";
import { socket } from "@/core/socket/socket";
import type { SocketStatus } from "@/features/presence/types/presence.types";

export const SocketContext = createContext<{ status: SocketStatus }>({ status: "disconnected" });
export const useSocket = () => ({ socket, ...useContext(SocketContext) });
