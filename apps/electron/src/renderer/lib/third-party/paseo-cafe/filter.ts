/**
 * Adapted from paseo-cafe/paseo-cafe plugin/client/browse.ts.
 * Copyright Paseo Cafe contributors. Apache-2.0; see LICENSE and NOTICE.
 * Modification: replace host-specific DirectoryEntry type with a structural input.
 */
export interface CafeCatalogSearchEntry {
  id:string;name:string;description:string;categories:string[]
  author:{github:string;name?:string}
}
export function filterBySearchAndCategories(
  entries: readonly CafeCatalogSearchEntry[],
  query: string,
  categories: ReadonlySet<string>,
  categoryLabels: ReadonlyMap<string, string>
): CafeCatalogSearchEntry[] {
  const needle = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (
      categories.size > 0 &&
      !entry.categories.some((category) => categories.has(category))
    ) {
      return false
    }
    if (!needle) return true
    const haystack = [
      entry.id,
      entry.name,
      entry.description,
      entry.author.github,
      entry.author.name,
      ...entry.categories,
      ...entry.categories.map((category) => categoryLabels.get(category)),
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase()
    return haystack.includes(needle)
  })
}

