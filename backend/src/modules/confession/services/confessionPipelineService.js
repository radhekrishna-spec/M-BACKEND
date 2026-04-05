
const { cleanText } = require('../helpers/textCleaner');
const { splitTextSmart } = require('../helpers/splitText');
const { getNextConfessionNo } = require('./confessionCounter');
const { generateSlidesImages } = require('../slides/slidesService');
const { uploadImagesToDrive } = require('../../../services/google/driveService');
const store = require('../../../store/store');

function validateAndPrepareText(data) {
  let raw = data?.confession || '';
  let text = cleanText(raw);

  if (!text || !/[a-zA-Z]/.test(text)) {
    throw new Error('Invalid confession text');
  }

  return text;
}

async function processMediaFlow(text, existingConfessionNo, settings) {
  const confessionNo = existingConfessionNo || (await getNextConfessionNo());

  const parts = settings.autoSplitParts ? splitTextSmart(text, 665) : [text];

  const imageBuffers = await generateSlidesImages(parts, confessionNo);

  const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

  store.set(`images_${confessionNo}`, driveUrls);
  store.set(`text_${confessionNo}`, text);
  store.set(`state_${confessionNo}`, 'CREATED');

  return {
    confessionNo,
    images: driveUrls,
  };
}

module.exports = {
  validateAndPrepareText,
  processMediaFlow,
};
