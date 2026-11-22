import { useSyncExternalStore } from "react";
import { getAutoplayState, stopAutoplay, subscribeAutoplay } from "@/lib/autoplay";

export function AutoplayHUD() {
  const state = useSyncExternalStore(subscribeAutoplay, getAutoplayState, getAutoplayState);
  if (!state.running) return null;

  const pct = state.total ? Math.round((state.index / state.total) * 100) : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-3">
      <div className="pointer-events-auto w-full max-w-[430px] rounded-2xl bg-navy/95 px-4 py-3 text-white shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Auto-play · {state.label}
            </p>
            <p className="truncate text-xs font-medium">{state.note}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[10px] text-white/70">
              {state.index}/{state.total}
            </span>
            <button
              onClick={stopAutoplay}
              className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold"
            >
              Stop
            </button>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
