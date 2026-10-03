import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = typeof window !== "undefined" ? localStorage.getItem("hms_access_token") : null;
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      auth: { token: token || undefined },
    });

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected successfully with ID:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
    });
  }
  return socket;
}

export function reconnectSocketWithToken(token: string): Socket {
  if (socket) {
    socket.disconnect();
  }
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    autoConnect: true,
    auth: { token },
  });
  return socket;
}

export function joinSocketRoom(room: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit("join_room", { room });
  } else {
    s.once("connect", () => {
      s.emit("join_room", { room });
    });
  }
}

export function leaveSocketRoom(room: string) {
  const s = getSocket();
  if (s.connected) {
    s.emit("leave_room", { room });
  }
}
