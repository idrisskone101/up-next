import posthog from 'posthog-js';

const isDev = import.meta.env.MODE === 'development';

function capture(event, properties) {
  try {
    posthog.capture(event, properties);
  } catch (e) {
    if (isDev) console.warn('[analytics]', event, e);
  }
}

// Increments total_searches and sets date properties
function trackSearchProperties() {
  try {
    const now = new Date().toISOString();
    posthog.people.set_once({ first_search_date: now });
    posthog.people.increment('total_searches');
    posthog.people.set({ last_search_date: now });
  } catch (e) {
    if (isDev) console.warn('[analytics] search properties', e);
  }
}

export function trackSearchExecuted({ query, source, filter, resultCount }) {
  capture('search_executed', {
    query,
    source,
    filter,
    result_count: resultCount,
  });
  trackSearchProperties();
}

export function trackSearchError({ errorType, query }) {
  capture('search_error', { error_type: errorType, query });
}

export function trackMovieDetailOpened({ movieId, title, kind, viewType, matchScore, positionInResults }) {
  capture('movie_detail_opened', {
    movie_id: movieId,
    title,
    kind,
    view_type: viewType,
    match_score: matchScore,
    position_in_results: positionInResults,
  });
}

export function trackMovieDetailClosed({ movieId, viewType }) {
  capture('movie_detail_closed', { movie_id: movieId, view_type: viewType });
}

export function trackMoreLikeThisClicked({ sourceMovieId, sourceTitle }) {
  capture('more_like_this_clicked', { source_movie_id: sourceMovieId, source_title: sourceTitle });
}

export function trackSimilarSearchExecuted({ sourceTitleId, sourceTitle }) {
  capture('similar_search_executed', { source_title_id: sourceTitleId, source_title: sourceTitle });
}

export function trackFilterChanged({ filterType, previousFilter }) {
  capture('filter_changed', { filter_type: filterType, previous_filter: previousFilter });
}

export function trackCategorySelected({ categoryId, categoryLabel }) {
  capture('category_selected', { category_id: categoryId, category_label: categoryLabel });
}

export function trackQueryPillClicked({ queryText, categoryId }) {
  capture('query_pill_clicked', { query_text: queryText, category_id: categoryId });
}

export function trackSurpriseMeClicked({ queryGenerated }) {
  capture('surprise_me_clicked', { query_generated: queryGenerated });
}

export function trackPageChanged({ pageNumber, totalPages }) {
  capture('page_changed', { page_number: pageNumber, total_pages: totalPages });
}

export function trackVibeSearched({ vibeText }) {
  capture('vibe_searched', { vibe_text: vibeText });
}

export function trackMentionSelected({ titleId, titleName }) {
  capture('mention_selected', { title_id: titleId, title_name: titleName });
}

export function trackCommandPaletteOpened() {
  capture('command_palette_opened');
}

export function trackRecentSearchClicked({ query }) {
  capture('recent_search_clicked', { query });
}

export function trackBackToHero() {
  capture('back_to_hero');
}

export function trackEmptyResults({ query }) {
  capture('empty_results', { query });
}
