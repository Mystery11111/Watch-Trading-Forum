// ============================================
// TRANSLATION UTILITY
// Google Translate free endpoint — no API key required.
// Uses Node's built-in https module (works on all Node versions, 15s timeout).
// ============================================

const https = require('https');

const MAX_CHARS = 4800;
// Separator used to batch multiple blocks into one API call.
// Chosen to be highly unlikely to appear in translated text.
const BLOCK_SEP = ' ||||| ';

// ─── Strip HTML tags from a single block's inner content ─────────────────────
function stripHtml(html) {
  if (!html || !html.trim()) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Convert plain text back to <p>-wrapped HTML (fallback only) ─────────────
function textToHtml(text) {
  if (!text || !text.trim()) return '';
  return text
    .split(/\n\n+/)
    .map(para => para.trim())
    .filter(Boolean)
    .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// ─── HTTPS GET with timeout ───────────────────────────────────────────────────
function httpsGet(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.setTimeout(timeoutMs, () => { req.destroy(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

// ─── Split plain text into chunks ────────────────────────────────────────────
function splitIntoChunks(text) {
  if (!text || text.trim() === '') return [];
  if (text.length <= MAX_CHARS) return [text.trim()];
  const chunks = [];
  const words = text.split(/\s+/);
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > MAX_CHARS) {
      if (current) chunks.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// ─── Map language codes to Google Translate codes ────────────────────────────
const GOOGLE_LANG_MAP = { 'zh': 'zh-CN', 'pcm': 'en' };
function toGoogleLang(code) { return GOOGLE_LANG_MAP[code] || code; }

// ─── Translate one chunk via Google Translate ─────────────────────────────────
async function translateChunk(chunk, targetLang) {
  if (!chunk || !chunk.trim()) return chunk;
  const gl = toGoogleLang(targetLang);
  if (gl === 'en') return chunk;

  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=en&tl=' + encodeURIComponent(gl) +
    '&dt=t&q=' + encodeURIComponent(chunk);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await httpsGet(url);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map(seg => (Array.isArray(seg) ? seg[0] : ''))
          .filter(Boolean)
          .join('');
        if (translated.trim()) return translated;
      }
      return chunk;
    } catch (err) {
      console.warn(`[translate] Attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 600));
    }
  }
  return chunk;
}

// ─── Translate plain text (any length) ───────────────────────────────────────
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  if (targetLang === 'en') return text;
  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return text;
  const results = [];
  for (const chunk of chunks) {
    results.push(await translateChunk(chunk, targetLang));
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 100));
  }
  return results.join(' ');
}

// ─── Group block texts into batches that each fit under MAX_CHARS ─────────────
function groupIntoBatches(blockTexts) {
  const batches = []; // each batch = array of { originalIndex, text }
  let current = [];
  let currentLen = 0;

  for (let i = 0; i < blockTexts.length; i++) {
    const text = blockTexts[i];
    const sepLen = current.length > 0 ? BLOCK_SEP.length : 0;
    const wouldBe = currentLen + sepLen + text.length;

    if (wouldBe > MAX_CHARS && current.length > 0) {
      batches.push(current);
      current = [{ originalIndex: i, text }];
      currentLen = text.length;
    } else {
      current.push({ originalIndex: i, text });
      currentLen = wouldBe;
    }
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

// ─── Translate HTML content block-by-block (BATCHED) ─────────────────────────
// Collects all block texts, batches them under MAX_CHARS, sends each batch as
// ONE API call, then reassembles. This reduces 50 API calls to ~2-4 calls for
// a typical long blog post.
async function translateHtmlContent(html, targetLang) {
  if (!html || !html.trim()) return html;
  if (targetLang === 'en') return html;

  const blockRe = /<(h[1-6]|p|li|blockquote)(\s[^>]*)?>(\s*)([\s\S]*?)<\/\1>/gi;
  const matches = [...html.matchAll(blockRe)];

  if (matches.length === 0) {
    // No block elements — plain text fallback
    const plain = stripHtml(html);
    const translated = await translateText(plain, targetLang);
    return textToHtml(translated);
  }

  // Extract plain text from every block
  const blockTexts = matches.map(m => stripHtml(m[4] || ''));

  // Group into batches that each fit in one API call
  const batches = groupIntoBatches(blockTexts);

  // Translate each batch (sequential batches, but far fewer calls than before)
  const translatedTexts = new Array(blockTexts.length);

  for (const batch of batches) {
    if (batch.length === 0) continue;

    // Join all texts in this batch with the separator
    const joined = batch.map(b => b.text).join(BLOCK_SEP);

    let parts;
    try {
      const result = await translateChunk(joined, targetLang);
      parts = result.split(BLOCK_SEP);
    } catch (err) {
      console.warn('[translateHtml] Batch failed, falling back to individual:', err.message);
      parts = [];
    }

    if (parts.length === batch.length) {
      // Separator survived — assign each part back to its block
      for (let i = 0; i < batch.length; i++) {
        translatedTexts[batch[i].originalIndex] = parts[i].trim();
      }
    } else {
      // Separator was mangled — fall back to translating this batch individually
      for (const { originalIndex, text } of batch) {
        if (!text.trim()) {
          translatedTexts[originalIndex] = '';
        } else {
          translatedTexts[originalIndex] = await translateChunk(text, targetLang);
        }
      }
    }
  }

  // Rebuild HTML string by applying replacements in reverse order
  const replacements = matches.map((match, i) => {
    const [fullMatch, tag, attrs] = match;
    const originalText = blockTexts[i];
    const translatedText = translatedTexts[i];

    return {
      index: match.index,
      length: fullMatch.length,
      // Preserve original tag attributes (e.g. margin-bottom, line-height inline styles)
      replacement: originalText.trim()
        ? `<${tag}${attrs || ''}>${translatedText || originalText}</${tag}>`
        : `<${tag}${attrs || ''}></${tag}>`,
    };
  });

  let result = html;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { index, length, replacement } = replacements[i];
    result = result.slice(0, index) + replacement + result.slice(index + length);
  }

  return result;
}

// ─── Translate array of texts (for /api/translate route) ─────────────────────
async function translateTexts(texts, targetLang) {
  const results = [];
  for (const text of texts) {
    const plain = stripHtml(text);
    results.push((await translateText(plain, targetLang)) || plain);
  }
  return results;
}

module.exports = { translateTexts, translateText, stripHtml, textToHtml, translateHtmlContent };
