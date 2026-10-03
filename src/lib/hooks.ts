"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket, joinSocketRoom, leaveSocketRoom } from "@/lib/socket";
import { errorMessage } from "@/lib/utils";

/**
 * Fetch JSON from the API.
 * Pass `null` as the endpoint to skip fetching (e.g. while waiting for the user).
 */
export function useApi<T>(endpoint: string | null, fallback?: T) {
  const [data, setData] = useState<T | undefined>(fallback);
  const [loading, setLoading] = useState<boolean>(!!endpoint);
  const [error, setError] = useState<string | null>(null);
  const endpointRef = useRef(endpoint);
  endpointRef.current = endpoint;

  const refetch = useCallback(async (opts?: { silent?: boolean }) => {
    const ep = endpointRef.current;
    if (!ep) {
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const res = await apiFetch<T>(ep);
      setData(res);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [endpoint, refetch]);

  return { data, setData, loading, error, refetch };
}

/** Subscribe to a Socket.IO event (optionally joining a room) for the life of the component. */
export function useSocketEvent<T = any>(event: string, handler: (payload: T) => void, room?: string | null) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    if (room) joinSocketRoom(room);
    const fn = (payload: T) => handlerRef.current(payload);
    s.on(event, fn);
    return () => {
      s.off(event, fn);
      if (room) leaveSocketRoom(room);
    };
  }, [event, room]);
}

/** Live connection status of the realtime socket. */
export function useSocketStatus() {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const s = getSocket();
    setConnected(s.connected);
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    s.on("connect", on);
    s.on("disconnect", off);
    return () => {
      s.off("connect", on);
      s.off("disconnect", off);
    };
  }, []);
  return connected;
}
