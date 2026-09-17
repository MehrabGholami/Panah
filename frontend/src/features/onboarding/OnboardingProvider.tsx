import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '@/shared/hooks/useAuth';
import { useAppSelector } from '@/app/store';
import { filterStepsForUser, ONBOARDING_STEPS } from './onboardingConfig';
import { OnboardingContext, type OnboardingContextValue } from './onboardingContext';
import {
  clearOnboardingState,
  loadOnboardingState,
  saveOnboardingState,
  shouldShowFirstTimeInvite,
} from './onboardingStorage';
import {
  inflateRect,
  scrollTargetIntoView,
  waitForTarget,
} from './onboardingUtils';
import type { OnboardingPersistedState, OnboardingStepConfig } from './types';

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id;
  const { hasPermission, hasAnyRole, roles } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const [persisted, setPersisted] = useState<OnboardingPersistedState>(() =>
    loadOnboardingState(userId),
  );
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [guideAnchorEl, setGuideAnchorElState] = useState<HTMLElement | null>(null);
  const [inviteVisible, setInviteVisible] = useState(false);

  const setGuideAnchorEl = useCallback((el: HTMLElement | null) => {
    setGuideAnchorElState((prev) => (prev === el ? prev : el));
  }, []);

  const mobileDrawerRef = useRef<((open: boolean) => void) | null>(null);
  const activationGenRef = useRef(0);
  const stepsRef = useRef<OnboardingStepConfig[]>([]);
  const targetElRef = useRef<HTMLElement | null>(null);
  const spotlightPadRef = useRef(4);
  const currentIndexRef = useRef(0);
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;
  currentIndexRef.current = currentIndex;

  const steps = useMemo(
    () =>
      filterStepsForUser(ONBOARDING_STEPS, {
        roles,
        hasPermission,
        hasAnyRole,
      }),
    [roles, hasPermission, hasAnyRole],
  );
  stepsRef.current = steps;

  const persist = useCallback(
    (next: OnboardingPersistedState) => {
      setPersisted(next);
      saveOnboardingState(userId, next);
    },
    [userId],
  );

  const cancelActivation = useCallback(() => {
    activationGenRef.current += 1;
  }, []);

  useEffect(() => {
    const loaded = loadOnboardingState(userId);
    setPersisted(loaded);
    cancelActivation();
    setIsTourOpen(false);
    setSkipDialogOpen(false);
    setHighlightRect(null);
    targetElRef.current = null;
    setTargetElement(null);
  }, [userId, cancelActivation]);

  useEffect(() => {
    if (!userId) {
      setInviteVisible(false);
      return;
    }
    setInviteVisible(shouldShowFirstTimeInvite(persisted));
  }, [userId, persisted]);

  const resumedRef = useRef(false);
  useEffect(() => {
    resumedRef.current = false;
  }, [userId]);

  const registerMobileDrawerControl = useCallback((fn: ((open: boolean) => void) | null) => {
    mobileDrawerRef.current = fn;
  }, []);

  const publishHighlight = useCallback((el: HTMLElement | null, padding = 4) => {
    targetElRef.current = el;
    spotlightPadRef.current = padding;
    setTargetElement(el);
    if (!el) {
      setHighlightRect(null);
      return;
    }
    setHighlightRect(inflateRect(el.getBoundingClientRect(), padding));
  }, []);

  const measureAndPlace = useCallback(
    async (step: OnboardingStepConfig, gen: number) => {
      const primarySelector = step.target.split(',')[0]?.trim() ?? step.target;
      const needsSidebar =
        Boolean(step.requiresSidebar) || primarySelector.includes('nav-');
      const isMobileViewport =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 899.95px)').matches;

      if (needsSidebar) {
        // Only open the temporary drawer on mobile — on desktop the docked drawer is the real target
        if (isMobileViewport) {
          mobileDrawerRef.current?.(true);
          await new Promise((r) => window.setTimeout(r, 220));
        } else {
          mobileDrawerRef.current?.(false);
          await new Promise((r) => window.setTimeout(r, 80));
        }
      } else {
        mobileDrawerRef.current?.(false);
        await new Promise((r) => window.setTimeout(r, 100));
      }
      if (gen !== activationGenRef.current) return false;

      let el = await waitForTarget(step.target, 1600);
      if (gen !== activationGenRef.current) return false;

      if (!el && needsSidebar && isMobileViewport) {
        mobileDrawerRef.current?.(true);
        await new Promise((r) => window.setTimeout(r, 280));
        if (gen !== activationGenRef.current) return false;
        el = await waitForTarget(step.target, 1200);
      }
      if (gen !== activationGenRef.current) return false;

      if (!el) {
        publishHighlight(null);
        return false;
      }

      await scrollTargetIntoView(el);
      if (gen !== activationGenRef.current) return false;
      publishHighlight(el, step.spotlightPadding ?? 4);
      return true;
    },
    [publishHighlight],
  );

  useEffect(() => {
    if (!isTourOpen) return;

    const sync = () => {
      const el = targetElRef.current;
      if (!el || !document.contains(el)) return;
      const next = inflateRect(el.getBoundingClientRect(), spotlightPadRef.current);
      setHighlightRect((prev) => {
        if (
          prev &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        ) {
          return prev;
        }
        return next;
      });
    };

    sync();
    const el = targetElRef.current;
    const ro = new ResizeObserver(sync);
    if (el) ro.observe(el);
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    const id = window.setInterval(sync, 120);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
      window.clearInterval(id);
    };
  }, [isTourOpen, currentIndex]);

  const activateStep = useCallback(
    async (index: number, list: OnboardingStepConfig[], direction: 1 | -1 = 1) => {
      const gen = ++activationGenRef.current;

      try {
        let i = index;
        const visited = new Set<number>();

        while (i >= 0 && i < list.length) {
          if (gen !== activationGenRef.current) return;
          if (visited.has(i)) break;
          visited.add(i);

          const step = list[i];
          if (!step) break;

          // Centered welcome: no DOM hunt — show card immediately
          if (step.placement === 'center') {
            if (step.route && locationRef.current !== step.route) {
              navigate(step.route);
              await new Promise((r) => window.setTimeout(r, 200));
              if (gen !== activationGenRef.current) return;
            }
            publishHighlight(null);
            setCurrentIndex(i);
            currentIndexRef.current = i;
            persist({
              status: 'active',
              stepId: step.id,
              inviteDismissed: true,
            });
            setInviteVisible(false);
            return;
          }

          if (step.route && locationRef.current !== step.route) {
            navigate(step.route);
            await new Promise((r) => window.setTimeout(r, 280));
            if (gen !== activationGenRef.current) return;
          }

          const ok = await measureAndPlace(step, gen);
          if (gen !== activationGenRef.current) return;

          if (ok) {
            setCurrentIndex(i);
            currentIndexRef.current = i;
            persist({
              status: 'active',
              stepId: step.id,
              inviteDismissed: true,
            });
            setInviteVisible(false);
            return;
          }

          i += direction;
        }

        if (gen !== activationGenRef.current) return;

        if (direction === 1) {
          setIsTourOpen(false);
          setHighlightRect(null);
          setTargetElement(null);
          targetElRef.current = null;
          persist({ status: 'completed', inviteDismissed: true });
        }
      } catch (err) {
        if (gen !== activationGenRef.current) return;
        if (import.meta.env.DEV) {
          console.error('[onboarding] activateStep failed', err);
        }
        setIsTourOpen(false);
        setHighlightRect(null);
      }
    },
    [measureAndPlace, navigate, persist, publishHighlight],
  );

  useEffect(() => {
    if (!userId || persisted.status !== 'active' || isTourOpen || resumedRef.current) return;
    if (steps.length === 0) return;
    const idx = persisted.stepId
      ? steps.findIndex((s) => s.id === persisted.stepId)
      : 0;
    const safeIdx = idx >= 0 ? idx : 0;
    resumedRef.current = true;
    setIsTourOpen(true);
    void activateStep(safeIdx, steps);
  }, [userId, persisted.status, persisted.stepId, steps, isTourOpen, activateStep]);

  const startTour = useCallback(
    (opts?: { resume?: boolean }) => {
      const list = stepsRef.current;
      if (list.length === 0) return;
      setInviteVisible(false);
      setSkipDialogOpen(false);
      setIsTourOpen(true);
      const startIdx =
        opts?.resume && persisted.stepId
          ? Math.max(
              0,
              list.findIndex((s) => s.id === persisted.stepId),
            )
          : 0;
      void activateStep(startIdx === -1 ? 0 : startIdx, list);
    },
    [activateStep, persisted.stepId],
  );

  const nextStep = useCallback(() => {
    const list = stepsRef.current;
    const next = currentIndexRef.current + 1;
    if (next >= list.length) {
      cancelActivation();
      setIsTourOpen(false);
      setHighlightRect(null);
      setTargetElement(null);
      targetElRef.current = null;
      persist({ status: 'completed', inviteDismissed: true });
      return;
    }
    void activateStep(next, list, 1);
  }, [activateStep, cancelActivation, persist]);

  const prevStep = useCallback(() => {
    const list = stepsRef.current;
    const prev = currentIndexRef.current - 1;
    if (prev < 0) return;
    void activateStep(prev, list, -1);
  }, [activateStep]);

  const requestSkip = useCallback(() => setSkipDialogOpen(true), []);
  const cancelSkip = useCallback(() => setSkipDialogOpen(false), []);

  const confirmSkip = useCallback(() => {
    cancelActivation();
    setSkipDialogOpen(false);
    setIsTourOpen(false);
    setHighlightRect(null);
    setTargetElement(null);
    targetElRef.current = null;
    persist({ status: 'skipped', inviteDismissed: true });
    mobileDrawerRef.current?.(false);
  }, [cancelActivation, persist]);

  const finishTour = useCallback(() => {
    cancelActivation();
    setIsTourOpen(false);
    setHighlightRect(null);
    setTargetElement(null);
    targetElRef.current = null;
    persist({ status: 'completed', inviteDismissed: true });
    mobileDrawerRef.current?.(false);
  }, [cancelActivation, persist]);

  const dismissInvite = useCallback(() => {
    setInviteVisible(false);
    persist({
      ...persisted,
      inviteDismissed: true,
    });
  }, [persist, persisted]);

  const resetTour = useCallback(() => {
    cancelActivation();
    clearOnboardingState(userId);
    const fresh = { status: 'not_started' as const, inviteDismissed: false };
    setPersisted(fresh);
    setIsTourOpen(false);
    setSkipDialogOpen(false);
    setHighlightRect(null);
    setTargetElement(null);
    targetElRef.current = null;
    setInviteVisible(true);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
  }, [cancelActivation, userId]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __resetOnboardingTour?: () => void }).__resetOnboardingTour = () => {
      resetTour();
    };
    return () => {
      delete (window as unknown as { __resetOnboardingTour?: () => void }).__resetOnboardingTour;
    };
  }, [resetTour]);

  const currentStep = isTourOpen ? (steps[currentIndex] ?? null) : null;
  const showPulse =
    Boolean(userId) && persisted.status === 'not_started' && !isTourOpen;

  const value: OnboardingContextValue = {
    status: persisted.status,
    showPulse,
    showInvite: inviteVisible && !isTourOpen,
    isTourOpen,
    steps,
    currentStep,
    currentIndex,
    highlightRect,
    targetElement,
    skipDialogOpen,
    guideAnchorEl,
    setGuideAnchorEl,
    registerMobileDrawerControl,
    startTour,
    nextStep,
    prevStep,
    requestSkip,
    cancelSkip,
    confirmSkip,
    finishTour,
    dismissInvite,
    resetTour,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
