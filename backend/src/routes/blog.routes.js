const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const Blog = require('../models/Blog');
const { translateText, stripHtml, translateHtmlContent } = require('../utils/translate');

const router = express.Router();

const toClient = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
};

// Languages to translate into (all supported except English)
const TRANSLATE_LANGS = [
  { code: 'zh' },
  { code: 'hi' },
  { code: 'es' },
  { code: 'fr' },
  { code: 'ar' },
  { code: 'bn' },
  { code: 'pt' },
  { code: 'ru' },
  { code: 'nl' },
  { code: 'ur' },
  { code: 'id' },
  { code: 'de' },
  { code: 'ja' },
  { code: 'pcm' }, // Nigerian Pidgin — Google maps to 'en' so content stays English
  { code: 'mr' },
];

// How many languages to translate at the same time.
// 5 parallel requests is a safe balance between speed and rate-limit safety.
const LANG_CONCURRENCY = 5;

// ─── Translate one language ───────────────────────────────────────────────────
async function translateOneLanguage(post, code, baseSlug, metaTitle, metaDescription) {
  const [tTitle, tExcerpt, tMeta, tDesc, tContent] = await Promise.all([
    translateText(post.title, code),
    translateText(post.excerpt, code),
    translateText(metaTitle, code),
    translateText(metaDescription, code),
    translateHtmlContent(post.content, code),
  ]);

  return {
    title:           tTitle    || post.title,
    slug:            `${baseSlug}-${code}`,
    excerpt:         tExcerpt  || post.excerpt,
    content:         tContent  || post.content,
    metaTitle:       tMeta     || metaTitle,
    metaDescription: tDesc     || metaDescription,
  };
}

// ─── Helper: translate a post into all languages (parallel batches) ───────────
async function translatePostObject(post) {
  const baseSlug = post.slug;
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt;
  const translations = {};

  // Process languages in parallel batches to stay well under the HTTP timeout.
  // Example: 15 langs at LANG_CONCURRENCY=5 → 3 rounds of 5 parallel calls.
  for (let i = 0; i < TRANSLATE_LANGS.length; i += LANG_CONCURRENCY) {
    const batch = TRANSLATE_LANGS.slice(i, i + LANG_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.map(({ code }) =>
        translateOneLanguage(post, code, baseSlug, metaTitle, metaDescription)
          .then(translation => ({ code, translation }))
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { code, translation } = result.value;
        translations[code] = translation;
        console.log(`[translate] ✓ ${code}`);
      } else {
        // Find which code failed so we can log and fallback
        const idx = results.indexOf(result);
        const code = batch[idx]?.code || '?';
        console.error(`[translate] ✗ ${code}:`, result.reason?.message);
        // Fallback: keep English so the post is still readable in that language
        translations[code] = {
          title: post.title,
          slug: `${baseSlug}-${code}`,
          excerpt: post.excerpt,
          content: post.content,
          metaTitle,
          metaDescription,
        };
      }
    }

    // Small pause between batches to be polite to Google's free endpoint
    if (i + LANG_CONCURRENCY < TRANSLATE_LANGS.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return translations;
}

// ── GET /api/blog  — public ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const posts = await Blog.find().sort({ publishedAt: -1 }).lean();
    res.json(posts.map(({ _id, __v, ...p }) => ({ ...p, id: _id.toString() })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/blog/:slug  — public ────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug }).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { _id, __v, ...p } = post;
    res.json({ ...p, id: _id.toString() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/blog  — owner only ─────────────────────────────────────────────
router.post('/', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, ...body } = req.body;
    const post = await Blog.create(body);
    res.status(201).json(toClient(post));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A post with this slug already exists.' });
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/blog/:id  — owner only ────────────────────────────────────────
router.patch('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    const { id: _ignore, publishedAt: _pub, __v, ...updates } = req.body;
    const post = await Blog.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(toClient(post));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/blog/:id  — owner only ───────────────────────────────────────
router.delete('/:id', auth, requireRole('owner'), async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/blog/:id/view  — public ────────────────────────────────────────
router.post('/:id/view', async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

// ── POST /api/blog/:id/translate  — owner only ───────────────────────────────
router.post('/:id/translate', auth, requireRole('owner'), async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    console.log(`[translate] Starting for: ${post.slug}`);
    const translations = await translatePostObject(post);

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: { translations } },
      { new: true },
    );
    console.log(`[translate] Done for: ${post.slug}`);
    res.json(toClient(updated));
  } catch (err) {
    console.error('[translate] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
