import { useEffect, useMemo, useRef, useState } from "react";
import { PrimaryButton } from "./PhoneFrame";
import { getPersona, track } from "@/lib/analytics";
import { php, useBank } from "@/lib/bankStore";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
  Smartphone,
  Tag,
  ScanLine,
  DollarSign,
  CreditCard,
  Eye,
  EyeOff,
  QrCode,
  Mail,
} from "lucide-react";
import profilePhoto from "@/assets/profile-yi-shiean.jpg";
import offerCreditCard from "@/assets/offer-credit-card.jpg";

import offerPersonalLoan from "@/assets/offer-personal-loan.jpg";
import offerAutoLoan from "@/assets/offer-auto-loan.jpg";
import offerSecuredCard from "@/assets/offer-secured-card.jpg";
import futureInsurance from "@/assets/future-insurance.jpg";
import futureRetirement from "@/assets/future-retirement.jpg";

const QUICK_ACTIONS = [
  { id: "send_money", label: "Send Money", Icon: ArrowUpRight },
  { id: "receive_money", label: "Receive Money", Icon: ArrowDownLeft },
  { id: "pay_bills", label: "Pay Bills", Icon: ReceiptText },
  { id: "buy_load", label: "Buy Load", Icon: Smartphone },
  { id: "promos", label: "Promos", Icon: Tag },
  { id: "deposit_check", label: "Deposit Check", Icon: ScanLine },
  { id: "buy_sell_usd", label: "Buy/Sell USD", Icon: DollarSign },
  { id: "activate_card", label: "Activate Card", Icon: CreditCard },
];

const BILLERS = [
  { id: "electric", label: "Demo Electric Co.", ref: "BILL-DEMO-4471", amount: 1250 },
  { id: "water", label: "Demo Water District", ref: "BILL-DEMO-1180", amount: 640.75 },
  { id: "internet", label: "Fictional Fibre", ref: "BILL-DEMO-9902", amount: 2499 },
  { id: "card", label: "YS Rewards Visa", ref: "BILL-DEMO-7714", amount: 8320.4 },
];

const LOAD_TELCOS = ["Demo Mobile", "Fictional Telco", "Sandbox Cellular"];
const LOAD_AMOUNTS = [50, 100, 300, 500];

const PROMOS = [
  { id: "zero_fee", label: "Zero transfer fees", detail: "Waived InstaPay fee on your first 5 transfers this month." },
  { id: "cashback_dining", label: "10% dining cashback", detail: "Up to PHP 300 back on weekend dining with your YS card." },
  { id: "load_bonus", label: "Buy load, get 20% back", detail: "Minimum PHP 300 load. Credited within 7 days." },
];

const OFFERS = [
  {
    id: "credit_card",
    img: offerCreditCard,
    label: "YS Rewards Visa",
    tag: "Pre-qualified",
    highlight: "Up to 4% cashback",
    sub: "No annual fee for year 1",
    detail: [
      ["Credit limit (indicative)", "PHP 120,000"],
      ["Cashback", "4% fuel · 2% groceries · 1% all else"],
      ["Annual fee", "Waived first year, then PHP 2,500"],
      ["Decision", "Instant, no documents needed"],
    ],
  },
  {
    id: "personal_loan",
    img: offerPersonalLoan,
    label: "Personal Loan",
    tag: "Ready to release",
    highlight: "PHP 250,000",
    sub: "1.28% add-on rate / month",
    detail: [
      ["Approved amount", "PHP 250,000"],
      ["Term", "12 – 36 months"],
      ["Est. monthly payment", "PHP 10,533 over 24 months"],
      ["Release", "Same day to your YS Savings"],
    ],
  },
  {
    id: "auto_loan",
    img: offerAutoLoan,
    label: "Auto Loan",
    tag: "Low down payment",
    highlight: "From 6.9% p.a.",
    sub: "As low as 15% down",
    detail: [
      ["Loanable amount", "Up to 85% of car value"],
      ["Interest", "6.9% p.a. fixed for 1 year"],
      ["Term", "Up to 60 months"],
      ["Includes", "Free 1st-year comprehensive insurance"],
    ],
  },
  {
    id: "secured_card",
    img: offerSecuredCard,
    label: "Secured Card",
    tag: "No credit history? OK",
    highlight: "Hold PHP 10,000",
    sub: "Build credit in 6 months",
    detail: [
      ["Security deposit", "PHP 10,000 (earns 2.5% p.a.)"],
      ["Credit limit", "100% of your deposit"],
      ["Upgrade path", "Unsecured card review after 6 months"],
      ["Approval", "Guaranteed with funded deposit"],
    ],
  },
];

const FUTURE_PRODUCTS = [
  {
    id: "insurance",
    l: "Life & Health Cover",
    d: "PHP 500/mo · up to PHP 1M benefit",
    img: futureInsurance,
  },
  {
    id: "retirement",
    l: "Retirement Fund",
    d: "Target 8.2% p.a. · from PHP 1,000/mo",
    img: futureRetirement,
  },
];

const SECTIONS = [
  { id: "accounts", name: "Accounts" },
  { id: "quick_actions", name: "Quick Actions" },
  { id: "activity", name: "Recent Activity" },
  { id: "goals", name: "Goals" },
  { id: "for_u", name: "For U" },
  { id: "prepare_future", name: "Prepare For The Future" },
];

function useSectionTracking(onSeen: (id: string) => void) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = (e.target as HTMLElement).dataset["section"];
          if (!id || !e.isIntersecting || seen.current.has(id)) return;
          seen.current.add(id);
          const meta = SECTIONS.find((s) => s.id === id);
          track("Section Viewed", { dashboard_section: id, section_name: meta?.name ?? id });
          onSeen(id);
        });
      },
      { threshold: 0.4 },
    );
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [onSeen]);

  return (id: string) => (el: HTMLElement | null) => {
    refs.current[id] = el;
  };
}

export function Dashboard({
  initialAction,
  onQuickAction,
  onQr,
  onOpenAccount,
  onLogout,
}: {
  initialAction?: string | null;
  onQuickAction: (id: string) => void;
  onQr: () => void;
  onOpenAccount: () => void;
  onLogout: () => void;
}) {
  const { accounts, txns, post } = useBank();
  const [lastSection, setLastSection] = useState("accounts");
  const [lastTapped, setLastTapped] = useState<string | null>(null);
  const [timeoutOpen, setTimeoutOpen] = useState(false);
  const [detailOffer, setDetailOffer] = useState<(typeof OFFERS)[number] | null>(null);
  const [sheet, setSheet] = useState<
    null | "bills" | "load" | "promos" | "deposit" | "fx" | "receive" | "goals"
  >(null);
  const [hidden, setHidden] = useState(false);
  const [query, setQuery] = useState("");
  const [biller, setBiller] = useState(BILLERS[0]!);
  const [telco, setTelco] = useState(LOAD_TELCOS[0]!);
  const [loadAmount, setLoadAmount] = useState(LOAD_AMOUNTS[1]!);
  const [checkAmount, setCheckAmount] = useState("4500");
  const [checkCaptured, setCheckCaptured] = useState(false);
  const [usd, setUsd] = useState("100");
  const acted = useRef(false);
  const setRef = useSectionTracking(setLastSection);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return [
      ...QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q)).map((a) => ({
        kind: "Feature",
        label: a.label,
        id: a.id,
      })),
      ...txns
        .filter((t) => t.title.toLowerCase().includes(q))
        .map((t) => ({ kind: "Transaction", label: `${t.title} · ${php(Math.abs(t.amount))}`, id: t.id })),
    ].slice(0, 5);
  }, [query, txns]);

  useEffect(() => {
    if (initialAction) proceed(initialAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  useEffect(() => {
    track("UBP Dashboard Viewed", { sections_visible: SECTIONS.length, is_first_action: true });
    return () => {
      if (!acted.current) track("Dashboard Abandoned", { dashboard_section: lastSection });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle friction prompt
  useEffect(() => {
    const idleMs = getPersona().app_up_to_date ? 60000 : 20000;
    const t = setTimeout(() => {
      setTimeoutOpen(true);
      track("Session Timeout Prompt", {
        dashboard_section: "quick_actions",
        element_id: lastTapped ?? "none",
      });
    }, idleMs);
    return () => clearTimeout(t);
  }, [lastTapped]);

  const tapAction = (id: string, rank: number) => {
    acted.current = true;
    setLastTapped(id);
    track("Quick Action Tapped", {
      dashboard_section: "quick_actions",
      element_id: id,
      module_rank: rank,
    });
    if (!getPersona().app_up_to_date) {
      setTimeoutOpen(true);
      track("Session Timeout Prompt", { dashboard_section: "quick_actions", element_id: id });
      return;
    }
    proceed(id);
  };

  const proceed = (id: string) => {
    track("Action Flow Started", { dashboard_section: "quick_actions", element_id: id });
    if (id === "pay_bills") setSheet("bills");
    else if (id === "buy_load") setSheet("load");
    else if (id === "promos") setSheet("promos");
    else if (id === "deposit_check") {
      setCheckCaptured(false);
      setSheet("deposit");
    } else if (id === "buy_sell_usd") setSheet("fx");
    else if (id === "receive_money") setSheet("receive");
    else onQuickAction(id);
  };

  const usdNum = Number(usd || 0) || 0;
  const rate = 58.42;

  return (
    <div className="relative pb-4">
      {/* Top bar */}
      <div className="brand-gradient px-5 pb-16 pt-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={profilePhoto}
              alt="Demo profile photo of Yi Shiean Tan"
              className="amp-mask h-8 w-8 rounded-full object-cover ring-2 ring-white/40"
            />
            <p className="text-sm font-medium">
              Hi, <span className="amp-mask">Yi Shiean</span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-lg">
            <button
              aria-label="Scan QR to pay or send"
              onClick={onQr}
              className="live-glow flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5"
            >
              <QrCode className="h-4 w-4" strokeWidth={2.2} />
              <span className="text-[11px] font-medium">Scan</span>
            </button>
            <button
              aria-label="Mailbox"
              onClick={() => {
                track("Inbox Opened", { unread_count: 2 });
                toast("2 demo messages", { description: "Inbox is illustrative in this sandbox." });
              }}
              className="relative"
            >
              <Mail className="h-5 w-5" strokeWidth={2.2} />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button aria-label="Logout" className="text-xs" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            track("Global Search Used", { search_query: query, results_count: searchResults.length });
          }}
        >
          <input
            data-demo="dash-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, features…"
            className="w-full rounded-2xl bg-white/95 px-4 py-2 text-xs text-navy outline-none"
          />
        </form>
        {searchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl bg-white text-navy shadow-md">
            {searchResults.map((r, ri) => (
              <button
                key={`${r.kind}-${r.id}`}
                data-demo={`dash-result-${ri}`}
                onClick={() => {
                  track("Search Result Selected", { search_query: query, result_type: r.kind, element_id: r.id });
                  if (r.kind === "Feature") {
                    setQuery("");
                    proceed(r.id);
                  } else {
                    setQuery("");
                    toast("Transaction detail", { description: r.label });
                  }
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-[11px] hover:bg-warm"
              >
                <span>{r.label}</span>
                <span className="text-[9px] uppercase text-muted-foreground">{r.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Accounts */}
      <section ref={setRef("accounts")} data-section="accounts" className="-mt-12 space-y-3 px-5">
        <div className="flex justify-end">
          <button
            data-demo="dash-hide-balances"
            onClick={() => {
              setHidden((h) => !h);
              track("Balance Visibility Toggled", { balances_hidden: !hidden });
            }}
            className="live-glow flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-medium text-navy shadow-sm"
          >
            {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
            {hidden ? "Show balances" : "Hide balances"}
          </button>
        </div>
        {accounts.map((a) => (
          <div
            key={a.id}
            className={`rounded-2xl p-4 shadow-md ${a.id === "plus" ? "bg-navy text-white" : "bg-white"}`}
          >
            <p className={`text-[11px] ${a.id === "plus" ? "opacity-80" : "text-muted-foreground"}`}>
              <span className="amp-mask">Yi Shiean Tan</span> · {a.name}
            </p>
            <p className={`amp-mask text-xs ${a.id === "plus" ? "opacity-80" : "text-muted-foreground"}`}>
              {a.masked}
            </p>
            <p className={`amp-mask mt-2 text-2xl font-semibold ${a.id === "plus" ? "" : "text-navy"}`}>
              {hidden ? "PHP ••••••" : php(a.balance)}
            </p>
          </div>
        ))}
      </section>

      {/* Quick actions */}
      <section ref={setRef("quick_actions")} data-section="quick_actions" className="mt-6 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Quick Actions</h2>
          <button
            onClick={() => {
              track("Quick Actions View All Clicked", { dashboard_section: "quick_actions" });
              toast("All 8 actions already shown", { description: "Every tile in this demo is clickable." });
            }}
            className="text-[11px] font-medium text-brand"
          >
            VIEW ALL
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a, i) => (
            <button
              key={a.id}
              data-demo={`qa-${a.id}`}
              onClick={() => tapAction(a.id, i)}
              onDoubleClick={() => {
                track("Shortcut Pinned", { element_id: a.id });
                toast(`${a.label} pinned`);
              }}
              className="flex flex-col items-center gap-1 text-[10px] text-navy"
            >
              <span className="live-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-warm text-brand shadow-sm transition active:scale-95">
                <a.Icon size={20} strokeWidth={2} />
              </span>
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section ref={setRef("activity")} data-section="activity" className="mt-6 px-5">
        <h2 className="mb-2 text-sm font-semibold text-navy">Recent Activity</h2>
        <div className="divide-y divide-border rounded-2xl border border-border">
          {txns.slice(0, 5).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                track("Transaction Detail Viewed", { transaction_category: t.category, total_value: Math.abs(t.amount) });
                toast(t.title, { description: `${t.when} · ${php(Math.abs(t.amount))}` });
              }}
              className="flex w-full items-center justify-between px-3 py-3 text-left"
            >
              <span>
                <span className="amp-mask block text-xs font-medium text-navy">{t.title}</span>
                <span className="block text-[10px] text-muted-foreground">
                  {t.subtitle} · {t.when}
                </span>
              </span>
              <span
                className={`amp-mask text-xs font-semibold ${t.amount < 0 ? "text-navy" : "text-teal"}`}
              >
                {t.amount < 0 ? "-" : "+"}
                {php(Math.abs(t.amount))}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Goals */}
      <section ref={setRef("goals")} data-section="goals" className="mt-6 px-5">
        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Goals</h2>
            <button
              onClick={() => {
                track("Goals Section Managed Clicked", { dashboard_section: "goals" });
                setSheet("goals");
              }}
              className="live-glow rounded-full border border-brand px-3 py-1 text-[11px] font-medium text-brand"
            >
              MANAGE
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Travel fund · 62% of goal</p>
          <div className="mt-2 h-2 rounded-full bg-warm">
            <div className="brand-gradient h-2 w-[62%] rounded-full" />
          </div>
        </div>
      </section>

      {/* For U */}
      <section ref={setRef("for_u")} data-section="for_u" className="mt-6">
        <h2 className="mb-1 px-5 text-sm font-semibold text-navy">For U</h2>
        <div className="flex gap-3 overflow-x-auto px-5 py-3">
          {OFFERS.map((o) => (
            <button
              key={o.id}
              data-demo={`offer-${o.id}`}
              onClick={() => {
                acted.current = true;
                track("For U Offer Tapped", { dashboard_section: "for_u", offer_type: o.id });
                track("Promo Card Viewed", { dashboard_section: "for_u", offer_type: o.id });
                track("Offer Details Viewed", { offer_type: o.id, offer_rating: 4 });
                setDetailOffer(o);
              }}
              className="live-glow w-[188px] shrink-0 overflow-hidden rounded-2xl bg-warm text-left shadow-sm"
            >
              <span className="relative block h-[104px] w-full">
                <img
                  src={o.img}
                  alt={o.label}
                  loading="lazy"
                  width={992}
                  height={672}
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-navy backdrop-blur-sm">
                  {o.tag}
                </span>
              </span>
              <span className="block p-3">
                <span className="block text-xs font-semibold text-navy">{o.label}</span>
                <span className="mt-1 block text-sm font-bold text-navy">{o.highlight}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{o.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Prepare for the future */}
      <section ref={setRef("prepare_future")} data-section="prepare_future" className="mt-3">
        <h2 className="mb-1 px-5 text-sm font-semibold text-navy">Prepare For The Future</h2>
        <div className="flex gap-3 overflow-x-auto px-5 py-3">
          {FUTURE_PRODUCTS.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                track("Future Product Tapped", { dashboard_section: "prepare_future", offer_type: c.id });
                toast(c.l, { description: `${c.d} — illustrative only.` });
              }}
              className="live-glow flex h-[180px] w-[210px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white text-left text-navy"
            >
              <span className="relative block h-[112px] w-full">
                <img
                  src={c.img}
                  alt={c.l}
                  loading="lazy"
                  width={992}
                  height={672}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent px-3 pb-2 pt-6">
                  <span className="block text-[11px] font-semibold text-white">{c.l}</span>
                </span>
              </span>
              <span className="flex flex-1 items-center px-3 py-2">
                <span className="block text-[10px] leading-snug text-muted-foreground">{c.d}</span>
              </span>
            </button>
          ))}
        </div>
      </section>


      <div className="mt-6 px-5">
        <PrimaryButton
          demo="dash-open-account"
          onClick={() => {
            acted.current = true;
            onOpenAccount();
          }}
        >
          Open an account
        </PrimaryButton>
      </div>

      {detailOffer && (
        <Sheet title={detailOffer.label} onClose={() => setDetailOffer(null)}>
          <p className="text-sm font-semibold text-navy">{detailOffer.highlight}</p>
          <p className="text-xs text-muted-foreground">{detailOffer.sub}</p>
          <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
            {detailOffer.detail.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="amp-mask text-right text-[11px] font-medium text-navy">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <PrimaryButton
              demo="offer-apply"
              onClick={() => {
                track("Offer Application Started", { offer_type: detailOffer.id });
                toast("Application started (demo)", {
                  description: `${detailOffer.label} — nothing is submitted.`,
                });
                setDetailOffer(null);
              }}
            >
              Apply now
            </PrimaryButton>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Illustrative rates for a fictional bank in this analytics sandbox. Nothing is applied for.
          </p>
        </Sheet>
      )}

      {sheet === "bills" && (
        <Sheet title="Pay Bills" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {BILLERS.map((b) => (
              <button
                key={b.id}
                data-demo={`biller-${b.id}`}
                onClick={() => {
                  setBiller(b);
                  track("Biller Selected", { element_id: b.id, total_value: b.amount });
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                  biller.id === b.id ? "border-brand" : "border-border"
                }`}
              >
                <span className="font-medium text-navy">{b.label}</span>
                <span className="amp-mask text-muted-foreground">{php(b.amount)}</span>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <PrimaryButton
              demo="bills-pay"
              onClick={() => {
                post({
                  title: biller.label,
                  subtitle: `Bill payment · ${biller.ref}`,
                  amount: -biller.amount,
                  category: "bill",
                });
                track("Pay Bills", { action_reference: biller.ref, total_value: biller.amount });
                toast("Bill paid (demo)", { description: `${biller.label} · ${php(biller.amount)}` });
                setSheet(null);
              }}
            >
              Pay {php(biller.amount)}
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {sheet === "load" && (
        <Sheet title="Buy Load" onClose={() => setSheet(null)}>
          <div className="flex gap-2">
            {LOAD_TELCOS.map((t) => (
              <button
                key={t}
                data-demo={`telco-${t}`}
                onClick={() => setTelco(t)}
                className={`flex-1 rounded-xl border px-2 py-2 text-[10px] ${
                  telco === t ? "border-brand text-brand" : "border-border text-navy"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Mobile number</p>
          <p className="amp-mask text-sm font-medium text-navy">0917 ••• 4402</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {LOAD_AMOUNTS.map((a) => (
              <button
                key={a}
                data-demo={`load-amount-${a}`}
                onClick={() => setLoadAmount(a)}
                className={`rounded-xl border py-2 text-xs font-semibold ${
                  loadAmount === a ? "border-brand text-brand" : "border-border text-navy"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <PrimaryButton
              demo="load-buy"
              onClick={() => {
                post({
                  title: `${telco} load`,
                  subtitle: "Prepaid load · 0917•••4402",
                  amount: -loadAmount,
                  category: "load",
                });
                track("Load Purchased", { telco, total_value: loadAmount });
                toast("Load sent (demo)", { description: `${php(loadAmount)} to 0917•••4402` });
                setSheet(null);
              }}
            >
              Buy {php(loadAmount)} load
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {sheet === "promos" && (
        <Sheet title="Promos" onClose={() => setSheet(null)}>
          <div className="space-y-2">
            {PROMOS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  track("Promo Claimed", { offer_type: p.id });
                  toast("Promo claimed (demo)", { description: p.detail });
                }}
                className="w-full rounded-xl border border-border p-3 text-left"
              >
                <p className="text-xs font-semibold text-navy">{p.label}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{p.detail}</p>
                <p className="mt-1 text-[10px] font-semibold text-brand">Tap to claim</p>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {sheet === "deposit" && (
        <Sheet title="Deposit Check" onClose={() => setSheet(null)}>
          <button
            onClick={() => {
              setCheckCaptured(true);
              track("Check Image Captured", { capture_side: "front" });
            }}
            className={`flex h-32 w-full items-center justify-center rounded-2xl border-2 border-dashed text-xs ${
              checkCaptured ? "border-teal text-teal" : "border-brand text-muted-foreground"
            }`}
          >
            {checkCaptured ? "Check image captured ✓" : "Tap to capture check (camera mock)"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Check amount (PHP)</p>
          <input
            value={checkAmount}
            inputMode="decimal"
            onChange={(e) => setCheckAmount(e.target.value)}
            className="amp-mask mt-1 w-full rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-navy outline-none focus:border-brand"
          />
          <div className="mt-4">
            <PrimaryButton
              disabled={!checkCaptured}
              onClick={() => {
                const amt = Number(checkAmount || 0) || 0;
                post({
                  title: "Check deposit",
                  subtitle: "Pending clearing · demo",
                  amount: amt,
                  category: "deposit",
                });
                track("Check Deposit Submitted", { total_value: amt, capture_complete: true });
                toast("Check deposited (demo)", { description: php(amt) });
                setSheet(null);
              }}
            >
              {checkCaptured ? "Deposit check" : "Capture check first"}
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {sheet === "fx" && (
        <Sheet title="Buy / Sell USD" onClose={() => setSheet(null)}>
          <p className="text-xs text-muted-foreground">Indicative rate 1 USD = PHP {rate}</p>
          <p className="mt-3 text-xs text-muted-foreground">Amount (USD)</p>
          <input
            value={usd}
            inputMode="decimal"
            onChange={(e) => setUsd(e.target.value)}
            className="amp-mask mt-1 w-full rounded-2xl border border-border px-4 py-2 text-lg font-semibold text-navy outline-none focus:border-brand"
          />
          <p className="amp-mask mt-2 text-sm font-semibold text-navy">
            ≈ {php(usdNum * rate)}
          </p>
          <div className="mt-4">
            <PrimaryButton
              onClick={() => {
                post({
                  title: `Bought USD ${usdNum.toLocaleString()}`,
                  subtitle: `FX @ ${rate}`,
                  amount: -usdNum * rate,
                  category: "fx",
                });
                track("FX Order Placed", { fx_direction: "buy", fx_rate: rate, total_value: usdNum * rate });
                toast("USD purchased (demo)", { description: `USD ${usdNum} for ${php(usdNum * rate)}` });
                setSheet(null);
              }}
            >
              Buy USD
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {sheet === "receive" && (
        <Sheet title="Receive Money" onClose={() => setSheet(null)}>
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-brand text-[10px] text-muted-foreground">
            Your QR (mock)
          </div>
          <p className="amp-mask mt-3 text-center text-xs text-navy">Yi Shiean Tan · ****1176</p>
          <div className="mt-4">
            <PrimaryButton
              onClick={() => {
                track("Receive QR Shared", { share_channel: "copy_link" });
                toast("Payment link copied (demo)");
                setSheet(null);
              }}
            >
              Share payment link
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {sheet === "goals" && (
        <Sheet title="Travel fund" onClose={() => setSheet(null)}>
          <p className="text-xs text-muted-foreground">Saved PHP 31,000 of PHP 50,000 target</p>
          <div className="mt-2 h-2 rounded-full bg-warm">
            <div className="brand-gradient h-2 w-[62%] rounded-full" />
          </div>
          <div className="mt-4">
            <PrimaryButton
              onClick={() => {
                post({
                  title: "Travel fund top-up",
                  subtitle: "Goal contribution",
                  amount: -1000,
                  category: "transfer",
                });
                track("Goal Contribution Made", { total_value: 1000, goal_name: "travel_fund" });
                toast("PHP 1,000 added to Travel fund (demo)");
                setSheet(null);
              }}
            >
              Add PHP 1,000
            </PrimaryButton>
          </div>
        </Sheet>
      )}

      {timeoutOpen && (
        <Sheet title="Session about to expire" onClose={() => setTimeoutOpen(false)}>
          <p className="text-xs text-muted-foreground">
            You've been idle. For the demo, this simulates an auto-logout prompt.
          </p>
          <div className="mt-4 space-y-2">
            <PrimaryButton
              demo="dash-stay-signed-in"
              onClick={() => {
                setTimeoutOpen(false);
                if (lastTapped) proceed(lastTapped);
              }}
            >
              Stay signed in
            </PrimaryButton>
            <button onClick={onLogout} className="w-full py-2 text-xs text-muted-foreground">
              Log out
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/30" onClick={onClose}>
      <div
        className="w-full rounded-t-3xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
