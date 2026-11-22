import { useEffect, useState } from "react";
import { PrimaryButton, ScreenHeader } from "./PhoneFrame";
import { getPersona, markConverted, markStep, track } from "@/lib/analytics";
import { php, useBank } from "@/lib/bankStore";
import { toast } from "sonner";


export type EntryPoint = "qr_login" | "qr_dashboard" | "send_receive_menu";

const BANKS = [
  { id: "gcash", label: "eWallet One" },
  { id: "maya", label: "eWallet Two" },
  { id: "bdo", label: "Bank A" },
  { id: "bpi", label: "Family Savings Demo Bank" },
  { id: "metrobank", label: "Bank B" },
];

type Step = "qr" | "form" | "picker" | "review" | "verify" | "receipt";

export function TransferFlow({
  entryPoint,
  onExit,
}: {
  entryPoint: EntryPoint;
  onExit: () => void;
}) {
  const { balanceOf, post } = useBank();
  const isQr = entryPoint !== "send_receive_menu";
  const [step, setStep] = useState<Step>(isQr ? "qr" : "picker");
  const [bank, setBank] = useState(BANKS[2]!);
  const [amount, setAmount] = useState("2500");
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("Fund Transfer");
  const [via, setVia] = useState("Account");
  const [qrError, setQrError] = useState(false);
  const [code] = useState("000000");
  const [promo, setPromo] = useState("");
  const [promoOk, setPromoOk] = useState<boolean | null>(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const recipientRef = "REF-DEMO-3391";
  const amountNum = Number(amount || 0) || 0;
  const fee = promoOk ? 0 : 10;
  const available = balanceOf("savings");
  const reference = `UB${String(Math.floor(Math.random() * 90000) + 10000)}`;

  const pressKey = (k: string) => {
    setError(null);
    setAmount((prev) => {
      if (k === "back") return prev.slice(0, -1);
      if (k === "." && prev.includes(".")) return prev;
      if (prev === "0" && k !== ".") return k;
      return (prev + k).slice(0, 9);
    });
  };


  useEffect(() => {
    track("InstaPay Entry Selected", { entry_point: entryPoint });
    track("Entry Point Opened", { entry_point_name: entryPoint });
    track("Transfer Promo Viewed", {});
    markStep(1);
    return () => {
      if (!done) track("Transfer Abandoned", { transfer_subtotal: amountNum });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scan = (fromGallery: boolean) => {
    if (!getPersona().device_trusted && !qrError) {
      setQrError(true);
      track("QR Scan Failed", { entry_point: entryPoint, recipient_ref: recipientRef });
      return;
    }
    setQrError(false);
    if (fromGallery) track("QR Uploaded from Gallery", { recipient_ref: recipientRef });
    track("Recipient QR Scanned", {
      entry_point: entryPoint,
      recipient_bank: bank.id,
      recipient_ref: recipientRef,
    });
    markStep(2);
    setStep("form");
  };

  const filtered = BANKS.filter((b) => b.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pb-6">
      {step === "qr" && (
        <>
          <ScreenHeader title="Scan QR" onBack={onExit} />
          <div className="px-5 py-6">
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-3xl border-2 border-dashed border-brand text-xs text-muted-foreground">
              Camera mock
            </div>
            {qrError && (
              <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                We couldn't read that QR code. Try again or upload from gallery.
              </p>
            )}
            <div className="mt-6 space-y-2">
              <PrimaryButton demo="tf-scan" onClick={() => scan(false)}>Simulate scan</PrimaryButton>
              <button
                onClick={() => scan(true)}
                className="w-full rounded-2xl border border-border py-3 text-sm font-medium text-navy"
              >
                Upload from gallery
              </button>
            </div>
          </div>
        </>
      )}

      {step === "picker" && (
        <>
          <ScreenHeader title="Send / Receive" onBack={onExit} />
          <div className="space-y-4 px-5 py-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() =>
                search &&
                track("Recipient Bank Searched", {
                  bank_search_term: search,
                  bank_results_count: filtered.length,
                })
              }
              placeholder="Search bank or e-wallet (fictional)"
              className="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <div className="space-y-2">
              {filtered.map((b) => (
                <button
                  key={b.id}
                  data-demo={`tf-bank-${b.id}`}
                  onClick={() => {
                    setBank(b);
                    track("Recent Recipient Selected", {});
                    markStep(2);
                    setStep("form");
                  }}
                  className={`w-full rounded-2xl border p-3 text-left text-sm ${
                    bank.id === b.id ? "border-brand" : "border-border"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Send money via</p>
              <div className="flex gap-2">
                {["Account", "Mobile", "Email", "QR"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVia(v)}
                    className={`flex-1 rounded-xl border px-2 py-2 text-xs ${
                      via === v ? "border-brand text-brand" : "border-border"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {step === "form" && (
        <>
          <ScreenHeader title="Transfer" onBack={onExit} />
          <div className="space-y-4 px-5 py-4">
            <div className="rounded-2xl bg-warm p-4">
              <p className="text-[11px] text-muted-foreground">Recipient (fictional)</p>
              <p className="amp-mask text-sm font-semibold text-navy">Maria Santos · {bank.label}</p>
              <p className="amp-mask text-xs text-muted-foreground">****4402</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="amt">
                Amount (PHP)
              </label>
              <input
                id="amt"
                data-demo="tf-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setError(null);
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                }}
                className="amp-mask mt-1 w-full rounded-2xl border border-border px-4 py-3 text-lg font-semibold text-navy outline-none focus:border-brand"
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map((k) => (
                  <button
                    key={k}
                    data-demo={`tf-key-${k}`}
                    onClick={() => pressKey(k)}
                    className="rounded-xl border border-border py-2 text-sm font-semibold text-navy transition active:scale-95 active:bg-warm"
                  >
                    {k === "back" ? "⌫" : k}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                {[500, 1000, 2500, 5000].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setError(null);
                      setAmount(String(v));
                      track("Amount Preset Tapped", { transfer_amount: v });
                    }}
                    className="flex-1 rounded-full bg-warm py-1 text-[10px] font-semibold text-brand"
                  >
                    {v.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Per-transaction limit PHP 50,000. Reminder: verify recipient details before sending.
              </p>
              {error && (
                <p className="mt-2 rounded-xl bg-destructive/10 p-2 text-[11px] text-destructive">{error}</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Source account</p>
              <div className="rounded-2xl border border-border p-3 text-sm">
                <span className="amp-mask">Everyday Savings ****1176 · {php(available)}</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Purpose</p>
              <div className="flex gap-2">
                {["Fund Transfer", "Donation", "Payment"].map((p) => (
                  <button
                    key={p}
                    data-demo={`tf-purpose-${p}`}
                    onClick={() => {
                      setPurpose(p);
                      track("Transfer Purpose Selected", { transfer_purpose: p });
                    }}
                    className={`flex-1 rounded-xl border px-2 py-2 text-xs ${
                      purpose === p ? "border-brand text-brand" : "border-border"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex gap-2">
                <input
                  data-demo="tf-promo"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Promo code (try YSFREE)"
                  className="flex-1 rounded-2xl border border-border px-4 py-2 text-xs outline-none"
                />
                <button
                  data-demo="tf-promo-apply"
                  onClick={() => {
                    const ok = promo.trim().toUpperCase() === "YSFREE";
                    setPromoOk(ok);
                    track("Promo Code Entered", { code_valid: ok });
                    toast(ok ? "Promo applied — fee waived" : "Invalid promo code");
                  }}
                  className="rounded-2xl border border-border px-3 text-xs"
                >
                  Apply
                </button>
              </div>
              {promoOk !== null && (
                <p className={`mt-1 text-[10px] ${promoOk ? "text-teal" : "text-destructive"}`}>
                  {promoOk ? "YSFREE applied · PHP 10 fee waived" : "That code isn't valid in this demo"}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setFavourite((f) => !f);
                track("Recipient Saved as Favourite", { saved: !favourite });
                toast(favourite ? "Removed from favourites" : "Recipient saved as favourite");
              }}
              className={`text-xs font-medium ${favourite ? "text-brand" : "text-teal"}`}
            >
              {favourite ? "♥ Saved as favourite" : "♡ Save recipient as favourite"}
            </button>
            <PrimaryButton
              demo="tf-continue"
              onClick={() => {
                if (amountNum <= 0) {
                  setError("Enter an amount to continue.");
                  track("Transfer Validation Failed", { error_reason: "empty_amount" });
                  return;
                }
                if (amountNum > 50000) {
                  setError("Amount exceeds the PHP 50,000 per-transaction limit.");
                  track("Transfer Validation Failed", { error_reason: "over_limit", transfer_amount: amountNum });
                  return;
                }
                if (amountNum + fee > available) {
                  setError("Insufficient available balance in Everyday Savings.");
                  track("Transfer Validation Failed", { error_reason: "insufficient_funds", transfer_amount: amountNum });
                  return;
                }
                track("Transfer Amount Entered", {
                  entry_point: entryPoint,
                  recipient_bank: bank.id,
                  transfer_amount: amountNum,
                  transfer_subtotal: amountNum,
                  transfer_purpose: purpose,
                  send_via: via,
                });
                markStep(3);
                setStep("review");
              }}
            >
              Continue
            </PrimaryButton>

          </div>
        </>
      )}

      {step === "review" && (
        <>
          <ScreenHeader title="Review transfer" onBack={() => setStep("form")} />
          <div className="space-y-3 px-5 py-4 text-sm">
            <Row label="Recipient" value="Maria Santos" mask />
            <Row label="Bank" value={bank.label} />
            <Row label="Send via" value={via} />
            <Row label="Purpose" value={purpose} />
            <Row label="Amount" value={php(amountNum)} mask />
            <Row label="Fee" value={fee === 0 ? "PHP 0 (promo)" : "PHP 10"} />
            <Row label="Date" value="Today, 09:41" />
            <Row label="Total debit" value={php(amountNum + fee)} mask />

            <div className="pt-2">
              <PrimaryButton
                demo="tf-confirm"
                onClick={() => {
                  markStep(4);
                  setStep("verify");
                }}
              >
                Confirm
              </PrimaryButton>
            </div>
          </div>
        </>
      )}

      {step === "verify" && (
        <>
          <ScreenHeader title="Verification (simulated)" onBack={() => setStep("review")} />
          <div className="px-5 py-6">
            <p className="text-xs text-muted-foreground">
              Dummy code is pre-filled. Nothing is sent or validated.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {code.split("").map((c, i) => (
                <span
                  key={i}
                  className="amp-mask flex h-12 w-10 items-center justify-center rounded-xl border border-border text-lg font-semibold text-navy"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <PrimaryButton
                demo="tf-verify"
                onClick={() => {
                  const persona = getPersona();
                  track("Transfer Confirmation Submitted", {
                    total_debit_amount: amountNum + fee,
                    device_trusted: persona.device_trusted,
                    fee_waived: fee === 0 || persona.customer_segment === "priority",
                  });
                  track("InstaPay Transfer Successful", {
                    transaction_reference: reference,
                    recipient_bank: bank.id,
                    total_debit_amount: amountNum + fee,
                    transfer_fee: fee,
                    is_first_transfer: persona.account_age_days < 30,
                  });
                  post({
                    title: `Transfer to Maria Santos`,
                    subtitle: `${bank.label} · ${reference}`,
                    amount: -(amountNum + fee),
                    category: "transfer",
                  });
                  toast("Transfer sent (demo)", {
                    description: `${php(amountNum + fee)} debited · ref ${reference}`,
                  });
                  markStep(5);
                  markConverted();
                  setDone(true);
                  setStep("receipt");
                }}

              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </>
      )}

      {step === "receipt" && (
        <div className="px-5 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy">Transfer Sent</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reference <span className="amp-mask">{reference}</span> (fictional)
          </p>
          <p className="amp-mask mt-4 text-2xl font-semibold text-navy">{php(amountNum + fee)}</p>
          <p className="amp-mask mt-1 text-[11px] text-muted-foreground">
            New Everyday Savings balance {php(balanceOf("savings"))}
          </p>
          <div className="mt-8 space-y-2">
            <PrimaryButton demo="tf-done" onClick={onExit}>Back to dashboard</PrimaryButton>
            <button
              onClick={() => {
                track("Repeat Transfer Started", { recipient_bank: bank.id });
                setDone(false);
                setStep("form");
              }}
              className="w-full rounded-2xl border border-border py-3 text-sm font-medium text-navy"
            >
              Send again
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

function Row({ label, value, mask }: { label: string; value: string; mask?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-medium text-navy ${mask ? "amp-mask" : ""}`}>{value}</span>
    </div>
  );
}
