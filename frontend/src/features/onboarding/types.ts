export type OnboardingStatus = 'not_started' | 'active' | 'completed' | 'skipped';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';

export interface OnboardingPersistedState {
  status: OnboardingStatus;
  stepId?: string;
  inviteDismissed?: boolean;
}

export interface OnboardingStepConfig {
  id: string;
  titleKey: string;
  descriptionKey: string;
  target: string;
  route?: string;
  roles?: string[];
  permission?: string;
  placement?: TourPlacement;
  interactive?: boolean;
  requiresSidebar?: boolean;
  /** Extra padding around spotlight (px) */
  spotlightPadding?: number;
}

export interface ResolvedTourStep extends OnboardingStepConfig {
  index: number;
  total: number;
}
