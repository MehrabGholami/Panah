const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const endpoints = {
  auth: {
    login: `${API_BASE}/auth/login/`,
    logout: `${API_BASE}/auth/logout/`,
    refresh: `${API_BASE}/auth/refresh/`,
    me: `${API_BASE}/auth/me/`,
    avatar: `${API_BASE}/auth/me/avatar/`,
    register: `${API_BASE}/auth/register/`,
  },
  accounts: {
    users: `${API_BASE}/accounts/users/`,
    userRoles: (id: string) => `${API_BASE}/accounts/users/${id}/roles/`,
    userAccess: (id: string) => `${API_BASE}/accounts/users/${id}/access/`,
    roles: `${API_BASE}/accounts/roles/`,
    role: (id: string) => `${API_BASE}/accounts/roles/${id}/`,
    permissions: `${API_BASE}/accounts/permissions/`,
  },
  volunteers: {
    list: `${API_BASE}/volunteers/`,
    detail: (id: string) => `${API_BASE}/volunteers/${id}/`,
    approve: (id: string) => `${API_BASE}/volunteers/${id}/approve/`,
    reject: (id: string) => `${API_BASE}/volunteers/${id}/reject/`,
    register: `${API_BASE}/volunteers/register/`,
  },
  skills: {
    list: `${API_BASE}/skills/`,
    public: `${API_BASE}/skills/public/`,
  },
  disasters: {
    list: `${API_BASE}/disasters/`,
    detail: (id: string) => `${API_BASE}/disasters/${id}/`,
  },
  missions: {
    list: `${API_BASE}/missions/`,
    detail: (id: string) => `${API_BASE}/missions/${id}/`,
    publish: (id: string) => `${API_BASE}/missions/${id}/publish/`,
    start: (id: string) => `${API_BASE}/missions/${id}/start/`,
    complete: (id: string) => `${API_BASE}/missions/${id}/complete/`,
    close: (id: string) => `${API_BASE}/missions/${id}/close/`,
    reopen: (id: string) => `${API_BASE}/missions/${id}/reopen/`,
    visibility: (id: string) => `${API_BASE}/missions/${id}/visibility/`,
    apply: (id: string) => `${API_BASE}/missions/${id}/apply/`,
    applications: (id: string) => `${API_BASE}/missions/${id}/applications/`,
    applicationsInbox: `${API_BASE}/missions/applications/inbox/`,
    approveApplication: (id: string, applicationId: string) =>
      `${API_BASE}/missions/${id}/applications/${applicationId}/approve/`,
    rejectApplication: (id: string, applicationId: string) =>
      `${API_BASE}/missions/${id}/applications/${applicationId}/reject/`,
    waitlistApplication: (id: string, applicationId: string) =>
      `${API_BASE}/missions/${id}/applications/${applicationId}/waitlist/`,
  },
  assignments: {
    my: `${API_BASE}/assignments/my/`,
    accept: (id: string) => `${API_BASE}/assignments/${id}/accept/`,
    decline: (id: string) => `${API_BASE}/assignments/${id}/decline/`,
  },
  reports: {
    list: `${API_BASE}/reports/`,
    detail: (id: string) => `${API_BASE}/reports/${id}/`,
    submit: (id: string) => `${API_BASE}/reports/${id}/submit/`,
    review: (id: string) => `${API_BASE}/reports/${id}/review/`,
    finishedMissions: `${API_BASE}/reports/finished-missions/`,
    finishedMissionDetail: (id: string) => `${API_BASE}/reports/finished-missions/${id}/`,
  },
  notifications: {
    list: `${API_BASE}/notifications/`,
    unreadCount: `${API_BASE}/notifications/unread-count/`,
    markAllRead: `${API_BASE}/notifications/mark-all-read/`,
    markRead: (id: string) => `${API_BASE}/notifications/${id}/mark-read/`,
  },
  tickets: {
    list: `${API_BASE}/tickets/`,
    detail: (id: string) => `${API_BASE}/tickets/${id}/`,
    replies: (id: string) => `${API_BASE}/tickets/${id}/replies/`,
    status: (id: string) => `${API_BASE}/tickets/${id}/status/`,
  },
  dashboard: {
    stats: `${API_BASE}/dashboard/stats/`,
  },
  auditLogs: {
    list: `${API_BASE}/audit-logs/`,
  },
} as const;

export const TOKEN_STORAGE_KEY = 'vmp_tokens';
