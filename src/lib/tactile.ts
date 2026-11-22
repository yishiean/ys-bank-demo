/**
 * Tactile feedback layer — makes taps feel like a real native app:
 *  - material-style ripple spreading from the exact touch point
 *  - press-down scale (handled in CSS via :active)
 *  - short haptic buzz on devices that support vibration
 * Installed once globally; works on every button in the prototype without
 * having to touch each component.
 */

const INTERACTIVE_SELECTOR =
  'button, [role="button"], [data-demo], a[href], input[type="checkbox"], label[data-tactile]';

function spawnRipple(target: HTMLElement, clientX: number, clientY: number) {
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  const computed = getComputedStyle(target);
  if (computed.position === "static") target.style.position = "relative";
  if (computed.overflow === "visible") target.style.overflow = "hidden";

  const size = Math.max(rect.width, rect.height) * 2;
  const ripple = document.createElement("span");
  ripple.className = "tactile-ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${clientX - rect.left - size / 2}px`;
  ripple.style.top = `${clientY - rect.top - size / 2}px`;
  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  window.setTimeout(() => ripple.remove(), 900);
}

export function installTactileFeedback() {
  if (typeof window === "undefined") return () => {};
  if ((window as unknown as { __tactile?: boolean }).__tactile) return () => {};
  (window as unknown as { __tactile?: boolean }).__tactile = true;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onPointerDown = (event: PointerEvent) => {
    const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      INTERACTIVE_SELECTOR,
    );
    if (!el || el.hasAttribute("disabled") || el.dataset["noRipple"] === "true") return;

    el.classList.add("is-pressed");
    const release = () => el.classList.remove("is-pressed");
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });

    if (!reduced) spawnRipple(el, event.clientX, event.clientY);
    navigator.vibrate?.(8);
  };

  window.addEventListener("pointerdown", onPointerDown, true);
  return () => {
    window.removeEventListener("pointerdown", onPointerDown, true);
    (window as unknown as { __tactile?: boolean }).__tactile = false;
  };
}
