import { loadCatalog, validateCatalog } from './category-data.mjs';

const catalog = await loadCatalog(process.cwd());
validateCatalog(catalog);
console.log(`Validated ${catalog.categories.length} categories and ${catalog.posts.length} posts.`);
