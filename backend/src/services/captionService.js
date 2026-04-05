const PAGE_NAME = process.env.PAGE_NAME || '@miet_k_dilwale_confession_wale';

// EXACT SAME AS APPSCRIPT
function buildCaption(question, confessionNo, hashtags = '') {
  const styles = [
    `${question}\n\nConfession #${confessionNo}\n\nTum kya karte?\nFollow ${PAGE_NAME}\n\n${hashtags}`,

    `Confession #${confessionNo}\n\n${question}\n\nHonest opinion do 👇\n${hashtags}`,

    `${question}\n\nSach me right kya hota?\nConfession #${confessionNo}\n\n${hashtags}`,

    `Confession #${confessionNo}\n\n${question}\n\nReply zarur karna.\nFollow ${PAGE_NAME}\n\n${hashtags}`,

    `${question}\n\nReality check do 👇\nConfession #${confessionNo}\n\n${hashtags}`,
  ];

  return styles[Math.floor(Math.random() * styles.length)];
}

// EXACT SAME FALLBACK
function generateFallbackQuestion(text) {
  const t = text.toLowerCase();

  if (t.includes('pyar') || t.includes('love')) {
    return 'Kya one sided love me wait karna sahi hota hai?';
  }

  if (t.includes('chhod') || t.includes('break')) {
    return 'Kya trust once broken kabhi wapas aa sakta hai?';
  }

  if (t.includes('dost')) {
    return 'Kya dosti me betrayal maaf karna chahiye?';
  }

  if (t.includes('dil') || t.includes('shayari')) {
    return 'Kya adhuri mohabbat hi sabse gehri hoti hai?';
  }

  return 'Agar tum hote to kya karte?';
}

// EXACT SAME EMOJI LOGIC
function addEmotionEmoji(question) {
  const q = question.toLowerCase();

  const love = ['🥺', '❤️', '💞', '💗'];
  const sad = ['💔', '😞', '😢', '🥀'];
  const think = ['🤔', '😶', '🫠'];
  const funny = ['😂', '🤣', '😅'];

  let set = think;

  if (q.includes('love') || q.includes('pyar') || q.includes('crush')) {
    set = love;
  } else if (q.includes('hurt') || q.includes('break') || q.includes('alone')) {
    set = sad;
  } else if (q.includes('funny') || q.includes('hasi')) {
    set = funny;
  }

  const emoji = set[Math.floor(Math.random() * set.length)];

  return question + ' ' + emoji;
}

// EXACT SAME HASHTAG LOGIC
function getSmartHashtags(text) {
  const t = text.toLowerCase();

  if (t.includes('love') || t.includes('crush') || t.includes('pyar')) {
    return '#loveconfession #crushstory #truelove #secretlove #relationship';
  }

  if (t.includes('break') || t.includes('hurt') || t.includes('alone')) {
    return '#heartbreak #sadconfession #brokenheart #lonely #lovehurt';
  }

  if (t.includes('shayari') || t.includes('ishq') || t.includes('dil')) {
    return '#shayari #hindishayari #sadshayari #poetrylove #dillikishayari';
  }

  if (t.includes('funny') || t.includes('hasi') || t.includes('lol')) {
    return '#funnyconfession #collegelife #relatable #memelife #funstory';
  }

  return '#confession #collegeconfession #secretstory #anonymous #studentlife';
}

// placeholder for future AI exact clone
async function generateAIQuestion(text) {
  return null;
}

module.exports = {
  buildCaption,
  generateFallbackQuestion,
  addEmotionEmoji,
  getSmartHashtags,
  generateAIQuestion,
};
