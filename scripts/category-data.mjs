import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import YAML from 'yaml';

const categoryDir = 'src/data/categories';
const postDir = 'src/content/blog';

async function filesIn(folder, extension) {
  return (await readdir(folder, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith(extension))
    .map(entry => join(entry.parentPath, entry.name));
}

export async function loadCatalog(root) {
  const categoryFiles = await filesIn(join(root, categoryDir), '.json');
  const postFiles = await filesIn(join(root, postDir), '.md');
  const categories = await Promise.all(categoryFiles.map(async file => ({
    file: relative(root, file).replaceAll('\\', '/'),
    ...JSON.parse(await readFile(file, 'utf8')),
  })));
  const posts = await Promise.all(postFiles.map(async file => {
    const source = await readFile(file, 'utf8');
    const frontmatter = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) throw new Error(`${relative(root, file)}: YAML frontmatter가 없습니다.`);
    const data = YAML.parse(frontmatter[1]);
    return { file: relative(root, file).replaceAll('\\', '/'), tags: data?.tags ?? [] };
  }));
  return { categories, posts };
}

export function validateCatalog({ categories, posts }) {
  const names = new Map();
  for (const category of categories) {
    if (typeof category.name !== 'string' || !category.name.trim()) {
      throw new Error(`${category.file}: 카테고리 이름이 필요합니다.`);
    }
    if (names.has(category.name)) {
      throw new Error(`카테고리 이름이 중복됩니다: ${category.name}`);
    }
    names.set(category.name, category);
  }
  for (const category of categories) {
    if (category.parent == null || category.parent === '') continue;
    if (typeof category.parent !== 'string' || !names.has(category.parent)) {
      throw new Error(`${category.file}: 상위 카테고리 ${category.parent}가 없습니다.`);
    }
    if (category.parent === category.name || names.get(category.parent).parent) {
      throw new Error(`${category.file}: 카테고리는 두 단계까지만 만들 수 있습니다.`);
    }
  }
  for (const post of posts) {
    if (!Array.isArray(post.tags) || post.tags.some(tag => typeof tag !== 'string')) {
      throw new Error(`${post.file}: tags는 문자열 목록이어야 합니다.`);
    }
    for (const tag of post.tags) {
      if (!names.has(tag)) throw new Error(`${post.file}: 등록되지 않은 카테고리 ${tag}`);
    }
  }
}

export function assertCategoryRemovable({ categories, posts }, file) {
  const category = categories.find(item => item.file === file);
  if (!category) throw new Error(`카테고리 파일을 찾을 수 없습니다: ${file}`);
  const children = categories.filter(item => item.parent === category.name);
  if (children.length) throw new Error(`${category.name}: 하위 카테고리 ${children.map(item => item.name).join(', ')}를 먼저 정리하세요.`);
  const usedBy = posts.filter(post => post.tags.includes(category.name));
  if (usedBy.length) throw new Error(`${category.name}: 글 ${usedBy.map(post => post.file).join(', ')}을 먼저 재분류하세요.`);
  return category;
}

export function categoryPathFromAction(payload, root) {
  if (payload?.source !== 'pages-cms' || payload?.action?.name !== 'delete-unused-category' ||
      payload?.context?.type !== 'entry' || payload?.context?.name !== 'categories' ||
      payload?.repository?.owner !== 'mldlcl2022' || payload?.repository?.repo !== 'mldlcl2022.github.io' ||
      payload?.repository?.ref !== 'main') {
    throw new Error('유효한 Pages CMS 카테고리 삭제 요청이 아닙니다.');
  }
  const path = payload.context.path;
  if (typeof path !== 'string' || !/^src\/data\/categories\/[^/\\]+\.json$/u.test(path)) {
    throw new Error('잘못된 카테고리 경로입니다.');
  }
  const absolute = resolve(root, path);
  const base = resolve(root, categoryDir);
  if (!absolute.startsWith(`${base}${sep}`)) throw new Error('카테고리 경로가 저장소 밖입니다.');
  return { path, absolute };
}
