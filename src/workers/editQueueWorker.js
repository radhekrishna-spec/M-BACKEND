const store = require('../store');
const { generateSlidesImages } = require('../services/slidesService');
const { uploadImagesToDrive } = require('../services/driveService');
const { sendTelegram } = require('../services/telegramService');
const { buildCaption } = require('../services/captionService');

async function processEditQueue() {
  const editingId = store.props.editing_active;

  if (!editingId) return;

  const text = store.props[`text_${editingId}`];

  if (!text) return;

  try {
    const parts = [text];

    const imageBuffers = await generateSlidesImages(parts, editingId);

    const driveUrls = await uploadImagesToDrive(imageBuffers, editingId);

    const caption = buildCaption(text, editingId);

    await sendTelegram(driveUrls, caption, editingId);

    console.log(`Edit processed #${editingId}`);
  } catch (err) {
    console.log('edit queue error', err.message);
  }
}

function startEditQueueWorker() {
  setInterval(async () => {
    await processEditQueue();
  }, 3000);
}

module.exports = {
  startEditQueueWorker,
  processEditQueue,
};
