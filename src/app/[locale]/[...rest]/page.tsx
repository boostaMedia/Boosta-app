import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths within a locale segment so that they render
 * the localized not-found page instead of a bare 404.
 */
export default function CatchAllPage() {
  notFound();
}
