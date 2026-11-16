import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve("dist");
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
const files = walk(root).filter((file) => file.endsWith(".html"));
const errors = [];
for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(url)) continue;
    const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
    const target = resolve(
      pathname.startsWith("/") ? root : dirname(file),
      pathname.replace(/^\//, ""),
    );
    if (!existsSync(target) && !existsSync(join(target, "index.html"))) {
      errors.push(`${file}: missing ${url}`);
    }
  }
}
// Derive expected counts from content, so deleting starter examples is safe.
for (const collection of ["blog", "projects"]) {
  const sources = walk(resolve("src/content", collection)).filter((file) =>
    file.endsWith(".md"),
  );
  const publicCount = sources.filter((file) => {
    const frontmatter =
      /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
    return !/^draft:\s*true\s*(?:#.*)?$/im.test(frontmatter);
  }).length;
  const collectionRoot = join(root, collection);
  const actualCount = existsSync(collectionRoot)
    ? walk(collectionRoot).filter(
        (file) =>
          file.endsWith(".html") && file !== join(collectionRoot, "index.html"),
      ).length
    : 0;
  if (actualCount !== publicCount)
    errors.push(
      `${collection}: expected ${publicCount} public entries, found ${actualCount}`,
    );
}
for (const route of [
  "index.html",
  "about/index.html",
  "blog/index.html",
  "projects/index.html",
  "404.html",
]) {
  if (!existsSync(join(root, route)))
    errors.push(`Missing expected route: ${route}`);
}
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  `Verified ${files.length} HTML pages, local asset/link targets, and draft exclusion.`,
);
