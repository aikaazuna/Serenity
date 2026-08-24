/** Normalise une version (supprime préfixe v, suffixe prerelease, espaces). */
export function normalizeVersion(version: string): string {
  return version
    .trim()
    .replace(/^v/i, "")
    .split("-")[0]
    .split("+")[0];
}

/** Compare deux versions semver (major.minor.patch). Retourne 1 si a > b, -1 si a < b, 0 si égales. */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    normalizeVersion(v)
      .split(".")
      .slice(0, 3)
      .map((n) => parseInt(n, 10) || 0);

  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);

  if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1;
  if (aMin !== bMin) return aMin > bMin ? 1 : -1;
  if (aPat !== bPat) return aPat > bPat ? 1 : -1;
  return 0;
}

/** Extrait la version depuis un tag GitHub (ex. "v1.3.0" → "1.3.0"). */
export function parseReleaseTag(tag: string): string {
  return normalizeVersion(tag);
}
