const fs = require('fs');
const path = require('path');

const DEFAULT_SECTIONS_PATH = path.join(__dirname, '..', 'src', 'data', 'forumSections.ts');

function unescapeQuoted(value) {
  return String(value).replace(/\\'/g, "'");
}

function pickString(block, field) {
  const match = block.match(new RegExp(`\\b${field}:\\s*'((?:\\\\'|[^'])*)'`));
  return match ? unescapeQuoted(match[1]) : '';
}

function parseSections(source) {
  const sections = [];
  const re = /\{[^{}]*\bslug:\s*'((?:\\'|[^'])*)'[^{}]*\}/g;
  let match;
  while ((match = re.exec(source))) {
    const block = match[0];
    const slug = unescapeQuoted(match[1]);
    const name = pickString(block, 'name');
    if (!slug || !name) continue;
    sections.push({
      id: pickString(block, 'id'),
      name,
      description: pickString(block, 'description'),
      slug,
      parentId: pickString(block, 'parentId'),
      isClickable: /isClickable:\s*true/.test(block),
    });
  }
  return sections;
}

function loadSections(filePath = DEFAULT_SECTIONS_PATH) {
  return parseSections(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { parseSections, loadSections };
