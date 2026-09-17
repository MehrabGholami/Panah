import { Box, keyframes, alpha, useTheme } from '@mui/material';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface OnboardingOverlayProps {
  rect: DOMRect | null;
  targetElement?: HTMLElement | null;
  interactive?: boolean;
  dimOnly?: boolean;
}

const pulseRing = keyframes`
  0%, 100% {
    box-shadow:
      0 0 0 2px rgba(34, 211, 238, 0.95),
      0 0 0 8px rgba(34, 211, 238, 0.14);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(34, 211, 238, 1),
      0 0 0 12px rgba(34, 211, 238, 0.26),
      0 0 24px rgba(34, 211, 238, 0.3);
  }
`;

const RING = 4;

/**
 * Dim the page and float an exact-size clone of the live target
 * at the same viewport coordinates (pixel-aligned to the real icon/row).
 */
export function OnboardingOverlay({
  rect,
  targetElement = null,
  interactive = false,
  dimOnly = false,
}: OnboardingOverlayProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dim = isDark ? 'rgba(2, 6, 23, 0.72)' : 'rgba(15, 23, 42, 0.58)';
  const cloneHostRef = useRef<HTMLDivElement>(null);
  const [hasClone, setHasClone] = useState(false);
  const [liveBox, setLiveBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const canUseTarget =
    Boolean(targetElement) &&
    typeof document !== 'undefined' &&
    targetElement instanceof HTMLElement &&
    document.contains(targetElement);

  // Keep stage locked to the live element's box (not an inflated/padded rect)
  useLayoutEffect(() => {
    if (dimOnly || !canUseTarget || !targetElement) {
      setLiveBox(null);
      return;
    }

    const read = () => {
      const r = targetElement.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      setLiveBox({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };

    read();
    const ro = new ResizeObserver(read);
    ro.observe(targetElement);
    window.addEventListener('scroll', read, true);
    window.addEventListener('resize', read);
    const id = window.setInterval(read, 80);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', read, true);
      window.removeEventListener('resize', read);
      window.clearInterval(id);
    };
  }, [canUseTarget, targetElement, dimOnly, rect?.top, rect?.left, rect?.width, rect?.height]);

  useLayoutEffect(() => {
    const host = cloneHostRef.current;
    if (!host) {
      setHasClone(false);
      return;
    }
    host.replaceChildren();

    if (!canUseTarget || !targetElement || !liveBox) {
      setHasClone(false);
      return;
    }

    const clone = targetElement.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-tour-clone', 'true');
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.style.boxSizing = 'border-box';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.position = 'static';
    clone.style.inset = 'auto';
    clone.style.top = 'auto';
    clone.style.left = 'auto';
    clone.style.right = 'auto';
    clone.style.bottom = 'auto';
    clone.style.width = `${liveBox.width}px`;
    clone.style.height = `${liveBox.height}px`;
    clone.style.minWidth = `${liveBox.width}px`;
    clone.style.minHeight = `${liveBox.height}px`;
    clone.style.maxWidth = `${liveBox.width}px`;
    clone.style.maxHeight = `${liveBox.height}px`;
    clone.style.opacity = '1';
    clone.style.pointerEvents = 'none';
    clone.setAttribute('tabindex', '-1');
    clone.setAttribute('aria-hidden', 'true');

    clone.querySelectorAll('.MuiListItemText-root, .MuiTypography-root, span, p').forEach((node) => {
      const el = node as HTMLElement;
      el.style.opacity = '1';
      el.style.maxWidth = 'none';
      el.style.overflow = 'hidden';
      el.style.visibility = 'visible';
      el.style.textOverflow = 'ellipsis';
      el.style.whiteSpace = 'nowrap';
    });

    host.appendChild(clone);
    setHasClone(true);
  }, [canUseTarget, targetElement, liveBox]);

  if (typeof document === 'undefined') return null;

  const dimLayer = (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (t) => t.zIndex.modal + 1,
        bgcolor: dim,
        pointerEvents: 'auto',
      }}
    />
  );

  if (dimOnly || !liveBox) {
    return createPortal(dimLayer, document.body);
  }

  const top = liveBox.top - RING;
  const left = liveBox.left - RING;
  const width = liveBox.width + RING * 2;
  const height = liveBox.height + RING * 2;

  const stage = (
    <>
      {dimLayer}
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          top,
          left,
          width,
          height,
          zIndex: (t) => t.zIndex.modal + 2,
          borderRadius: 2,
          overflow: 'hidden',
          pointerEvents: interactive ? 'none' : 'auto',
          bgcolor: hasClone
            ? isDark
              ? theme.palette.background.paper
              : '#fff'
            : 'transparent',
          border: '2px solid',
          borderColor: alpha(theme.palette.primary.main, 0.95),
          animation: `${pulseRing} 2.2s ease-in-out infinite`,
          boxSizing: 'border-box',
          // Ring only — clone sits flush to the real control size
          p: `${RING}px`,
          display: 'block',
        }}
      >
        <Box
          ref={cloneHostRef}
          sx={{
            width: liveBox.width,
            height: liveBox.height,
            overflow: 'hidden',
            '& .MuiListItemText-primary, & .MuiTypography-root': {
              opacity: '1 !important',
              visibility: 'visible !important',
              color: `${theme.palette.text.primary} !important`,
            },
            '& .MuiListItemIcon-root, & .MuiSvgIcon-root': {
              opacity: '1 !important',
              color: `${theme.palette.primary.main} !important`,
            },
            '& .MuiListItemButton-root, & .MuiIconButton-root': {
              width: '100% !important',
              height: '100% !important',
              minHeight: '0 !important',
              boxSizing: 'border-box !important',
            },
          }}
        />
      </Box>
    </>
  );

  return createPortal(stage, document.body);
}
