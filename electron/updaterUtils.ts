/** Normalise une version (supprime préfixe v, pre, vpre, release, etc.). */
export function normalizeVersion(version: string): string {
  return (version || "")
    .trim()
    .replace(/^(v|pre|vpre|release[-_]?|ver[-_]?)/i, "")
    .split("-")[0]
    .split("+")[0];
}

export function isPrerelease(version: string): boolean {
  return /pre|alpha|beta|rc|dev|preview/i.test(version || "");
}

/** Compare deux versions semver (major.minor.patch). Retourne 1 si a > b, -1 si a < b, 0 si égales. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    normalizeVersion(v)
      .split(".")
      .slice(0, 3)
      .map((n) => parseInt(n, 10) || 0);

  const [aMaj = 0, aMin = 0, aPat = 0] = parse(a);
  const [bMaj = 0, bMin = 0, bPat = 0] = parse(b);

  if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1;
  if (aMin !== bMin) return aMin > bMin ? 1 : -1;
  if (aPat !== bPat) return aPat > bPat ? 1 : -1;

  // Si les chiffres de base sont identiques (ex: 1.0.0 vs Pre1.0.0), la version stable est supérieure
  const aPre = isPrerelease(a);
  const bPre = isPrerelease(b);
  if (aPre !== bPre) return aPre ? -1 : 1;

  return 0;
}

/** Extrait la version depuis un tag GitHub (ex. "v1.0.0" ou "Pre1.0.0" → "1.0.0"). */
export function parseReleaseTag(tag: string): string {
  return normalizeVersion(tag);
}
