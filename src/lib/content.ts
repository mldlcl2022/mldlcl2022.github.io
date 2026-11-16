import { getCollection } from "astro:content";
export async function published<T extends "blog" | "projects">(collection: T) {
  return (await getCollection(collection, ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
export const excerpt = (body: string) => body
  .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]*>/g, ' ')
  .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+\.\s+)/gm, '')
  .replace(/[*_`~]/g, '')
  .replace(/\s+/g, ' ')
  .trim();
