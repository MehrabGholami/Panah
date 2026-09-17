import type { OnboardingStepConfig } from './types';

/**
 * Each step targets the exact control being taught (nav icon / bell / guide).
 * Page headers are fallbacks only when the nav control is unavailable.
 */
export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    target: '[data-tour="dashboard-overview"]',
    route: '/dashboard',
    placement: 'center',
  },
  {
    id: 'sidebar',
    titleKey: 'onboarding.steps.sidebar.title',
    descriptionKey: 'onboarding.steps.sidebar.description',
    target: '[data-tour="nav-dashboard"]',
    route: '/dashboard',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'dashboard',
    titleKey: 'onboarding.steps.dashboard.title',
    descriptionKey: 'onboarding.steps.dashboard.description',
    target: '[data-tour="nav-dashboard"]',
    route: '/dashboard',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'disasters',
    titleKey: 'onboarding.steps.disasters.title',
    descriptionKey: 'onboarding.steps.disasters.description',
    target: '[data-tour="nav-disasters"]',
    route: '/disasters',
    roles: ['admin', 'coordinator'],
    permission: 'disasters.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'missions',
    titleKey: 'onboarding.steps.missions.title',
    descriptionKey: 'onboarding.steps.missions.description',
    target: '[data-tour="nav-missions"]',
    route: '/missions',
    roles: ['admin', 'coordinator'],
    permission: 'missions.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'coordinator-my-missions',
    titleKey: 'onboarding.steps.coordinatorMyMissions.title',
    descriptionKey: 'onboarding.steps.coordinatorMyMissions.description',
    target: '[data-tour="nav-missions-mine"]',
    route: '/missions/mine',
    roles: ['coordinator'],
    permission: 'missions.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'mission-applications',
    titleKey: 'onboarding.steps.missionApplications.title',
    descriptionKey: 'onboarding.steps.missionApplications.description',
    target: '[data-tour="nav-volunteers"]',
    route: '/volunteers',
    roles: ['admin', 'coordinator'],
    permission: 'volunteers.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'users',
    titleKey: 'onboarding.steps.users.title',
    descriptionKey: 'onboarding.steps.users.description',
    target: '[data-tour="nav-admin-users"]',
    route: '/admin/users',
    roles: ['admin', 'coordinator'],
    permission: 'accounts.view_users',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'available-missions',
    titleKey: 'onboarding.steps.availableMissions.title',
    descriptionKey: 'onboarding.steps.availableMissions.description',
    target: '[data-tour="nav-missions-available"]',
    route: '/missions/available',
    roles: ['volunteer'],
    permission: 'missions.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'my-missions',
    titleKey: 'onboarding.steps.myMissions.title',
    descriptionKey: 'onboarding.steps.myMissions.description',
    target: '[data-tour="nav-my-missions"]',
    route: '/my-missions',
    roles: ['volunteer'],
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'reports',
    titleKey: 'onboarding.steps.reports.title',
    descriptionKey: 'onboarding.steps.reports.description',
    target: '[data-tour="nav-reports"]',
    route: '/reports',
    roles: ['admin', 'coordinator'],
    permission: 'reports.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'tickets',
    titleKey: 'onboarding.steps.tickets.title',
    descriptionKey: 'onboarding.steps.tickets.description',
    target: '[data-tour="nav-tickets"]',
    route: '/tickets',
    permission: 'tickets.view',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'profile',
    titleKey: 'onboarding.steps.profile.title',
    descriptionKey: 'onboarding.steps.profile.description',
    target: '[data-tour="nav-profile"]',
    route: '/profile',
    roles: ['volunteer'],
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'notifications',
    titleKey: 'onboarding.steps.notifications.title',
    descriptionKey: 'onboarding.steps.notifications.description',
    target: '[data-tour="notifications-bell"]',
    route: '/dashboard',
    placement: 'bottom',
    spotlightPadding: 4,
  },
  {
    id: 'notifications-page',
    titleKey: 'onboarding.steps.notificationsNav.title',
    descriptionKey: 'onboarding.steps.notificationsNav.description',
    target: '[data-tour="nav-notifications"]',
    route: '/notifications',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
  {
    id: 'finish',
    titleKey: 'onboarding.steps.finish.title',
    descriptionKey: 'onboarding.steps.finish.description',
    target: '[data-tour="nav-guide"]',
    placement: 'right',
    requiresSidebar: true,
    spotlightPadding: 4,
  },
];

export function pathToTourSlug(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '-') || 'root';
}

export function filterStepsForUser(
  steps: OnboardingStepConfig[],
  opts: {
    roles: string[];
    hasPermission: (permission: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
  },
): OnboardingStepConfig[] {
  const { roles, hasPermission, hasAnyRole } = opts;
  const isAdmin = roles.includes('admin');
  const isCoordinator = roles.includes('coordinator');
  const isVolunteer = roles.includes('volunteer');

  return steps.filter((step) => {
    if (step.permission && !hasPermission(step.permission) && !isAdmin) {
      return false;
    }
    if (step.roles && step.roles.length > 0 && !hasAnyRole(step.roles)) {
      return false;
    }
    // Volunteer-only steps stay hidden for staff
    if (
      step.roles?.length === 1 &&
      step.roles[0] === 'volunteer' &&
      (isAdmin || isCoordinator)
    ) {
      return false;
    }
    // Layout hides /missions/mine for admins even if they also have coordinator
    if (step.id === 'coordinator-my-missions' && isAdmin) {
      return false;
    }
    // Profile nav only exists for pure volunteers
    if (step.id === 'profile' && (isAdmin || isCoordinator)) {
      return false;
    }
    // Available / my missions nav hidden for staff
    if (
      (step.id === 'available-missions' || step.id === 'my-missions') &&
      (isAdmin || isCoordinator)
    ) {
      return false;
    }
    // Pure volunteer should not see staff-only mission list
    if (step.id === 'missions' && isVolunteer && !isAdmin && !isCoordinator) {
      return false;
    }
    return true;
  });
}
