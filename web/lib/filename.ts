/**
 * Turning a seed into something a file system will keep.
 *
 * ONE COPY, used by both exports. It was written twice - once in `csv.ts` and
 * once in `png.ts` - and two copies of a transliteration table is how the CSV
 * and the PNG of the same search end up with different names.
 *
 * The folding is deliberate rather than decorative. A downloaded file travels
 * through mail clients, chat apps and file systems that still mangle anything
 * outside ASCII, and `diş beyazlatma.csv` arriving as `di_ beyazlatma.csv` is
 * a file somebody cannot find again.
 *
 * `ı ş ğ` are handled explicitly because NFKD does NOT decompose them - they
 * are distinct Latin letters, not accented forms of `i s g`, so the combining
 * -mark strip that handles `é` and `ü` leaves them untouched. The primary
 * market for this product is one where all three are common.
 */
export function fileSlug(seed: string): string {
  return seed
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * `<seed>-<date>.<extension>`, or `answergap-<date>` when the seed folds away
 * to nothing - which a wholly non-Latin seed does entirely.
 */
export function exportFilename(
  seed: string,
  extension: string,
  today: Date = new Date()
): string {
  const slug = fileSlug(seed);
  return `${slug || "answergap"}-${today.toISOString().slice(0, 10)}.${extension}`;
}
