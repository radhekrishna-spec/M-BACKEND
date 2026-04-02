const store = require('../store');
const { splitTextSmart } = require('./splitText');
const { generateSlidesImages } = require('./slidesService');
const { uploadImagesToDrive } = require('./driveService');
const { updateTelegramButtons } = require('./telegramUpdateService');

async function regenerateEditedConfession(confessionNo, text) {
  const parts = splitTextSmart(text, 665);

  const imageBuffers = await generateSlidesImages(parts, confessionNo);

  const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

  store.set(`text_${confessionNo}`, text);
  store.set(`images_${confessionNo}`, driveUrls);

  // restore original state
  store.set(`state_${confessionNo}`, 'APPROVED');

  const tgMsgId = store.get(`telegram_msg_${confessionNo}`);

  await updateTelegramButtons(
    process.env.TELEGRAM_CHAT_ID,
    tgMsgId,
    'approved',
    confessionNo,
  );

  return true;
}

module.exports = {
  regenerateEditedConfession,
};
