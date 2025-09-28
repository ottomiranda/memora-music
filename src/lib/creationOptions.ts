import type { TFunction } from 'i18next';

import i18n from '@/i18n';

export type OptionType = 'occasion' | 'relationship' | 'emotion' | 'vocal';
export type OptionItem = { key: string; label: string };
export type OptionCategory = { key: string; label: string; items: OptionItem[] };

export const OCCASION_CATEGORY_CONFIG = [
  {
    key: 'romantic',
    labelKey: 'options.occasions.romantic.category',
    itemKeys: [
      'options.occasions.romantic.anniversary',
      'options.occasions.romantic.valentine',
      'options.occasions.romantic.proposal',
      'options.occasions.romantic.wedding',
      'options.occasions.romantic.engagement',
      'options.occasions.romantic.dateNight',
      'options.occasions.romantic.apology',
      'options.occasions.romantic.longDistance',
    ],
  },
  {
    key: 'celebration',
    labelKey: 'options.occasions.celebration.category',
    itemKeys: [
      'options.occasions.celebration.birthday',
      'options.occasions.celebration.graduation',
      'options.occasions.celebration.newJob',
      'options.occasions.celebration.promotion',
      'options.occasions.celebration.retirement',
      'options.occasions.celebration.newHome',
      'options.occasions.celebration.achievement',
      'options.occasions.celebration.success',
    ],
  },
  {
    key: 'friendship',
    labelKey: 'options.occasions.friendship.category',
    itemKeys: [
      'options.occasions.friendship.friendship',
      'options.occasions.friendship.support',
      'options.occasions.friendship.encouragement',
      'options.occasions.friendship.reunion',
      'options.occasions.friendship.farewell',
      'options.occasions.friendship.thankYou',
      'options.occasions.friendship.justBecause',
      'options.occasions.friendship.missYou',
    ],
  },
  {
    key: 'achievements',
    labelKey: 'options.occasions.achievements.category',
    itemKeys: [
      'options.occasions.achievements.competition',
      'options.occasions.achievements.award',
      'options.occasions.achievements.recognition',
      'options.occasions.achievements.milestone',
      'options.occasions.achievements.goal',
      'options.occasions.achievements.victory',
      'options.occasions.achievements.accomplishment',
      'options.occasions.achievements.breakthrough',
    ],
  },
  {
    key: 'memorial',
    labelKey: 'options.occasions.memorial.category',
    itemKeys: [
      'options.occasions.memorial.memorial',
      'options.occasions.memorial.tribute',
      'options.occasions.memorial.remembrance',
      'options.occasions.memorial.honor',
      'options.occasions.memorial.legacy',
      'options.occasions.memorial.celebration_of_life',
      'options.occasions.memorial.memory',
      'options.occasions.memorial.farewell_tribute',
    ],
  },
] as const;

export const RELATIONSHIP_CATEGORY_CONFIG = [
  {
    key: 'family',
    labelKey: 'options.relationships.family.category',
    itemKeys: [
      'options.relationships.family.mother',
      'options.relationships.family.father',
      'options.relationships.family.son',
      'options.relationships.family.daughter',
      'options.relationships.family.brother',
      'options.relationships.family.sister',
      'options.relationships.family.grandmother',
      'options.relationships.family.grandfather',
      'options.relationships.family.aunt',
      'options.relationships.family.uncle',
      'options.relationships.family.cousin',
      'options.relationships.family.nephew',
      'options.relationships.family.niece',
    ],
  },
  {
    key: 'romantic',
    labelKey: 'options.relationships.romantic.category',
    itemKeys: [
      'options.relationships.romantic.wife',
      'options.relationships.romantic.husband',
      'options.relationships.romantic.girlfriend',
      'options.relationships.romantic.boyfriend',
      'options.relationships.romantic.fiancee',
      'options.relationships.romantic.partner',
      'options.relationships.romantic.soulmate',
      'options.relationships.romantic.crush',
    ],
  },
  {
    key: 'friendship',
    labelKey: 'options.relationships.friendship.category',
    itemKeys: [
      'options.relationships.friendship.best_friend',
      'options.relationships.friendship.friend',
      'options.relationships.friendship.colleague',
      'options.relationships.friendship.mentor',
      'options.relationships.friendship.teacher',
      'options.relationships.friendship.student',
      'options.relationships.friendship.neighbor',
      'options.relationships.friendship.acquaintance',
    ],
  },
] as const;

const OCCASION_ITEM_KEYS = OCCASION_CATEGORY_CONFIG.flatMap((category) => category.itemKeys);
const RELATIONSHIP_ITEM_KEYS = RELATIONSHIP_CATEGORY_CONFIG.flatMap((category) => category.itemKeys);

const EMOTION_KEYS = [
  'options.emotions.happy',
  'options.emotions.romantic',
  'options.emotions.nostalgic',
  'options.emotions.energetic',
  'options.emotions.peaceful',
  'options.emotions.emotional',
  'options.emotions.inspiring',
  'options.emotions.playful',
  'options.emotions.melancholic',
  'options.emotions.triumphant',
  'options.emotions.grateful',
  'options.emotions.hopeful',
  'options.emotions.celebratory',
  'options.emotions.tender',
  'options.emotions.uplifting',
  'options.emotions.sentimental',
  'options.emotions.joyful',
  'options.emotions.passionate',
  'options.emotions.serene',
  'options.emotions.motivational',
];

const VOCAL_KEYS = ['style.voice.female', 'style.voice.male', 'style.voice.both'];

const SUPPORTED_LANGUAGES = ['pt', 'en'] as const;

const buildValueToKeyMap = (keys: readonly string[]) => {
  const map: Record<string, string> = {};
  keys.forEach((key) => {
    map[key] = key;
  });
  SUPPORTED_LANGUAGES.forEach((lng) => {
    const fixedT = i18n.getFixedT(lng, 'criar');
    keys.forEach((key) => {
      const label = fixedT(key);
      map[label] = key;
    });
  });
  return map;
};

const OCCASION_VALUE_MAP = buildValueToKeyMap(OCCASION_ITEM_KEYS);
const RELATIONSHIP_VALUE_MAP = buildValueToKeyMap(RELATIONSHIP_ITEM_KEYS);
const EMOTION_VALUE_MAP = buildValueToKeyMap(EMOTION_KEYS);
const VOCAL_VALUE_MAP = buildValueToKeyMap(VOCAL_KEYS);

export const getOccasionCategories = (t: TFunction<'criar'>): OptionCategory[] =>
  OCCASION_CATEGORY_CONFIG.map(({ key, labelKey, itemKeys }) => ({
    key,
    label: t(labelKey),
    items: itemKeys.map((itemKey) => ({ key: itemKey, label: t(itemKey) })),
  }));

export const getRelationshipCategories = (t: TFunction<'criar'>): OptionCategory[] =>
  RELATIONSHIP_CATEGORY_CONFIG.map(({ key, labelKey, itemKeys }) => ({
    key,
    label: t(labelKey),
    items: itemKeys.map((itemKey) => ({ key: itemKey, label: t(itemKey) })),
  }));

export const getEmotions = (t: TFunction<'criar'>): OptionItem[] =>
  EMOTION_KEYS.map((key) => ({ key, label: t(key) }));

export const getVocalPreferences = (t: TFunction<'criar'>): OptionItem[] =>
  VOCAL_KEYS.map((key) => ({ key, label: t(key) }));

const optionConfig = {
  occasion: { keys: OCCASION_ITEM_KEYS, map: OCCASION_VALUE_MAP },
  relationship: { keys: RELATIONSHIP_ITEM_KEYS, map: RELATIONSHIP_VALUE_MAP },
  emotion: { keys: EMOTION_KEYS, map: EMOTION_VALUE_MAP },
  vocal: { keys: VOCAL_KEYS, map: VOCAL_VALUE_MAP },
} as const;

export const normalizeOptionValue = (type: OptionType, value: string): string => {
  if (!value) return value;
  const { keys, map } = optionConfig[type];
  if (keys.includes(value)) {
    return value;
  }
  return map[value] ?? value;
};

export const translateOptionValue = (
  type: OptionType,
  value: string,
  t: TFunction<'criar'>,
): string => {
  if (!value) return '';
  const normalized = normalizeOptionValue(type, value);
  const { keys } = optionConfig[type];
  if (keys.includes(normalized)) {
    return t(normalized);
  }
  return value;
};

export const getLocalizedOptionValue = (type: OptionType, value: string, language?: string) => {
  if (!value) return '';
  const normalized = normalizeOptionValue(type, value);
  const { keys } = optionConfig[type];
  if (!keys.includes(normalized)) {
    return value;
  }
  const lng = language || i18n.language || 'pt';
  const fixedT = i18n.getFixedT(lng, 'criar');
  return fixedT(normalized);
};

