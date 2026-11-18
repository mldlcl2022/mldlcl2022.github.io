type Category = { name: string; parent?: string | null };

const files = import.meta.glob<{ default: Category }>('./categories/*.json', { eager: true });
const entries = Object.values(files).map(file => file.default);
const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, 'ko');

export const blogCategories = entries
  .filter(category => !category.parent)
  .sort(byName)
  .map(category => ({
    name: category.name,
    children: entries.filter(child => child.parent === category.name).sort(byName).map(child => child.name),
  }));
