import { getProviderHomeUrl, getProviderName } from "../lib/providerLogos";

/**
 * Provider list - simple text links to provider homepages
 */
export function ProviderBadges({ providers }) {
  if (!providers || providers.length === 0) {
    return null;
  }

  // Dedupe by provider name
  const seen = new Set();
  const uniqueProviders = providers.filter((p) => {
    const name = getProviderName(p.provider_id) || p.provider_name;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {uniqueProviders.map((provider, i) => {
        const name = getProviderName(provider.provider_id) || provider.provider_name || "Unknown";
        const homeUrl = getProviderHomeUrl(provider.provider_id);

        return (
          <span key={provider.provider_id} className="flex items-center gap-3">
            {homeUrl ? (
              <a
                href={homeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-brand-golden hover:text-brand-golden/80 hover:underline transition-colors"
              >
                {name}
              </a>
            ) : (
              <span className="text-sm text-white/70">{name}</span>
            )}
            {i < uniqueProviders.length - 1 && (
              <span className="text-white/30">·</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
