import type { User } from '@/shared/types';

export const PROFILE_COMPLETION_THRESHOLD = 50;

function isVolunteerOnly(user: User): boolean {
  const roles = user.roles ?? [];
  return roles.includes('volunteer') && !roles.includes('admin') && !roles.includes('coordinator');
}

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  return true;
}

export function getProfileCompletionPercent(user: User): number {
  if (!isVolunteerOnly(user)) return 100;

  const profile = user.profile;
  const volunteer = user.volunteer_profile;

  const fields: unknown[] = [
    user.avatar,
    user.first_name,
    user.last_name,
    user.phone,
    volunteer?.city,
    volunteer?.bio,
    profile?.education,
    profile?.occupation,
    profile?.interests,
    profile?.address,
    profile?.blood_type,
    profile?.languages,
    profile?.years_of_experience,
    profile?.date_of_birth,
    profile?.emergency_contact_name,
    profile?.emergency_contact_phone,
    profile?.medical_conditions,
    profile?.disability,
  ];

  const filledCount = fields.filter(isFieldFilled).length;
  return Math.round((filledCount / fields.length) * 100);
}

export function shouldRedirectToProfileAfterLogin(user: User): boolean {
  if (!isVolunteerOnly(user)) return false;
  return getProfileCompletionPercent(user) < PROFILE_COMPLETION_THRESHOLD;
}

export function getPostLoginPath(user: User, fallback = '/dashboard'): string {
  return shouldRedirectToProfileAfterLogin(user) ? '/profile' : fallback;
}

export function isVolunteerProfileIncomplete(user: User): boolean {
  return shouldRedirectToProfileAfterLogin(user);
}
