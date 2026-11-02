/** The country a search ran in, in the reader's language. The API's English
 *  name stands in where the browser has no translation for the code. */
export function marketName(
  tree: { location_name?: string; location_iso?: string },
  tag: string
): string {
  if (!tree.location_iso) return tree.location_name ?? "";
  try {
    const names = new Intl.DisplayNames([tag], { type: "region", fallback: "none" });
    return names.of(tree.location_iso) ?? tree.location_name ?? "";
  } catch {
    return tree.location_name ?? "";
  }
}
