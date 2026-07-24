import { useSyncExternalStore } from "react";

/** Footer pager context while inside a node (deep-dive). */
export type DiveNavState = {
  /** 1 = slide nodes, 2 = detail (idea / competitor) */
  floor: 1 | 2;
  /** 0-based index among siblings */
  index: number;
  total: number;
  goPrev: () => void;
  goNext: () => void;
  /** Go up a level (← Board / list) */
  goUp: () => void;
};

type Listener = () => void;

let state: DiveNavState | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function setDiveNav(next: DiveNavState | null) {
  state = next;
  emit();
}

export function clearDiveNav() {
  if (state === null) return;
  state = null;
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

/** Footer / keyboard: null = normal slide pager */
export function useDiveNav() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
