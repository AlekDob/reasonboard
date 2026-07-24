/** Dispatched when a designated deep-dive scene closes, to gently nudge the next slide. */
export const NUDGE_NEXT_EVENT = "reasonboard:nudge-next";

export function nudgeNextSlide() {
  window.dispatchEvent(new Event(NUDGE_NEXT_EVENT));
}
