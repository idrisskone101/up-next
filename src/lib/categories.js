/**
 * Query categories for vibes-based movie/TV search
 * Icons are Lucide component name strings for lazy loading
 */
export const QUERY_CATEGORIES = [
  {
    id: "vibes",
    label: "Vibes",
    icon: "Sparkles",
    queries: [
      "That 3am can't-sleep melancholy",
      "Sunday morning coffee & rain",
      "Hot girl summer energy",
      "Cozy autumn blanket fort",
      "Chaotic bisexual energy",
      "Corporate dystopia aesthetics",
      "Liminal space unease",
      "Golden hour nostalgia"
    ]
  },
  {
    id: "moods",
    label: "Moods",
    icon: "Heart",
    queries: [
      "Need a good ugly cry",
      "Angry at capitalism today",
      "Feeling seen and understood",
      "Existential but make it pretty",
      "Yearning for something unnamed",
      "Hopeful against all odds",
      "Deliciously petty revenge",
      "Quietly devastating"
    ]
  },
  {
    id: "chaos",
    label: "Chaos",
    icon: "Flame",
    queries: [
      "Unhinged female protagonists",
      "Men being absolute disasters",
      "Messy found family dynamics",
      "Morally bankrupt but charming",
      "Everything goes wrong hilariously",
      "Scheming and backstabbing",
      "Beautiful people doing crimes",
      "Problematic faves only"
    ]
  },
  {
    id: "brainy",
    label: "Brainy",
    icon: "Brain",
    queries: [
      "Makes you question reality",
      "Unreliable narrator mind games",
      "Philosophy disguised as plot",
      "Time isn't linear anymore",
      "What even is consciousness",
      "Puzzle box storytelling",
      "After credits existential crisis",
      "Needs a second watch immediately"
    ]
  },
  {
    id: "dark",
    label: "Dark",
    icon: "Skull",
    queries: [
      "Psychological horror slow burn",
      "Folk horror unsettling vibes",
      "True crime but artsy",
      "Dread that stays with you",
      "Beautiful but disturbing",
      "Cult stuff that hits different",
      "Body horror with a message",
      "Atmospheric terror no jump scares"
    ]
  },
  {
    id: "comfort",
    label: "Comfort",
    icon: "Popcorn",
    queries: [
      "Rom-com with actual chemistry",
      "Found family heals trauma",
      "Gentle slice of life healing",
      "Childhood nostalgia trip",
      "Studio Ghibli comfort blanket",
      "Predictable but satisfying",
      "Zero conflict just vibes",
      "Background while I doom scroll"
    ]
  },
  {
    id: "late",
    label: "Late Night",
    icon: "Moon",
    queries: [
      "2am existential rabbit hole",
      "Insomnia companion piece",
      "Dreamlike and hypnotic",
      "Weird but compelling",
      "Surreal fever dream energy",
      "Art house but accessible",
      "Slow cinema for overthinkers",
      "Meditative visual poetry"
    ]
  },
  {
    id: "specific",
    label: "Specific",
    icon: "Clock",
    queries: [
      "European train romance energy",
      "Heist crew with sexual tension",
      "Sword fights and yearning",
      "Space isolation goes wrong",
      "Rich people being terrible",
      "Small town dark secrets",
      "Journalist uncovers conspiracy",
      "90s NYC apartment aesthetics"
    ]
  }
];

/**
 * Get a random query from a specific category
 * @param {string} categoryId
 * @returns {string|null}
 */
export function getRandomQueryFromCategory(categoryId) {
  const category = QUERY_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return null;
  return category.queries[Math.floor(Math.random() * category.queries.length)];
}

/**
 * Get a random query from any category
 * @returns {string}
 */
export function getRandomQuery() {
  const category = QUERY_CATEGORIES[Math.floor(Math.random() * QUERY_CATEGORIES.length)];
  return category.queries[Math.floor(Math.random() * category.queries.length)];
}

/**
 * Icon name to Lucide component mapping
 * Import in components that need the actual icons
 */
export const CATEGORY_ICON_MAP = {
  Sparkles: "Sparkles",
  Heart: "Heart",
  Flame: "Flame",
  Brain: "Brain",
  Skull: "Skull",
  Popcorn: "Popcorn",
  Moon: "Moon",
  Clock: "Clock"
};
