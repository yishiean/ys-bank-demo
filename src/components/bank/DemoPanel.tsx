import { useState } from "react";
import {
  PERSONAS,
  getPlatform,
  resetDemoSession,
  setPersona,
  setPlatform,
  type PersonaName,
  type Platform,
} from "@/lib/analytics";

export type JumpTarget =
  | "flow1"
  | "flow2-qr-login"
  | "flow2-qr-dashboard"
  | "flow2-menu"
  | "flow3";

export function DemoPanel({
  persona,
  onPersona,
  onJump,
  onAutoplay,
  speed,
  onSpeed,
}: {
  persona: PersonaName;
  onPersona: (p: PersonaName) => void;
  onJump: (t: JumpTarget) => void;
  onAutoplay: (t: JumpTarget) => void;
  speed: number;
  onSpeed: (s: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const notify = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash((f) => (f === msg ? null : f)), 2200);
  };
  const [platform, setPlatformState] = useState<Platform>(getPlatform());

  const jump = (t: JumpTarget) => {
    setOpen(false);
    onJump(t);
  };

  const play = (t: JumpTarget) => {
    setOpen(false);
    onAutoplay(t);
  };

  const FLOWS: { id: JumpTarget; label: string }[] = [
    { id: "flow1", label: "Flow 1 — Dashboard & bills" },
    { id: "flow2-qr-login", label: "Flow 2 — QR (sign-in)" },
    { id: "flow2-qr-dashboard", label: "Flow 2 — QR (dashboard)" },
    { id: "flow2-menu", label: "Flow 2 — Send/Receive menu" },
    { id: "flow3", label: "Flow 3 — Account opening" },
  ];

  const platforms: Platform[] = ["iOS", "Android", "Web"];

  return (
    <div className="fixed bottom-4 right-4 z-50 text-xs">
      {open && (
        <div className="mb-2 w-64 rounded-2xl border border-border bg-white p-4 shadow-xl">
          <p className="font-semibold text-navy">Demo controls</p>
          <p className="mb-2 text-[10px] text-muted-foreground">
            Active: {platform} · {persona === "happy" ? "Happy path" : "Friction path"}
          </p>
          {flash && (
            <p className="mb-2 rounded-lg bg-teal/10 px-2 py-1 text-[10px] font-medium text-teal">
              {flash}
            </p>
          )}

          <p className="mb-1 text-muted-foreground">Platform</p>
          <div className="mb-3 flex gap-1">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlatform(p);
                  setPlatformState(p);
                  notify(`Platform set to ${p} — events now tag ${p}`);
                }}
                className={`flex-1 rounded-lg border px-2 py-1 ${
                  platform === p ? "border-brand bg-brand/10 text-brand" : "border-border"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <p className="mb-1 text-muted-foreground">Persona</p>
          <div className="mb-3 flex gap-1">
            {(Object.keys(PERSONAS) as PersonaName[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPersona(p);
                  onPersona(p);
                  notify(
                    p === "happy"
                      ? "Happy path — flows complete without friction"
                      : "Friction path — QR fails, liveness retries, idle timeout",
                  );
                }}
                className={`flex-1 rounded-lg border px-2 py-1 capitalize ${
                  persona === p ? "border-teal bg-teal/10 text-teal" : "border-border"
                }`}
              >
                {p === "happy" ? "Happy path" : "Friction path"}
              </button>
            ))}
          </div>

          <p className="mb-1 text-muted-foreground">Auto-play a journey</p>
          <p className="mb-1 text-[10px] text-muted-foreground">
            ▶ taps through the real screens for you and fires every event. Skip = jump to the
            first screen and click it yourself.
          </p>
          <div className="mb-2 grid gap-1">
            {FLOWS.map((f) => (
              <div key={f.id} className="flex gap-1">
                <button
                  className="flex-1 rounded-lg border border-brand bg-brand/10 px-2 py-1 text-left font-medium text-brand"
                  onClick={() => play(f.id)}
                >
                  ▶ {f.label}
                </button>
                <button
                  className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground"
                  onClick={() => jump(f.id)}
                  title="Jump to the first screen without auto-clicking"
                >
                  Skip
                </button>
              </div>
            ))}
          </div>

          <p className="mb-1 text-muted-foreground">Auto-play speed</p>
          <div className="mb-3 flex gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeed(s)}
                className={`flex-1 rounded-lg border px-2 py-1 ${
                  speed === s ? "border-brand bg-brand/10 text-brand" : "border-border"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              resetDemoSession();
              notify("New analytics session started");
            }}
            className="w-full rounded-lg bg-navy px-2 py-1.5 font-medium text-white"
          >
            Reset session
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Demo controls"
        className="brand-gradient ml-auto flex h-11 w-11 items-center justify-center rounded-full text-lg text-white shadow-lg"
      >
        ⚙
      </button>
    </div>
  );
}
