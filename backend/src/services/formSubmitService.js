const { validateAndPrepareText } = require('./confessionPipelineService');
const { checkDuplicate } = require('./duplicateService');
const { createCaptionFlow } = require('./captionBuilderService');
const { processMediaFlow } = require('./confessionPipelineService');
const { getSettings } = require('./settingsService');

async function processFormSubmit(data, existingConfessionNo = null) {
  const startTime = Date.now();

  try {
    const settings = normalizeSettings(getSettings());

    const text = validateAndPrepareText(data);

    if (!existingConfessionNo && settings.duplicateCheck) {
      checkDuplicate(text);
    }

    const mediaResult = await processMediaFlow(
      text,
      existingConfessionNo,
      settings,
    );

    const caption = await createCaptionFlow(text, mediaResult.confessionNo);

    if (settings.telegramPreview) {
      const { sendTelegram } = require('./telegramService');

      await sendTelegram(
        mediaResult.images,
        caption,
        mediaResult.confessionNo,
        !!existingConfessionNo,
      );
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
