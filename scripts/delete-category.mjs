import { unlink } from 'node:fs/promises';
import { assertCategoryRemovable, categoryPathFromAction, loadCatalog, validateCatalog } from './category-data.mjs';

const payload = JSON.parse(process.env.PAGES_CMS_PAYLOAD ?? '{}');
const root = process.cwd();
const { path, absolute } = categoryPathFromAction(payload, root);
const catalog = await loadCatalog(root);
validateCatalog(catalog);
const category = assertCategoryRemovable(catalog, path);
await unlink(absolute);
console.log(`Deleted unused category ${category.name} (${path}).`);
