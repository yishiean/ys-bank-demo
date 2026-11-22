import { useEffect, useState } from "react";
import { PrimaryButton, ScreenHeader } from "./PhoneFrame";
import { getPersona, identifyPersona, markConverted, markStep, track } from "@/lib/analytics";
import faceStick from "@/assets/face-stick.png";



type Step = "product" | "consent" | "id" | "selfie" | "details" | "submitted" | "activate" | "done";

const REFERENCE = "APP-DEMO-77213";

export function OpenAccountFlow({ onExit }: { onExit: () => void }) {
  const [step, setStep] = useState<Step>("product");
  const [privacy, setPrivacy] = useState(false);
  const [cardTerms, setCardTerms] = useState(false);
  const [idType, setIdType] = useState("passport");
  const [retakes, setRetakes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [livenessError, setLivenessError] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    track("Start Account Opening", { product: "savings_debit" });
    markStep(1);
  }, []);

  const tryLiveness = () => {
    const persona = getPersona();
    const next = attempts + 1;
    setAttempts(next);
    const shouldFail = !persona.existing_customer && next < 3;
    track("Complete Selfie Liveness Check", {
      liveness_result: shouldFail ? "failed" : "passed",
      liveness_attempts: next,
    });
    if (shouldFail) {
      setLivenessError(true);
      return;
    }
    setLivenessError(false);
    markStep(5);
    setStep("details");
  };

  return (
    <div className="pb-6">
      {step === "product" && (
        <>
          <ScreenHeader title="Open an account" onBack={onExit} />
          <div className="space-y-3 px-5 py-4">
            {[
              { id: "savings_debit", label: "Savings with Debit Card", desc: "No maintaining balance (demo)" },
              { id: "time_deposit", label: "Time Deposit", desc: "Coming soon in this sandbox" },
            ].map((p) => (
              <button
                key={p.id}
                data-demo={`oa-product-${p.id}`}
                disabled={p.id !== "savings_debit"}
                onClick={() => {
                  track("Select Account Type", {
                    account_type: "savings_debit",
                    card_type: "personal_savings",
                  });
                  markStep(2);
                  setStep("consent");
                }}
                className="w-full rounded-2xl border border-border p-4 text-left disabled:opacity-40"
              >
                <p className="text-sm font-semibold text-navy">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "consent" && (
        <>
          <ScreenHeader title="Consent" onBack={() => setStep("product")} />
          <div className="space-y-4 px-5 py-4 text-xs">
            <label className="flex items-start gap-3">
              <input data-demo="oa-privacy" type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
              <span>I accept the (fictional) Data Privacy Notice.</span>
            </label>
            <label className="flex items-start gap-3">
              <input data-demo="oa-cardterms" type="checkbox" checked={cardTerms} onChange={(e) => setCardTerms(e.target.checked)} />
              <span>I accept the (fictional) Debit Card Terms.</span>
            </label>
            <PrimaryButton
              demo="oa-consent-continue"
              disabled={!privacy || !cardTerms}
              onClick={() => {
                track("Accept Terms & Consent", {
                  data_privacy_accepted: true,
                  debit_card_terms_accepted: true,
                });
                markStep(3);
                setStep("id");
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        </>
      )}

      {step === "id" && (
        <>
          <ScreenHeader title="ID capture (mock)" onBack={() => setStep("consent")} />
          <div className="space-y-4 px-5 py-4">
            <div className="flex gap-2">
              {["passport", "drivers_license", "national_id"].map((t) => (
                <button
                  key={t}
                  data-demo={`oa-id-${t}`}
                  onClick={() => setIdType(t)}
                  className={`flex-1 rounded-xl border px-2 py-2 text-[11px] capitalize ${
                    idType === t ? "border-brand text-brand" : "border-border"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Front", "Back"].map((s) => (
                <div
                  key={s}
                  className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-border text-[11px] text-muted-foreground"
                >
                  {s} placeholder
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Placeholder only — never upload a real ID into this prototype.
            </p>
            <button
              data-demo="oa-retake"
              onClick={() => setRetakes((r) => r + 1)}
              className="w-full rounded-2xl border border-border py-2 text-xs text-navy"
            >
              Retake ({retakes})
            </button>
            <PrimaryButton
              demo="oa-id-continue"
              onClick={() => {
                track("Capture ID Document", { id_document_type: idType, retake_count: retakes });
                markStep(4);
                setStep("selfie");
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        </>
      )}

      {step === "selfie" && (
        <>
          <ScreenHeader title="Selfie check (mock)" onBack={() => setStep("id")} />
          <div className="px-5 py-6">
            <div className="relative mx-auto flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-brand bg-brand/5">
              <img
                src={faceStick}
                alt="Align your face inside the frame"
                width={160}
                height={160}
                loading="lazy"
                className="h-40 w-40 animate-pulse object-contain opacity-80"
              />
              <span className="absolute bottom-4 text-[10px] uppercase tracking-wide text-muted-foreground">
                Align your face · mock camera
              </span>
            </div>

            {livenessError && (
              <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                We couldn't verify the liveness check. Please try again. (attempt {attempts})
              </p>
            )}
            <div className="mt-6">
              <PrimaryButton demo="oa-liveness" onClick={tryLiveness}>Simulate liveness check</PrimaryButton>
            </div>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <ScreenHeader title="Personal details" onBack={() => setStep("selfie")} />
          <div className="space-y-3 px-5 py-4">
            <input
              data-demo="oa-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (fabricated)"
              className="amp-mask w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <input
              data-demo="oa-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (fabricated)"
              className="amp-mask w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <input
              placeholder="City (fabricated)"
              className="amp-mask w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <p className="text-[10px] text-muted-foreground">
              Nothing typed here is stored or transmitted.
            </p>
            <PrimaryButton
              demo="oa-details-continue"
              onClick={() => {
                const completed = [name, email].filter(Boolean).length;
                track("Fill Personal Details", {
                  fields_completed: completed,
                  field_error_count: 2 - completed,
                });
                markStep(6);
                setStep("submitted");
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        </>
      )}

      {step === "submitted" && (
        <div className="px-5 py-10 text-center">
          <h2 className="text-lg font-semibold text-navy">Review & submit</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Application is simulated — nothing is sent to a bank.
          </p>
          <div className="mt-8">
            <PrimaryButton
              demo="oa-submit"
              onClick={() => {
                track("Submit Account Application", { application_reference: REFERENCE });
                markStep(7);
                setStep("activate");
              }}
            >
              Submit application
            </PrimaryButton>
          </div>
        </div>
      )}

      {step === "activate" && (
        <>
          <ScreenHeader title="Activate account" />
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-muted-foreground">Dummy email code (pre-filled)</p>
            <div className="mt-3 flex justify-center gap-2">
              {"000000".split("").map((c, i) => (
                <span
                  key={i}
                  className="amp-mask flex h-12 w-10 items-center justify-center rounded-xl border border-border text-lg font-semibold text-navy"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <PrimaryButton
                demo="oa-activate"
                onClick={() => {
                  track("Activate Account", {
                    application_reference: REFERENCE,
                    activation_channel: "email",
                  });
                  identifyPersona();
                  markStep(8);
                  markConverted();
                  setStep("done");
                }}
              >
                Activate
              </PrimaryButton>
            </div>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal">
            ✓
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy">Congratulations!</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your fictional account <span className="amp-mask">****9021</span> is ready.
          </p>
          <div className="mt-8">
            <PrimaryButton demo="oa-done" onClick={onExit}>Go To Dashboard</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
