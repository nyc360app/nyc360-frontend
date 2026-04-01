import {
  TagLike,
  hasAnyCommunityContributorTag,
  hasCommunityLeaderTag,
  hasCommunityOrganizationTag
} from './community-badge-policy';

export enum CommunityRole {
  Leader = 1,
  Moderator = 2,
  Member = 3,
  Volunteer = 4
}

const COMMUNITY_ERROR_MESSAGES: Record<string, string> = {
  'user.notVerified': 'A verified Resident, Organization, or Business account is required before using community contributor tools.',
  'community.create.requiresContributorTag': 'Community creation requires an approved Community Leader or Community Organization contributor badge.',
  'community.create.requiresEligibleContributor': 'Only approved Community Leaders or approved Community Organization contributors can create a community.',
  'community.duplicate': 'A community with the same name, type, and location already exists.',
  'location.notFound': 'Select a valid location before continuing.',
  'community.forbidden': 'You do not have permission to perform that community action.',
  'community.post.requires_contributor': 'Only the community leader or an approved volunteer can publish in this community.',
  'community.post.moderator_restricted': 'Moderators can moderate community activity, but they cannot publish posts here.',
  'posts.unauthorized_division': 'Only approved Community Leaders or approved Community Organization contributors can publish Community division content.',
  'community.rss.requiresEligibleContributor': 'Only approved Community Leaders or approved Community Organization contributors can connect Community RSS feeds.',
  'space.listing.community_organization.requires_tag': 'Community organization listings require an approved Community Leader or Community Organization contributor badge.'
};

const COMMUNITY_GATE1_PROFILE_ROLES = new Set([
  'resident',
  'organization',
  'business'
]);

const COMMUNITY_STAFF_BYPASS_ROLES = new Set([
  'admin',
  'superadmin'
]);

type CommunityGateUserLike = {
  roles?: unknown;
  isVerified?: boolean | null;
} | null | undefined;

function normalizeCommunityUserRoleName(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export function getCommunityUserRoles(user: CommunityGateUserLike): string[] {
  const rawRoles = user?.roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles
      ? [rawRoles]
      : [];

  return roles
    .map((role: any) => normalizeCommunityUserRoleName(
      role?.name
      ?? role?.Name
      ?? role?.role
      ?? role?.Role
      ?? role
    ))
    .filter(Boolean);
}

export function hasCommunityStaffBypass(user: CommunityGateUserLike): boolean {
  return getCommunityUserRoles(user).some((role) => COMMUNITY_STAFF_BYPASS_ROLES.has(role));
}

export function isCommunityGate1Eligible(user: CommunityGateUserLike): boolean {
  if (hasCommunityStaffBypass(user)) {
    return true;
  }

  if (user?.isVerified !== true) {
    return false;
  }

  return getCommunityUserRoles(user).some((role) => COMMUNITY_GATE1_PROFILE_ROLES.has(role));
}

export function normalizeCommunityRole(role: number | string | null | undefined): CommunityRole | null {
  if (role === null || role === undefined || role === '') {
    return null;
  }

  const numericRole = Number(role);
  if (numericRole >= CommunityRole.Leader && numericRole <= CommunityRole.Volunteer) {
    return numericRole as CommunityRole;
  }

  const normalized = String(role).trim().toLowerCase();
  switch (normalized) {
    case 'leader':
    case 'owner':
    case 'admin':
      return CommunityRole.Leader;
    case 'moderator':
      return CommunityRole.Moderator;
    case 'volunteer':
      return CommunityRole.Volunteer;
    case 'member':
      return CommunityRole.Member;
    default:
      return null;
  }
}

export function getCommunityRoleLabel(role: number | string | null | undefined): string {
  switch (normalizeCommunityRole(role)) {
    case CommunityRole.Leader:
      return 'Leader';
    case CommunityRole.Moderator:
      return 'Moderator';
    case CommunityRole.Volunteer:
      return 'Volunteer';
    case CommunityRole.Member:
      return 'Member';
    default:
      return 'Member';
  }
}

export function hasCommunityContributorAccess(tags: TagLike[] | null | undefined): boolean {
  return hasAnyCommunityContributorTag(tags);
}

export function hasCommunityCreateAccess(tags: TagLike[] | null | undefined): boolean {
  return hasCommunityLeaderTag(tags) || hasCommunityOrganizationTag(tags);
}

export function hasCommunityOperationalAccess(tags: TagLike[] | null | undefined): boolean {
  return hasCommunityCreateAccess(tags);
}

export function hasCommunityOrganizationListingAccess(tags: TagLike[] | null | undefined): boolean {
  return hasCommunityLeaderTag(tags) || hasCommunityOrganizationTag(tags);
}

export function hasCommunityOrganizationAccess(tags: TagLike[] | null | undefined): boolean {
  return hasCommunityOrganizationTag(tags);
}

export function hasCommunityLeaderAccess(tags: TagLike[] | null | undefined): boolean {
  return hasCommunityLeaderTag(tags);
}

export function getCommunityErrorCode(source: any): string | null {
  const code =
    source?.error?.error?.code
    ?? source?.error?.error?.Code
    ?? source?.error?.code
    ?? source?.error?.Code
    ?? source?.Error?.Code
    ?? source?.code
    ?? source?.Code
    ?? null;

  const normalized = String(code || '').trim();
  return normalized || null;
}

export function getCommunityErrorMessage(source: any, fallback: string): string {
  if (source?.status === 401) {
    return 'Please log in to continue.';
  }

  const code = getCommunityErrorCode(source);
  if (code && COMMUNITY_ERROR_MESSAGES[code]) {
    return COMMUNITY_ERROR_MESSAGES[code];
  }

  return source?.error?.error?.message
    || source?.error?.error?.Message
    || source?.error?.message
    || source?.error?.Message
    || source?.message
    || source?.Message
    || fallback;
}
