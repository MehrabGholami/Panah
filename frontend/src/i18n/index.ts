import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonFa from './locales/fa/common.json';
import authFa from './locales/fa/auth.json';
import missionsFa from './locales/fa/missions.json';
import dashboardFa from './locales/fa/dashboard.json';
import volunteersFa from './locales/fa/volunteers.json';
import ticketsFa from './locales/fa/tickets.json';
import profileFa from './locales/fa/profile.json';
import aboutFa from './locales/fa/about.json';
import usersFa from './locales/fa/users.json';
import reportsFa from './locales/fa/reports.json';
import notificationsFa from './locales/fa/notifications.json';
import disastersFa from './locales/fa/disasters.json';

void i18n.use(initReactI18next).init({
  resources: {
    fa: {
      common: commonFa,
      auth: authFa,
      missions: missionsFa,
      dashboard: dashboardFa,
      volunteers: volunteersFa,
      tickets: ticketsFa,
      profile: profileFa,
      about: aboutFa,
      disasters: disastersFa,
      users: usersFa,
      reports: reportsFa,
      notifications: notificationsFa,
    },
  },
  lng: 'fa',
  fallbackLng: 'fa',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
