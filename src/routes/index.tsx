import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame, type Tab } from "@/components/bank/PhoneFrame";
import { SignIn } from "@/components/bank/SignIn";
import { Dashboard } from "@/components/bank/Dashboard";
import { TransferFlow, type EntryPoint } from "@/components/bank/TransferFlow";
import { OpenAccountFlow } from "@/components/bank/OpenAccountFlow";
import { DemoPanel, type JumpTarget } from "@/components/bank/DemoPanel";
import { initAnalytics, signInDemoUser, track, type PersonaName } from "@/lib/analytics";
import { BankProvider } from "@/lib/bankStore";
import { Toaster } from "@/components/ui/sonner";
import { AutoplayHUD } from "@/components/bank/AutoplayHUD";
import { runAutoplay, setAutoplaySpeed, stopAutoplay } from "@/lib/autoplay";
import { SCRIPTS } from "@/lib/demoScripts";
import { installTactileFeedback } from "@/lib/tactile";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YS eBank Amplitude Analytics Demo" },
      {
        name: "description",
        content:
          "A fictional mobile banking prototype used as a UX-analytics training sandbox: dashboard, money transfer and account opening journeys, fully instrumented.",
      },
      { property: "og:title", content: "YS eBank Amplitude Analytics Demo" },
      {
        property: "og:description",
        content:
          "Fictional, non-production banking prototype for demonstrating product-analytics instrumentation across three UX journeys.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Index,
});

type Screen = "signin" | "dashboard" | "transfer" | "open";

function Index() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [entryPoint, setEntryPoint] = useState<EntryPoint>("send_receive_menu");
  const [persona, setPersonaName] = useState<PersonaName>("happy");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [runId, setRunId] = useState(0);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);



  useEffect(() => {
    initAnalytics();
    return installTactileFeedback();
  }, []);


  const login = () => {
    signInDemoUser();
    setScreen("dashboard");
    setTab("dashboard");
  };

  const startTransfer = (ep: EntryPoint) => {
    setEntryPoint(ep);
    setScreen("transfer");
  };

  const quickAction = (id: string) => {
    if (id === "send_money" || id === "receive_money") startTransfer("send_receive_menu");
    else if (id === "activate_card") setScreen("open");
  };

  const onTab = (t: Tab) => {
    setTab(t);
    if (t === "dashboard") {
      setPendingAction(null);
      setScreen("dashboard");
    }
    if (t === "send") startTransfer("send_receive_menu");
    if (t === "more") setScreen("open");
    if (t === "bills" || t === "load") {
      setPendingAction(t === "bills" ? "pay_bills" : "buy_load");
      setScreen("dashboard");
      setRunId((n) => n + 1);
    }
  };


  const jump = (target: JumpTarget, forAutoplay = false) => {
    stopAutoplay();
    if (forAutoplay && (target === "flow1" || target === "flow2-qr-login")) {
      // these scripts start from the sign-in screen so the login/QR taps are visible
      setScreen("signin");
      setTab("dashboard");
      setPendingAction(null);
      setRunId((n) => n + 1);
      document.getElementById("phone-scroll")?.scrollTo({ top: 0 });
      return;
    }
    if (target === "flow1") {
      signInDemoUser();
      setTab("dashboard");
      setScreen("dashboard");
    } else if (target === "flow2-qr-login") {
      setTab("send");
      startTransfer("qr_login");
    } else if (target === "flow2-qr-dashboard") {
      signInDemoUser();
      setTab("send");
      startTransfer("qr_dashboard");
    } else if (target === "flow2-menu") {
      signInDemoUser();
      setTab("send");
      startTransfer("send_receive_menu");
    } else {
      signInDemoUser();
      setTab("more");
      setScreen("open");
    }
    setRunId((n) => n + 1);
    document.getElementById("phone-scroll")?.scrollTo({ top: 0 });
  };


  const autoplay = (target: JumpTarget) => {
    jump(target, true);
    const script = SCRIPTS[target];
    window.setTimeout(() => void runAutoplay(script.label, script.steps), 450);
  };

  return (
    <BankProvider>
      <PhoneFrame showTabs={screen !== "signin"} tab={tab} onTab={onTab} darkStatus={false}>
        {screen === "signin" && <SignIn onLogin={login} onQr={() => startTransfer("qr_login")} />}
        {screen === "dashboard" && (
          <Dashboard
            key={`dash-${runId}`}
            initialAction={pendingAction}
            onQuickAction={quickAction}
            onQr={() => startTransfer("qr_dashboard")}
            onOpenAccount={() => setScreen("open")}
            onLogout={() => {
              track("Dashboard Abandoned", { dashboard_section: "accounts" });
              setScreen("signin");
            }}
          />
        )}
        {screen === "transfer" && (
          <TransferFlow
            key={`transfer-${entryPoint}-${runId}`}
            entryPoint={entryPoint}
            onExit={() => {
              setScreen("dashboard");
              setTab("dashboard");
            }}
          />
        )}
        {screen === "open" && (
          <OpenAccountFlow
            key={`open-${runId}`}
            onExit={() => {
              setScreen("dashboard");
              setTab("dashboard");
            }}
          />
        )}
      </PhoneFrame>
      <AutoplayHUD />
      <DemoPanel
        persona={persona}
        onPersona={setPersonaName}
        onJump={jump}
        onAutoplay={autoplay}
        speed={speed}
        onSpeed={(s) => {
          setSpeed(s);
          setAutoplaySpeed(s);
        }}
      />
      <Toaster position="top-center" />
    </BankProvider>
  );
}

