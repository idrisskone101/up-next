// Static mapping of provider_id to homepage URL and name
export const PROVIDERS = {
  8: { name: 'Netflix', home: 'https://www.netflix.com' },
  1796: { name: 'Netflix', home: 'https://www.netflix.com' },
  9: { name: 'Amazon Prime Video', home: 'https://www.amazon.com/Prime-Video' },
  2100: { name: 'Amazon Prime Video', home: 'https://www.amazon.com/Prime-Video' },
  337: { name: 'Disney+', home: 'https://www.disneyplus.com' },
  15: { name: 'Hulu', home: 'https://www.hulu.com' },
  1899: { name: 'Max', home: 'https://www.max.com' },
  1825: { name: 'Max', home: 'https://www.max.com' },
  386: { name: 'Peacock', home: 'https://www.peacocktv.com' },
  387: { name: 'Peacock', home: 'https://www.peacocktv.com' },
  531: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  582: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  633: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  2303: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  2616: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  350: { name: 'Apple TV+', home: 'https://tv.apple.com' },
  2: { name: 'Apple TV', home: 'https://tv.apple.com' },
  283: { name: 'Crunchyroll', home: 'https://www.crunchyroll.com' },
  257: { name: 'fuboTV', home: 'https://www.fubo.tv' },
  73: { name: 'Tubi', home: 'https://tubitv.com' },
  300: { name: 'Pluto TV', home: 'https://pluto.tv' },
  43: { name: 'Starz', home: 'https://www.starz.com' },
  1794: { name: 'Starz', home: 'https://www.starz.com' },
  34: { name: 'MGM+', home: 'https://www.mgmplus.com' },
  583: { name: 'MGM+', home: 'https://www.mgmplus.com' },
  526: { name: 'AMC+', home: 'https://www.amcplus.com' },
  528: { name: 'AMC+', home: 'https://www.amcplus.com' },
  151: { name: 'BritBox', home: 'https://www.britbox.com' },
  37: { name: 'Showtime', home: 'https://www.showtime.com' },
  1770: { name: 'Paramount+', home: 'https://www.paramountplus.com' },
  2383: { name: 'Philo', home: 'https://www.philo.com' },
  2528: { name: 'YouTube TV', home: 'https://tv.youtube.com' },
};

export function getProviderName(providerId) {
  return PROVIDERS[providerId]?.name || null;
}

export function getProviderHomeUrl(providerId) {
  return PROVIDERS[providerId]?.home || null;
}
