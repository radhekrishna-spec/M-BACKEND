const {
  validateAndPrepareText,
  processMediaFlow,
} = require('./services/confessionPipelineService');
const { getNextConfessionNo } = require('./services/confessionCounter');

const { checkDuplicate } = require('./services/duplicateService');
const { createCaptionFlow } = require('./helpers/captionBuilderService');
const { getSettings } = require('../../services/settingsService');

async function processFormSubmit(data, existingConfessionNo = null) {
  const startTime = Date.now();

  try {
    const settings = normalizeSettings(getSettings());

    const text = validateAndPrepareText(data);

    if (!existingConfessionNo && settings.duplicateCheck) {
      checkDuplicate(text);
    }

    const confessionNo = existingConfessionNo || (await getNextConfessionNo());

    const mediaResult = await processMediaFlow(text, confessionNo, settings);
    const caption = await createCaptionFlow(text, mediaResult.confessionNo);

    if (settings.telegramPreview) {
      const { sendTelegram } = require('../social/telegramService');

      try {
        await new Promise((resolve) => setTimeout(resolve, 8000));
        await sendTelegram(
          mediaResult.images,
          caption,
          mediaResult.confessionNo,
          !!existingConfessionNo,
        );
      } catch (error) {
        console.error(
          '❌ Telegram send failed but confession saved:',
          error.response?.data || error.message,
        );
      }
    }

    return {
      success: true,
      confessionNo: mediaResult.confessionNo,
      text,
      images: mediaResult.images,
      caption,
    };
  } catch (error) {
    console.error('FORM SUBMIT ERROR:', error.message);
    throw error;
  } finally {
    console.log(`DONE IN ${Date.now() - startTime}ms`);
  }
}

function normalizeSettings(rawSettings) {
  return {
    duplicateCheck:
      rawSettings.duplicateCheck ?? rawSettings.isDuplicate ?? true,
    autoSplitParts: rawSettings.autoSplitParts ?? rawSettings.split ?? true,
    telegramPreview:
      rawSettings.telegramPreview ?? rawSettings.telegram ?? true,
  };
}

module.exports = {
  processFormSubmit,
};
