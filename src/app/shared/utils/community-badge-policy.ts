export interface TagLike {
  id?: number | null;
  name?: string | null;
  Id?: number | null;
  Name?: string | null;
}

export interface BadgeOption {
  id: number;
  name: string;
}

const INTERNAL_COMMUNITY_MEMBERSHIP_TAG_NAMES = new Set([
  'community member',
  'community membership'
]);

const INTERNAL_COMMUNITY_MEMBERSHIP_TAG_IDS = new Set<number>([
  // Add known backend IDs here when confirmed.
]);

const COMMUNITY_LEADER_TAG_NAMES = [
  'community leader',
  'community leader badge'
] as const;

const COMMUNITY_D01_TAG_IDS = {
  leader: 2000,
  create: 2001,
  organization: 2002
} as const;

const COMMUNITY_D01_LABELS = {
  leader: 'Apply for Community Leader Badges',
  create: 'Apply for Create a Community',
  organization: 'List Community Organization in Space'
} as const;

const COMMUNITY_D01_ALIASES = {
  leader: ['community leader', 'leader badge'],
  create: ['create a community', 'create community', 'community creator'],
  organization: ['community organization in space', 'community organization', 'organization rep', 'organization representative']
} as const;

function normalizeTagName(name: string | null | undefined): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getTagName(tag: TagLike): string | null {
  if (typeof tag.name === 'string' && tag.name.trim()) return tag.name;
  if (typeof tag.Name === 'string' && tag.Name.trim()) return tag.Name;
  return null;
}

function getTagId(tag: TagLike): number | null {
  const raw = tag.id ?? tag.Id;
  if (raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBadgeOptions(tags: TagLike[] | null | undefined): BadgeOption[] {
  return filterPublicCommunityBadges(tags)
    .map((tag) => {
      const id = getTagId(tag);
      const name = getTagName(tag);
      if (id === null || !name) return null;
      return { id, name: name.trim() };
    })
    .filter((tag): tag is BadgeOption => !!tag);
}

function pickByAliases(options: BadgeOption[], aliases: readonly string[]): BadgeOption | null {
  return options.find((option) => {
    const normalized = normalizeTagName(option.name);
    return aliases.some((alias) => normalized.includes(alias));
  }) || null;
}

function pickById(options: BadgeOption[], id: number): BadgeOption | null {
  return options.find((option) => option.id === id) || null;
}

export function isInternalCommunityMembershipTag(tag: TagLike | null | undefined): boolean {
  if (!tag) return false;

  const tagId = getTagId(tag);
  if (typeof tagId === 'number' && INTERNAL_COMMUNITY_MEMBERSHIP_TAG_IDS.has(tagId)) {
    return true;
  }

  return INTERNAL_COMMUNITY_MEMBERSHIP_TAG_NAMES.has(normalizeTagName(getTagName(tag)));
}

export function filterPublicCommunityBadges<T extends TagLike>(tags: T[] | null | undefined): T[] {
  if (!Array.isArray(tags)) return [];

  return tags.filter((tag) => {
    if (!tag || !getTagName(tag)) return false;
    return !isInternalCommunityMembershipTag(tag);
  });
}

export function isCommunityLeaderTag(tag: TagLike | null | undefined): boolean {
  if (!tag) return false;

  const normalized = normalizeTagName(getTagName(tag));
  if (!normalized) return false;

  return COMMUNITY_LEADER_TAG_NAMES.some((name) => normalized.includes(name));
}

/**
 * Builds community verification options in fixed order/labels, while preserving backend tag IDs.
 */
export function buildCommunityD01BadgeOptions(tags: TagLike[] | null | undefined): BadgeOption[] {
  const incoming = toBadgeOptions(tags);
  if (!incoming.length) return [];

  const usedIds = new Set<number>();

  let leader = pickById(incoming, COMMUNITY_D01_TAG_IDS.leader) || pickByAliases(incoming, COMMUNITY_D01_ALIASES.leader);
  if (leader) usedIds.add(leader.id);

  let create = pickById(incoming, COMMUNITY_D01_TAG_IDS.create) || pickByAliases(incoming, COMMUNITY_D01_ALIASES.create);
  if (create && usedIds.has(create.id)) create = null;
  if (create) usedIds.add(create.id);

  let organization = pickById(incoming, COMMUNITY_D01_TAG_IDS.organization) || pickByAliases(incoming, COMMUNITY_D01_ALIASES.organization);
  if (organization && usedIds.has(organization.id)) organization = null;
  if (organization) usedIds.add(organization.id);

  const results: BadgeOption[] = [];

  if (leader) {
    results.push({ id: leader.id, name: COMMUNITY_D01_LABELS.leader });
  }

  if (create) {
    results.push({ id: create.id, name: COMMUNITY_D01_LABELS.create });
  }

  if (organization) {
    results.push({ id: organization.id, name: COMMUNITY_D01_LABELS.organization });
  }

  return results;
}
