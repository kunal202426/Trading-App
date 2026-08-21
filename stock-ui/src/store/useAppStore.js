import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_WATCHLIST = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"];

// How stale a cached quote can be before a consumer should refetch instead
// of trusting it. Short — this is a live-price cache, not a chart cache.
const PRICE_TTL_MS = 30 * 1000;

// A returning user idle this long since their last recorded login gets the
// onboarding tour again; a frequent user doesn't see it on every visit.
const TOUR_IDLE_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000;

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Watchlist (persisted so a refresh doesn't reset it) ──
      watchlist: DEFAULT_WATCHLIST,
      addToWatchlist: (symbol) =>
        set((s) => (s.watchlist.includes(symbol) ? s : { watchlist: [...s.watchlist, symbol] })),
      removeFromWatchlist: (symbol) =>
        set((s) => (s.watchlist.length <= 1 ? s : { watchlist: s.watchlist.filter((sym) => sym !== symbol) })),

      // ── Live-price cache, shared across pages (not persisted across reloads) ──
      priceCache: {},
      getCachedPrice: (symbol) => {
        const entry = get().priceCache[symbol];
        if (!entry) return null;
        if (Date.now() - entry.fetchedAt > PRICE_TTL_MS) return null;
        return entry.price;
      },
      setCachedPrice: (symbol, price) =>
        set((s) => ({ priceCache: { ...s.priceCache, [symbol]: { price, fetchedAt: Date.now() } } })),

      // ── Login recency, drives the "show the tour again if you've been away" rule ──
      lastLoginAt: null,
      // Call once per successful login. Returns true if the tour should be
      // queued (first-ever login, or idle >= threshold since the last one).
      recordLogin: () => {
        const prev = get().lastLoginAt;
        const now = Date.now();
        const idleMs = prev ? now - prev : Infinity;
        set({ lastLoginAt: now });
        return idleMs >= TOUR_IDLE_THRESHOLD_MS;
      },
    }),
    {
      name: "yisil-app-store",
      // Price cache is intentionally session-only — never persist stale quotes.
      partialize: (s) => ({ watchlist: s.watchlist, lastLoginAt: s.lastLoginAt }),
    }
  )
);
