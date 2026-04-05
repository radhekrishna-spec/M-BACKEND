const crypto = require('crypto');

// in-memory cache exactly appscript jaisa behavior
let lastSubmitTime = 0;
const duplicateHashes = new Map();

function basicGrammarFix(text) {
  text = text.replace(/\bu\b/gi, 'you');
  text = text.replace(/\bur\b/gi, 'your');
  text = text.replace(/\br\b/gi, 'are');
  text = text.replace(/\bpls\b/gi, 'please');
  text = text.replace(/\bplz\b/gi, 'please');

  return text;
}

function limitEmojis(text) {
  const emojiRegex = /[\u{1F300}-\u{1FAFF}]/gu;

  const emojis = text.match(emojiRegex);

  if (!emojis) return text;
  if (emojis.length <= 5) return text;

  let count = 0;

  return text.replace(emojiRegex, (m) => {
    count++;
    return count <= 5 ? m : '';
  });
}

function censorToxic(text) {
  const words = ['madarchod', 'bhenchod', 'chutiya'];

  words.forEach((w) => {
    const regex = new RegExp(w, 'gi');

    text = text.replace(regex, (word) => {
      if (word.length <= 2) {
        return '*'.repeat(word.length);
      }

      return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
    });
  });

  return text;
}

function isSpamSubmit() {
  const now = Date.now();

  if (lastSubmitTime && now - lastSubmitTime < 5000) {
    return true;
  }

  lastSubmitTime = now;
  return false;
}

function isDuplicateConfession(text) {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hash = crypto.createHash('md5').update(clean).digest('base64');

  if (duplicateHashes.has(hash)) {
    return true;
  }

  duplicateHashes.set(hash, Date.now());

  return false;
}

function cleanText(raw) {
  let text = raw || '';

  text = text
    .replace(/\r/g, '')
    .replace(/\uFE0F/g, '')
    .replace(/[—]/g, '')
    .replace(/@\w+/g, 'id ')
    .replace(/\.{3,}/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

  text = basicGrammarFix(text);
  text = limitEmojis(text);
  text = censorToxic(text);

  return text;
}

module.exports = {
  cleanText,
  basicGrammarFix,
  limitEmojis,
  censorToxic,
  isSpamSubmit,
  isDuplicateConfession,
};
