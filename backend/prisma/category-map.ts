export const CATEGORY_MAP: Readonly<Record<string, string>> = {
  'Best Action Game': 'Best Action Game',
  'Best Action/Adventure': 'Best Action/Adventure Game',
  'Best Action/Adventure Game': 'Best Action/Adventure Game',
  'Best Art Direction': 'Best Art Direction',
  'Best Audio Design': 'Best Audio Design',
  'Best Community Support': 'Best Community Support',
  'Best Debut Indie Game': 'Best Debut Indie Game',
  'Best Esports Coach': 'Best Esports Coach',
  'Best Esports Event': 'Best Esports Event',
  'Best Esports Game': 'Best Esports Game',
  'Best Esports Host': 'Best Esports Host',
  'Best Esports Moment': 'Best Esports Moment',
  'Best Esports Player': 'Best Esports Player',
  'Best Esports Team': 'Best Esports Team',
  'Best Family Game': 'Best Family Game',
  'Best Fan Creation': 'Best Fan Creation',
  'Best Fighting Game': 'Best Fighting Game',
  'Best Game Direction': 'Best Game Direction',
  'Best Handheld Game': 'Best Handheld Game',
  'Best Independent Game': 'Best Independent Game',
  'Best Mobile Game': 'Best Mobile Game',
  'Best Mobile/Handheld Game': 'Best Mobile/Handheld Game',
  'Best Multiplayer': 'Best Multiplayer Game',
  'Best Multiplayer Game': 'Best Multiplayer Game',
  'Best Music/Sound Design': 'Best Audio Design',
  'Best Narrative': 'Best Narrative',
  'Best Ongoing Game': 'Best Ongoing Game',
  'Best Online Experience': 'Best Online Experience',
  'Best Performance': 'Best Performance',
  'Best Remaster': 'Best Remaster',
  'Best Role Playing Game': 'Best Role Playing Game',
  'Best Score/Music': 'Best Score/Music',
  'Best Score/Soundtrack': 'Best Score/Music',
  'Best Shooter': 'Best Shooter',
  'Best Sports/Racing Game': 'Best Sports/Racing Game',
  'Best Strategy Game': 'Best Strategy Game',
  'Best Student Game': 'Best Student Game',
  'Best VR Game': 'Best VR/AR Game',
  'Best VR/AR Game': 'Best VR/AR Game',
  'Best eSports Game': 'Best Esports Game',
  'Best eSports Player': 'Best Esports Player',
  'Best eSports Team': 'Best Esports Team',
  'Chinese Fan Game Award': 'Chinese Fan Game Award',
  'Content Creator of the Year': 'Content Creator of the Year',
  'Developer of the Year': 'Developer of the Year',
  'ESports Game of the Year': 'Best Esports Game',
  'ESports Player of the Year': 'Best Esports Player',
  'ESports Team of the Year': 'Best Esports Team',
  'Fresh Indie Game': 'Best Debut Indie Game',
  'Game of the Year': 'Game of the Year',
  'Games for Change': 'Games for Impact',
  'Games for Impact': 'Games for Impact',
  'Global Gaming Citizens': 'Global Gaming Citizens',
  'Industry Icon Award': 'Industry Icon Award',
  'Most Anticipated Game': 'Most Anticipated Game',
  'Most Anticipated Game 2015': 'Most Anticipated Game',
  "Player's Voice": "Player's Voice",
  'Student Game Award': 'Best Student Game',
  'Trending Gamer': 'Trending Gamer',
};

export function normalizeCategory(raw: string): string {
  const canonical = CATEGORY_MAP[raw];
  if (canonical === undefined) {
    throw new Error(`Categoria desconhecida no CSV: "${raw}"`);
  }
  return canonical;
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
