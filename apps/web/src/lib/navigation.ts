import type { Feature, FeatureCatalog } from '../types';

export type Navigation = { module?: FeatureCatalog; feature?: Feature };

/** Base path of a feature route, without any query string (e.g. /billing?tab=time -> /billing). */
export function baseRoute(feature: Feature): string {
  return feature.route.split('?')[0] ?? feature.route;
}

/** The canonical landing route of a module is its first configured feature. */
export function moduleHref(module: FeatureCatalog): string {
  const ordered = [...module.features].sort((a, b) => a.position - b.position);
  return ordered[0]?.route ?? '/';
}

function matchesFeature(feature: Feature, pathname: string): boolean {
  const base = baseRoute(feature);
  return base === pathname || (base !== '/' && pathname.startsWith(`${base}/`));
}

/**
 * Resolve the active primary module / secondary feature from the current URL.
 *
 * Matching rules, in priority order:
 * 1. Exact base-path matches beat parent-path prefix matches, so
 *    `/calendar/statutes` resolves to the statute feature, not `/calendar`.
 * 2. Query parameters in the feature route are compared with the current URL.
 *    This distinguishes features sharing a base path, e.g.
 *    `/billing?tab=invoices` vs `/billing?tab=invoices&new=1`.
 * 3. Longest base path, then configured position, break any remaining ties.
 */
export function resolveNavigation(
  modules: FeatureCatalog[],
  pathname: string,
  search: string,
): Navigation {
  const entries = modules.flatMap((module) =>
    [...module.features]
      .sort((a, b) => a.position - b.position)
      .map((feature) => ({ module, feature })),
  );

  const currentParams = new URLSearchParams(search);
  const candidates = entries
    .filter(({ feature }) => matchesFeature(feature, pathname))
    .map((entry) => {
      const base = baseRoute(entry.feature);
      const routeParams = new URLSearchParams(entry.feature.route.split('?')[1] ?? '');
      let matchedParams = 0;
      let conflictingParams = 0;
      routeParams.forEach((value, key) => {
        if (currentParams.get(key) === value) matchedParams += 1;
        else conflictingParams += 1;
      });
      return {
        ...entry,
        exactBase: base === pathname,
        matchedParams,
        conflictingParams,
        baseLength: base.length,
      };
    })
    .sort((a, b) =>
      Number(b.exactBase) - Number(a.exactBase) ||
      b.matchedParams - a.matchedParams ||
      a.conflictingParams - b.conflictingParams ||
      b.baseLength - a.baseLength ||
      a.feature.position - b.feature.position,
    );

  if (candidates.length > 0) {
    const best = candidates[0];
    return { module: best.module, feature: best.feature };
  }

  // Unknown URLs fall back to the workbench, which is the application default.
  return { module: modules.find((module) => module.code === 'dashboard') ?? modules[0] };
}
