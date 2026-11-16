import { getCollection } from "astro:content";
export async function published(collection: "blog" | "projects") {
  return (await getCollection(collection, ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
