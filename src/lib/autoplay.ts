/**
 * Demo autoplay driver.
 *
 * Instead of faking screens, this clicks the *real* buttons in the DOM with
 * synthetic user gestures, so every Amplitude event fires exactly as it would
 * for a human tapping through the flow.
 */

export type AutoStep = {
  /** value of the data-demo attribute to act on */
  demo?: string;
  /** caption shown in the HUD while this step runs */
  note: string;
  /** text to type into an input */
  type?: string;
  /** treat as a checkbox toggle */
  check?: boolean;
  /** if the target never appears, skip instead of failing (persona-dependent steps) */
  optional?: boolean;
  /** override pause after the step (ms) */
  delay?: number;
};

export type AutoplayState = {
  running: boolean;
  index: number;
  total: number;
  note: string;
  label: string;
};

let state: AutoplayState = { running: false, index: 0, total: 0, note: "", label: "" };
const listeners = new Set<() => void>();
let cancelled = false;
let speed = 1;

export function subscribeAutoplay(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getAutoplayState() {
  return state;
}
function set(patch: Partial<AutoplayState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function setAutoplaySpeed(multiplier: number) {
  speed = multiplier;
}
export function getAutoplaySpeed() {
  return speed;
}

export function stopAutoplay() {
  cancelled = true;
  document.querySelectorAll(".demo-target").forEach((el) => el.classList.remove("demo-target"));
  set({ running: false, note: "", index: 0, total: 0, label: "" });
}

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, Math.max(60, ms / speed)));

function find(demo: string) {
  return document.querySelector<HTMLElement>(`[data-demo="${demo}"]`);
}

async function waitFor(demo: string, timeout: number) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (cancelled) return null;
    const el = find(demo);
    if (el && !(el as HTMLButtonElement).disabled) return el;
    await sleep(80);
  }
  return null;
}

function setNativeValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

async function typeInto(el: HTMLInputElement, text: string) {
  el.focus();
  let acc = "";
  for (const ch of text) {
    if (cancelled) return;
    acc += ch;
    setNativeValue(el, acc);
    await sleep(55);
  }
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

export async function runAutoplay(label: string, steps: AutoStep[]) {
  cancelled = false;
  set({ running: true, index: 0, total: steps.length, note: steps[0]?.note ?? "", label });
  await sleep(500);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (cancelled) return;
    set({ index: i + 1, note: step.note });

    if (!step.demo) {
      await sleep(step.delay ?? 900);
      continue;
    }

    const el = await waitFor(step.demo, step.optional ? 900 : 6000);
    if (!el) {
      if (step.optional) continue;
      set({ note: `Couldn't find "${step.demo}" — stopping.` });
      await sleep(1600);
      stopAutoplay();
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("demo-target");
    await sleep(520);
    if (cancelled) return;

    if (step.type !== undefined && el instanceof HTMLInputElement) {
      await typeInto(el, step.type);
    } else if (step.check && el instanceof HTMLInputElement) {
      el.click();
    } else {
      el.click();
    }

    await sleep(step.delay ?? 800);
    el.classList.remove("demo-target");
  }

  if (cancelled) return;
  set({ note: "Journey complete — check Amplitude for the event stream." });
  await sleep(2600);
  stopAutoplay();
}
