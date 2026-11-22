import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutGrid,
  ArrowLeftRight,
  ReceiptText,
  Smartphone,
  Menu,
  type LucideIcon,
} from "lucide-react";
import ysLogoMark from "@/assets/ys-logo-mark.png";



export type Tab = "dashboard" | "send" | "bills" | "load" | "more";

const TABS: { id: Tab; label: string; Icon: LucideIcon; live?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutGrid, live: true },
  { id: "send", label: "Send/Receive", Icon: ArrowLeftRight, live: true },
  { id: "bills", label: "Pay Bills", Icon: ReceiptText, live: true },
  { id: "load", label: "Buy Load", Icon: Smartphone, live: true },
  { id: "more", label: "More", Icon: Menu, live: true },
];

function useLocalClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const now = useLocalClock();
  const time = now
    ? now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";
  return (
    <div
      className={`flex items-center justify-between px-6 pt-3 pb-1 sm:pt-4 text-[11px] font-semibold ${
        dark ? "text-white" : "text-navy"
      }`}
    >
      <span suppressHydrationWarning className="tabular-nums">
        {time}
      </span>
      <span className="tracking-widest">▮▮▮ ᯤ 100%</span>
    </div>
  );
}


export function YSLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={ysLogoMark}
        alt="YS Demo Bank logo"
        width={36}
        height={36}
        loading="lazy"
        className="h-9 w-9 rounded-xl object-contain"
      />
      <span className={`text-lg font-semibold ${light ? "text-white" : "text-navy"}`}>
        YS Demo Bank
      </span>
    </div>
  );
}

export function PhoneFrame({
  children,
  tab,
  onTab,
  showTabs = false,
  darkStatus = false,
}: {
  children: ReactNode;
  tab?: Tab;
  onTab?: (t: Tab) => void;
  showTabs?: boolean;
  darkStatus?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-warm py-0 sm:py-6">
      {/* iPhone 14 Pro Max logical viewport: 430 x 932 */}
      <div className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl sm:h-[932px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[54px] sm:ring-[10px] sm:ring-navy/90">
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 hidden h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black sm:block" />
        <StatusBar dark={darkStatus} />
        <div id="phone-scroll" className="flex-1 overflow-y-auto overscroll-contain pb-2">
          {children}
        </div>
        {showTabs && (
          <nav className="grid grid-cols-5 border-t border-border bg-white">
            {TABS.map((t) => (
              <button
                key={t.id}
                data-demo={`tab-${t.id}`}
                onClick={() => onTab?.(t.id)}
                className={`py-2 text-[10px] font-medium ${
                  tab === t.id ? "text-brand" : "text-muted-foreground"
                } ${t.live ? "live-glow" : ""}`}
              >
                <t.Icon className="mx-auto mb-1 block" size={20} strokeWidth={2} />
                {t.label}
              </button>
            ))}
          </nav>
        )}
        <p className="bg-warm px-4 py-2 text-center text-[10px] leading-tight text-muted-foreground">
          Demo prototype — fictional, not a real bank, no data collected.
        </p>
      </div>
    </div>
  );
}

export function ScreenHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      {onBack && (
        <button onClick={onBack} className="text-navy text-lg" aria-label="Back">
          ←
        </button>
      )}
      <h1 className="text-base font-semibold text-navy">{title}</h1>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  demo,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  demo?: string;
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const id = setTimeout(() => setBusy(false), 260);
    return () => clearTimeout(id);
  }, [busy]);

  return (
    <button
      onClick={() => {
        if (disabled) return;
        setBusy(true);
        onClick?.();
      }}
      disabled={disabled}
      data-demo={demo}
      aria-busy={busy}
      className="brand-gradient live-glow relative w-full overflow-hidden rounded-2xl py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
    >
      <span
        className={`flex items-center justify-center gap-2 transition-opacity ${
          busy ? "opacity-80" : "opacity-100"
        }`}
      >
        {busy && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {children}
      </span>
    </button>
  );
}

