const { cleanText } = require('./textCleaner');
const { splitTextSmart } = require('./splitText');
const { getNextConfessionNo } = require('./confessionCounter');
const { generateSlidesImages } = require('./slidesService');
const { uploadImagesToDrive } = require('./driveService');
const { sendTelegram } = require('./telegramService');
const { buildCaption } = require('./captionService');

async function processFormSubmit(data) {
  let raw = data.confession || '';

  let text = cleanText(raw);

  if (!/[a-zA-Z]/.test(text)) {
    throw new Error('Invalid confession text');
  }

  const confessionNo = await getNextConfessionNo();

  const parts = splitTextSmart(text, 665);

  const imageBuffers = await generateSlidesImages(parts, confessionNo);

  const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

  const caption = buildCaption(`Confession #${confessionNo}`, confessionNo);

  await sendTelegram(driveUrls, caption, confessionNo);

  return {
    confessionNo,
    images: driveUrls,
  };
}

module.exports = { processFormSubmit };
