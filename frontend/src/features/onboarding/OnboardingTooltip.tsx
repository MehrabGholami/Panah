import {
  Box,
  Button,
  Paper,
  Popper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toPersianDigits } from '@/shared/utils/persianDigits';
import type { TourPlacement } from './types';

interface OnboardingTooltipProps {
  title: string;
  description: string;
  stepIndex: number;
  stepTotal: number;
  isFirst: boolean;
  isLast: boolean;
  isWelcome: boolean;
  targetElement: HTMLElement | null;
  preferredPlacement?: TourPlacement;
  onNext: () => void;
  onPrev: () => void;
  onSkipRequest: () => void;
  onFinish: () => void;
}

type PopperPlacement = 'top' | 'bottom' | 'left' | 'right';

function toPopperPlacement(preferred: TourPlacement, anchor: HTMLElement | null): PopperPlacement {
  if (preferred === 'center' || !anchor) return 'bottom';
  if (preferred === 'auto') {
    const rect = anchor.getBoundingClientRect();
    const space: Record<PopperPlacement, number> = {
      top: rect.top,
      bottom: window.innerHeight - rect.bottom,
      left: rect.left,
      right: window.innerWidth - rect.right,
    };
    return (Object.entries(space) as [PopperPlacement, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'bottom';
  }
  if (preferred === 'top' || preferred === 'bottom' || preferred === 'left' || preferred === 'right') {
    return preferred;
  }
  return 'bottom';
}

function isDomNode(value: unknown): value is HTMLElement {
  return typeof Node !== 'undefined' && value instanceof HTMLElement && document.contains(value);
}

function TourProgress({
  stepIndex,
  stepTotal,
  label,
}: {
  stepIndex: number;
  stepTotal: number;
  label: string;
}) {
  const theme = useTheme();
  const progress = ((stepIndex + 1) / Math.max(stepTotal, 1)) * 100;
  const maxDots = Math.min(stepTotal, 10);
  const activeDot = Math.round((stepIndex / Math.max(stepTotal - 1, 1)) * (maxDots - 1));

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.1 }} gap={1}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: 'primary.main',
          }}
        >
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          {toPersianDigits(String(Math.round(progress)))}٪
        </Typography>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          height: 12,
          borderRadius: 999,
          overflow: 'hidden',
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.22),
          boxShadow: `inset 0 1px 2px ${alpha('#000', 0.08)}`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 1,
            width: `calc(${progress}% - 2px)`,
            minWidth: progress > 0 ? 12 : 0,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${alpha(theme.palette.primary.light, 0.95)} 100%)`,
            boxShadow: `0 0 14px ${alpha(theme.palette.primary.main, 0.55)}`,
            transition: 'width 0.35s ease',
          }}
        />
      </Box>

      {stepTotal > 1 && (
        <Stack direction="row" spacing={0.65} justifyContent="center" sx={{ mt: 1.25 }}>
          {Array.from({ length: maxDots }).map((_, i) => {
            const filled = i <= activeDot;
            const isCurrent = i === activeDot;
            return (
              <Box
                key={i}
                sx={{
                  width: isCurrent ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  bgcolor: filled ? 'primary.main' : alpha(theme.palette.primary.main, 0.2),
                  boxShadow: isCurrent ? `0 0 8px ${alpha(theme.palette.primary.main, 0.55)}` : 'none',
                  transition: 'all 0.25s ease',
                }}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

/**
 * Product-tour card: glass panel + strong progress meter.
 */
export function OnboardingTooltip({
  title,
  description,
  stepIndex,
  stepTotal,
  isFirst,
  isLast,
  isWelcome,
  targetElement,
  preferredPlacement = 'auto',
  onNext,
  onPrev,
  onSkipRequest,
  onFinish,
}: OnboardingTooltipProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const isDark = theme.palette.mode === 'dark';

  const anchorEl = isDomNode(targetElement) ? targetElement : null;
  const centered = preferredPlacement === 'center' || isWelcome || !anchorEl;
  const placement = useMemo(
    () => toPopperPlacement(preferredPlacement, anchorEl),
    [preferredPlacement, anchorEl],
  );

  const modifiers = useMemo(
    () => [
      { name: 'offset', options: { offset: [0, 16] } },
      { name: 'preventOverflow', options: { padding: 14, altAxis: true, tether: true } },
      { name: 'flip', options: { padding: 14 } },
    ],
    [],
  );

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [stepIndex, title]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isLast) onFinish();
        else onSkipRequest();
      } else if (e.key === 'ArrowLeft' && !isLast) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowRight' && !isFirst && !isWelcome) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFirst, isLast, isWelcome, onFinish, onNext, onPrev, onSkipRequest]);

  const progressLabel = t('onboarding.progress', {
    current: toPersianDigits(String(stepIndex + 1)),
    total: toPersianDigits(String(stepTotal)),
  });

  const card = (
    <Paper
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tour-title"
      aria-describedby="onboarding-tour-desc"
      elevation={0}
      sx={{
        position: 'relative',
        width: { xs: 'min(360px, calc(100vw - 28px))', sm: 380 },
        maxWidth: 'calc(100vw - 28px)',
        borderRadius: 3.5,
        overflow: 'hidden',
        outline: 'none',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.78) : alpha('#FFFFFF', 0.82),
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, isDark ? 0.35 : 0.28),
        backdropFilter: 'blur(18px) saturate(1.25)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.25)',
        boxShadow: isDark
          ? `0 24px 64px ${alpha('#000', 0.55)}, inset 0 1px 0 ${alpha('#fff', 0.06)}`
          : `0 24px 64px ${alpha('#0f172a', 0.22)}, inset 0 1px 0 ${alpha('#fff', 0.7)}`,
        backgroundImage: isDark
          ? `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, transparent 42%)`
          : `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha('#fff', 0.5)} 40%, transparent 70%)`,
      }}
    >
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.light, 0.7)})`,
        }}
      />

      <Box sx={{ p: 2.4 }}>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 0.5 }} gap={1}>
          {!isLast ? (
            <Button
              size="small"
              color="inherit"
              onClick={onSkipRequest}
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                minWidth: 0,
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
              }}
            >
              {t('onboarding.skip')}
            </Button>
          ) : (
            <Box sx={{ height: 30 }} />
          )}
        </Stack>

        <Box sx={{ mb: 1.75 }}>
          <TourProgress stepIndex={stepIndex} stepTotal={stepTotal} label={progressLabel} />
        </Box>

        <Typography
          id="onboarding-tour-title"
          variant="subtitle1"
          fontWeight={800}
          sx={{ mb: 0.85, lineHeight: 1.45, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
        <Typography
          id="onboarding-tour-desc"
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.9, whiteSpace: 'pre-line', mb: 2.25 }}
        >
          {description}
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          {!isFirst && !isWelcome && (
            <Button
              variant="outlined"
              onClick={onPrev}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                px: 2,
                borderColor: alpha(theme.palette.primary.main, 0.35),
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              {t('onboarding.prev')}
            </Button>
          )}
          {isWelcome ? (
            <Button
              variant="contained"
              onClick={onNext}
              autoFocus
              sx={{
                borderRadius: 2.5,
                fontWeight: 800,
                px: 3,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              {t('onboarding.start')}
            </Button>
          ) : isLast ? (
            <Button
              variant="contained"
              onClick={onFinish}
              autoFocus
              sx={{
                borderRadius: 2.5,
                fontWeight: 800,
                px: 3,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              {t('onboarding.finish')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={onNext}
              autoFocus
              sx={{
                borderRadius: 2.5,
                fontWeight: 800,
                px: 3,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              {t('onboarding.next')}
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );

  if (centered) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: (t) => t.zIndex.modal + 3,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'none',
          p: 2,
        }}
      >
        <Box sx={{ pointerEvents: 'auto' }}>{card}</Box>
      </Box>
    );
  }

  return (
    <Popper
      open
      anchorEl={anchorEl}
      placement={placement}
      modifiers={modifiers}
      sx={{
        direction: 'ltr',
        zIndex: (t) => t.zIndex.modal + 3,
      }}
    >
      {card}
    </Popper>
  );
}
