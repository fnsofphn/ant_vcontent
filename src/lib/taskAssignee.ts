import type { AuthProfile } from '@/contexts/AuthContext';
import type { ProfileRow, TaskRow } from '@/services/vcontent';

export type AssignableProfile = {
  profileId: string;
  accountId: string | null;
  fullName: string;
  role: string;
};

export function toAssignableProfiles(
  profiles: ProfileRow[],
  allowedRoles?: string[],
) {
  return profiles
    .filter((entry) => entry.active)
    .filter((entry) => !allowedRoles?.length || allowedRoles.includes(String(entry.role || '')))
    .map(
      (entry): AssignableProfile => ({
        profileId: entry.id,
        accountId: entry.auth_user_id || null,
        fullName: entry.full_name,
        role: entry.role,
      }),
    );
}

export function findAssignableProfile(
  profiles: AssignableProfile[],
  profileId: string | null | undefined,
) {
  if (!profileId) return null;
  return profiles.find((entry) => entry.profileId === profileId) || null;
}

export function buildTaskAssigneePatch(profile: AssignableProfile | null) {
  return {
    assignee: profile?.fullName || null,
    assignee_profile_id: profile?.profileId || null,
    assignee_account_id: profile?.accountId || null,
  };
}

export function isTaskAssignedToCurrentProfile(
  task: TaskRow,
  profile: AuthProfile | null,
) {
  if (!profile) return true;
  if (profile.role === 'pm' || profile.role === 'admin') return true;
  if (!task.assignee && !task.assignee_profile_id && !task.assignee_account_id) return true;
  if (task.assignee_account_id && profile.authUserId) return task.assignee_account_id === profile.authUserId;
  if (task.assignee_profile_id) return task.assignee_profile_id === profile.id;
  return task.assignee === profile.fullName;
}
