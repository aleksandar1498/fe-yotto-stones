// Phone numbers arrive in every shape: +359 89 996 6930, 00359 899 966 930,
// 0899 966 930 or 899 966 930. Canonicalise the common Bulgarian forms to the
// local 0-prefixed number so a search for "08999" matches all of them.
export function phoneKey(value: string | undefined | null): string {
  const d = (value ?? "").replace(/\D/g, "");
  if (d.startsWith("00359")) return `0${d.slice(5)}`;
  if (d.startsWith("359") && d.length > 3) return `0${d.slice(3)}`;
  return d;
}

// `query` may be raw input ("+359 89") or bare digits ("08999"). Check both the
// raw digits and the canonical form against the canonical phone.
export function phoneMatches(phone: string | undefined | null, query: string): boolean {
  const p = phoneKey(phone);
  const raw = (query ?? "").replace(/\D/g, "");
  if (!p || !raw) return false;
  return p.includes(raw) || p.includes(phoneKey(raw));
}
