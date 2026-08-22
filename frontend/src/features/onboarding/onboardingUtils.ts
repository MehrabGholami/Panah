import type { TourPlacement } from './types';

function isInsideHiddenAncestor(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    if (node.getAttribute('aria-hidden') === 'true') return true;
    if (node.getAttribute('data-tour-ignore') === 'true') return true;
    if (node.classList?.contains('MuiModal-hidden')) return true;
    // Closed / keepMounted temporary drawers
    if (
      node.classList?.contains('MuiDrawer-modal') &&
      (node.classList.contains('MuiModal-hidden') || node.getAttribute('aria-hidden') === 'true')
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function isInDockedDrawer(el: HTMLElement): boolean {
  return Boolean(el.closest('.MuiDrawer-docked, [data-tour-drawer="desktop"]'));
}

function isInMobileDrawer(el: HTMLElement): boolean {
  return Boolean(el.closest('.MuiDrawer-modal, [data-tour-drawer="mobile"]'));
}

/** True only when the element is almost fully inside the viewport and not in a closed drawer/modal. */
export function isEffectivelyVisible(el: HTMLElement): boolean {
  if (isInsideHiddenAncestor(el)) return false;

  // Prefer rejecting off-screen / display:none ancestors via computed style walk
  let node: HTMLElement | null = el;
  while (node) {
    const style = window.getComputedStyle(node);
    if (
      style.visibility === 'hidden' ||
      style.display === 'none' ||
      Number(style.opacity) < 0.05
    ) {
      return false;
    }
    node = node.parentElement;
  }

  if (el.style.pointerEvents === 'none') {
    // ok for some icons; don't reject solely on self pointer-events
  }

  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const visibleW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
  const visibleH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  if (visibleW <= 0 || visibleH <= 0) return false;

  if (rect.height > vh * 0.65) {
    return visibleW >= rect.width * 0.8 && visibleH >= Math.min(160, vh * 0.3);
  }

  return visibleW >= rect.width * 0.85 && visibleH >= rect.height * 0.85;
}

export function queryTourTarget(selector: string): HTMLElement | null {
  try {
    const parts = selector
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const isMobileViewport = window.matchMedia('(max-width: 899.95px)').matches;

    for (const part of parts) {
      const nodes = Array.from(document.querySelectorAll(part)) as HTMLElement[];
      const visible = nodes.filter(isEffectivelyVisible);
      if (visible.length === 0) continue;

      // Prefer the sidebar that actually belongs to this viewport
      const preferred = visible.filter((el) =>
        isMobileViewport ? isInMobileDrawer(el) || !isInDockedDrawer(el) : isInDockedDrawer(el),
      );
      const pool = preferred.length > 0 ? preferred : visible;

      pool.sort((a, b) => {
        // Prefer docked on desktop / modal-open on mobile already applied
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        return ar.width * ar.height - br.width * br.height;
      });
      return pool[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function waitForTarget(
  selector: string,
  timeoutMs = 3000,
  intervalMs = 50,
): Promise<HTMLElement | null> {
  const start = Date.now();
  let el = queryTourTarget(selector);
  if (el) return el;

  return new Promise((resolve) => {
    const tick = () => {
      el = queryTourTarget(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}

export async function scrollTargetIntoView(el: HTMLElement): Promise<DOMRect> {
  el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  return el.getBoundingClientRect();
}

export interface TooltipPosition {
  top: number;
  left: number;
  placement: TourPlacement;
}

const TOOLTIP_GAP = 16;
const VIEWPORT_PAD = 16;

export function computeTooltipPosition(
  targetRect: DOMRect | null,
  tooltipSize: { width: number; height: number },
  preferred: TourPlacement = 'auto',
): TooltipPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tw = Math.min(tooltipSize.width, vw - VIEWPORT_PAD * 2);
  const th = tooltipSize.height;

  if (preferred === 'center' || !targetRect) {
    return {
      top: Math.max(VIEWPORT_PAD, (vh - th) / 2),
      left: Math.max(VIEWPORT_PAD, (vw - tw) / 2),
      placement: 'center',
    };
  }

  const candidates: TourPlacement[] =
    preferred === 'auto'
      ? ['right', 'bottom', 'left', 'top']
      : [preferred, 'right', 'bottom', 'left', 'top'];

  const place = (placement: TourPlacement): TooltipPosition => {
    let top = 0;
    let left = 0;
    switch (placement) {
      case 'top':
        top = targetRect.top - th - TOOLTIP_GAP;
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + TOOLTIP_GAP;
        left = targetRect.left + targetRect.width / 2 - tw / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - th / 2;
        left = targetRect.left - tw - TOOLTIP_GAP;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - th / 2;
        left = targetRect.right + TOOLTIP_GAP;
        break;
      case 'center':
        top = (vh - th) / 2;
        left = (vw - tw) / 2;
        break;
      default:
        top = targetRect.bottom + TOOLTIP_GAP;
        left = targetRect.left + targetRect.width / 2 - tw / 2;
    }
    return { top, left, placement };
  };

  const clamp = (pos: TooltipPosition): TooltipPosition => ({
    ...pos,
    top: Math.max(VIEWPORT_PAD, Math.min(pos.top, vh - th - VIEWPORT_PAD)),
    left: Math.max(VIEWPORT_PAD, Math.min(pos.left, vw - tw - VIEWPORT_PAD)),
  });

  const score = (pos: TooltipPosition) => {
    const c = clamp(pos);
    const overlapX = Math.max(
      0,
      Math.min(c.left + tw, targetRect.right) - Math.max(c.left, targetRect.left),
    );
    const overlapY = Math.max(
      0,
      Math.min(c.top + th, targetRect.bottom) - Math.max(c.top, targetRect.top),
    );
    const overlapArea = overlapX * overlapY;
    const dx = Math.abs(c.left - pos.left) + Math.abs(c.top - pos.top);
    return overlapArea * 4 + dx;
  };

  let best = clamp(place(candidates[0] ?? 'right'));
  let bestScore = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const raw = place(c);
    const s = score(raw);
    if (s < bestScore) {
      bestScore = s;
      best = clamp(raw);
    }
  }
  return best;
}

export function inflateRect(rect: DOMRect, padding = 4): DOMRect {
  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const right = Math.min(window.innerWidth, rect.right + padding);
  const bottom = Math.min(window.innerHeight, rect.bottom + padding);
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

export function rectsEqual(a: DOMRect | null, b: DOMRect | null, epsilon = 0.5): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < epsilon &&
    Math.abs(a.left - b.left) < epsilon &&
    Math.abs(a.width - b.width) < epsilon &&
    Math.abs(a.height - b.height) < epsilon
  );
}
