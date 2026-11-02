import type { Node } from "./types";

export const WRITE_FIRST_LIMIT = 5;

/**
 * Which unanswered questions to write first.
 *
 * Only questions whose results were read and came out as gaps: an unchecked
 * question is unknown, never a gap. The order is fewest pages targeting it,
 * then most branches, then closest to the seed. PAA order and volume play no
 * part, so this list must never be called "most popular".
 */
export function writeFirst<T extends Pick<Node, "question" | "status" | "depth" | "results_checked" | "matching_pages" | "repeat_count">>(
  nodes: T[]
): T[] {
  return nodes
    .filter((n) => n.depth > 0 && n.status === "gap" && n.results_checked > 0)
    .sort(
      (a, b) =>
        a.matching_pages - b.matching_pages ||
        b.repeat_count - a.repeat_count ||
        a.depth - b.depth ||
        a.question.localeCompare(b.question)
    );
}
