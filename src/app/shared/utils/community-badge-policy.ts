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
  const pool: BadgeOption[] = [...incoming];

  // Ensure known legacy community tag IDs are always available as safe fallbacks.
  if (!pool.some((option) => option.id === 2001)) {
    pool.push({ id: 2001, name: 'Community Leader' });
  }
  if (!pool.some((option) => option.id === 2002)) {
    pool.push({ id: 2002, name: 'Organization Rep' });
  }

  const usedIds = new Set<number>();

  let leader = pickByAliases(pool, COMMUNITY_D01_ALIASES.leader);
  if (!leader) {
    leader = pool.find((option) => option.id === 2001) || null;
  }
  if (leader) usedIds.add(leader.id);

  let organization = pickByAliases(pool, COMMUNITY_D01_ALIASES.organization);
  if (organization && usedIds.has(organization.id)) organization = null;
  if (!organization) {
    organization = pool.find((option) => option.id === 2002 && !usedIds.has(option.id)) || null;
  }
  if (organization) usedIds.add(organization.id);

  let create = pickByAliases(pool, COMMUNITY_D01_ALIASES.create);
  if (create && usedIds.has(create.id)) create = null;
  if (!create) {
    // If backend exposes only one non-leader community badge, reuse it for the create flow label.
    create = organization || null;
  }
  if (create) usedIds.add(create.id);

  // Always return the 3 public community badge labels in required order.
  // IDs are resolved to known valid tags; when dedicated backend tags are missing, create/org may share an ID.
  return [
    { id: (leader || { id: 2001 }).id, name: COMMUNITY_D01_LABELS.leader },
    { id: (create || organization || leader || { id: 2002 }).id, name: COMMUNITY_D01_LABELS.create },
    { id: (organization || create || leader || { id: 2002 }).id, name: COMMUNITY_D01_LABELS.organization }
  ];
}