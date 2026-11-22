import { useState } from "react";
import { YSLogo, PrimaryButton } from "./PhoneFrame";
import { track } from "@/lib/analytics";
import profilePhoto from "@/assets/profile-yi-shiean.jpg";


export function SignIn({
  onLogin,
  onQr,
}: {
  onLogin: () => void;
  onQr: () => void;
}) {
  const [pw, setPw] = useState("");

  return (
    <div className="flex min-h-[560px] flex-col px-6 pb-6 pt-10">
      <YSLogo />
      <div className="mt-10 flex flex-col items-center">
        <img
          src={profilePhoto}
          alt="Demo profile photo of Yi Shiean Tan"
          className="amp-mask h-20 w-20 rounded-full object-cover ring-2 ring-brand/30"
        />

        <p className="amp-mask mt-3 text-base font-semibold text-navy">Yi Shiean Tan</p>
        <p className="text-xs text-muted-foreground">Welcome back (demo profile)</p>
      </div>

      <div className="mt-8">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="pw">
          Password (mock — any text works)
        </label>
        <input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="off"
          data-demo="signin-password"
          placeholder="••••••••"
          className="amp-mask mt-1 w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <p className="mt-2 text-[10px] text-muted-foreground">
          Nothing is authenticated, stored, or transmitted.
        </p>
      </div>

      <div className="mt-6">
        <PrimaryButton demo="signin-login" onClick={onLogin}>Log In</PrimaryButton>
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <button onClick={onLogin} className="flex flex-col items-center gap-1 text-xs text-navy">
          <span className="live-glow flex h-12 w-12 items-center justify-center rounded-full border border-border text-lg">
            ☺
          </span>
          Face unlock
        </button>
        <button
          data-demo="signin-qr"
          onClick={() => {
            track("Entry Point Opened", { entry_point_name: "qr_login" });
            onQr();
          }}
          className="flex flex-col items-center gap-1 text-xs text-navy"
        >
          <span className="live-glow flex h-12 w-12 items-center justify-center rounded-full border border-border text-lg">
            ▣
          </span>
          Scan QR
        </button>
      </div>
    </div>
  );
}
