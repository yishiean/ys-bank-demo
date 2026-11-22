import * as amplitude from "@amplitude/analytics-browser";
import { sessionReplayPlugin } from "@amplitude/plugin-session-replay-browser";

const API_KEY = "d7a78ff6d9e59ab10be2b61e80c046d0";

export type Platform = "iOS" | "Android" | "Web";
export type PersonaName = "happy" | "friction";

export interface Persona {
  app_up_to_date: boolean;
  device_trusted: boolean;
  existing_customer: boolean;
  customer_segment: "priority" | "preferred" | "standard";
  utm_medium: string;
  account_age_days: number;
}

export const PERSONAS: Record<PersonaName, Persona> = {
  happy: {
    app_up_to_date: true,
    device_trusted: true,
    existing_customer: true,
    customer_segment: "priority",
    utm_medium: "direct",
    account_age_days: 420,
  },
  friction: {
    app_up_to_date: false,
    device_trusted: false,
    existing_customer: false,
    customer_segment: "standard",
    utm_medium: "llm",
    account_age_days: 12,
  },
};

declare global {
  interface Window {
    __DEMO_PLATFORM?: Platform;
    __PERSONA?: Persona;
  }
}

const platformPlugin = {
  name: "demo-platform",
  type: "enrichment" as const,
  setup: async () => undefined,
  execute: async (event: any) => {
    event.platform = (typeof window !== "undefined" && window.__DEMO_PLATFORM) || "Web";
    return event;
  },
};

let started = false;
let sessionStart = Date.now();
let deepestStep = 0;
let converted = false;

export function getPlatform(): Platform {
  if (typeof window === "undefined") return "Web";
  return window.__DEMO_PLATFORM ?? "iOS";
}

export function setPlatform(p: Platform) {
  if (typeof window !== "undefined") window.__DEMO_PLATFORM = p;
}

export function getPersona(): Persona {
  if (typeof window === "undefined") return PERSONAS.happy;
  return window.__PERSONA ?? PERSONAS.happy;
}

export function setPersona(name: PersonaName) {
  if (typeof window === "undefined") return;
  window.__PERSONA = PERSONAS[name];
  identifyPersona();
}

function fakeId() {
  return `demo-user-${Math.random().toString(36).slice(2, 8)}`;
}

export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.__DEMO_PLATFORM = window.__DEMO_PLATFORM ?? "iOS";
  window.__PERSONA = window.__PERSONA ?? PERSONAS.happy;

  amplitude.add(
    sessionReplayPlugin({
      sampleRate: 1,
      privacyConfig: { maskSelector: [".amp-mask"] },
    } as any),
  );
  amplitude.init(API_KEY, {
    autocapture: { elementInteractions: true, pageViews: true, sessions: true },
  });
  amplitude.add(platformPlugin);

  sessionStart = Date.now();
  window.addEventListener("pagehide", endSession);
}

export function track(name: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  amplitude.track(name, props ?? {});
}

export function markStep(step: number) {
  if (step > deepestStep) deepestStep = step;
}

export function markConverted() {
  converted = true;
}

export function endSession() {
  track("session_ended", {
    deepest_step_reached: deepestStep,
    converted,
    session_duration_seconds: Math.round((Date.now() - sessionStart) / 1000),
  });
}

export function identifyPersona(userId?: string) {
  if (typeof window === "undefined") return;
  const persona = getPersona();
  if (userId) amplitude.setUserId(userId);
  const id = new amplitude.Identify()
    .set("app_up_to_date", persona.app_up_to_date)
    .set("device_trusted", persona.device_trusted)
    .set("existing_customer", persona.existing_customer)
    .set("customer_segment", persona.customer_segment)
    .set("utm_medium", persona.utm_medium)
    .set("account_age_days", persona.account_age_days)
    .set("device_type", "mobile");
  amplitude.identify(id);
}

export function signInDemoUser() {
  identifyPersona(fakeId());
}

export function resetDemoSession() {
  if (typeof window === "undefined") return;
  endSession();
  amplitude.reset();
  sessionStart = Date.now();
  deepestStep = 0;
  converted = false;
  identifyPersona(fakeId());
}
