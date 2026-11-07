'use client';

type EventCallback = (payload: any) => void;

class RealtimeEventBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('msr_realtime_channel');
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)?.forEach((cb) => cb(payload));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this environment', err);
      }
    }
  }

  emit(type: string, payload: any) {
    // Notify local listeners
    if (this.listeners.has(type)) {
      this.listeners.get(type)?.forEach((cb) => cb(payload));
    }
    // Broadcast to other browser tabs/windows
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
  }

  on(type: string, callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }
}

export const realtimeBus = typeof window !== 'undefined' ? new RealtimeEventBus() : null;
