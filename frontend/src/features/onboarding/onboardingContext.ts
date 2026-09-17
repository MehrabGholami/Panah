import { createContext } from 'react';
import type { OnboardingStatus, OnboardingStepConfig } from './types';

export interface OnboardingContextValue {
  status: OnboardingStatus;
  showPulse: boolean;
  showInvite: boolean;
  isTourOpen: boolean;
  steps: OnboardingStepConfig[];
  currentStep: OnboardingStepConfig | null;
  currentIndex: number;
  highlightRect: DOMRect | null;
  /** Live DOM node for Popper anchoring */
  targetElement: HTMLElement | null;
  skipDialogOpen: boolean;
  guideAnchorEl: HTMLElement | null;
  setGuideAnchorEl: (el: HTMLElement | null) => void;
  registerMobileDrawerControl: (fn: ((open: boolean) => void) | null) => void;
  startTour: (opts?: { resume?: boolean }) => void;
  nextStep: () => void;
  prevStep: () => void;
  requestSkip: () => void;
  cancelSkip: () => void;
  confirmSkip: () => void;
  finishTour: () => void;
  dismissInvite: () => void;
  resetTour: () => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);
