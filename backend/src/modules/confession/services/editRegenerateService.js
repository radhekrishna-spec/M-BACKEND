const store = require('../../../store/store');
const { splitTextSmart } = require('../helpers/splitText');
const { generateSlidesImages } = require('../slides/slidesService');
const { uploadImagesToDrive } = require('../../../services/google/driveService');

async function regenerateEditedConfession(confessionNo, text) {
  const parts = splitTextSmart(text, 665);

  const imageBuffers = await generateSlidesImages(parts, confessionNo);

  const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

  store.set(`text_${confessionNo}`, text);
  store.set(`images_${confessionNo}`, driveUrls);

  // restore original state
  store.set(`state_${confessionNo}`, 'APPROVED');

  return true;
}

module.exports = {
  regenerateEditedConfession,
};
