import type { OnboardingPersistedState, OnboardingStatus } from './types';

const KEY_PREFIX = 'volunteer_management_onboarding_';

function storageKey(userId: string | number): string {
  return `${KEY_PREFIX}${userId}`;
}

const DEFAULT_STATE: OnboardingPersistedState = {
  status: 'not_started',
  inviteDismissed: false,
};

export function loadOnboardingState(userId: string | number | undefined | null): OnboardingPersistedState {
  if (userId == null) return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<OnboardingPersistedState>;
    const status = parsed.status;
    if (
      status !== 'not_started' &&
      status !== 'active' &&
      status !== 'completed' &&
      status !== 'skipped'
    ) {
      return { ...DEFAULT_STATE };
    }
    return {
      status,
      stepId: typeof parsed.stepId === 'string' ? parsed.stepId : undefined,
      inviteDismissed: Boolean(parsed.inviteDismissed),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveOnboardingState(
  userId: string | number | undefined | null,
  state: OnboardingPersistedState,
): void {
  if (userId == null) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function clearOnboardingState(userId: string | number | undefined | null): void {
  if (userId == null) return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export function isPulseActive(status: OnboardingStatus): boolean {
  return status === 'not_started' || status === 'active';
}

export function shouldShowFirstTimeInvite(
  state: OnboardingPersistedState,
): boolean {
  return state.status === 'not_started' && !state.inviteDismissed;
}
