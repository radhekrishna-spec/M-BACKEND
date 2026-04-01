const { cleanText } = require('./textCleaner');
const { splitTextSmart } = require('./splitText');
const { getNextConfessionNo } = require('./confessionCounter');
const { generateSlidesImages } = require('./slidesService');
const { getSettings } = require('./settingsService');

const { uploadImagesToDrive } = require('./driveService');
const { sendTelegram } = require('./telegramService');
const {
  buildCaption,
  generateAIQuestion,
  generateFallbackQuestion,
  addEmotionEmoji,
  getSmartHashtags,
} = require('./captionService');

const store = require('../store');
async function processFormSubmit(data) {
  const startTime = Date.now();

  try {
    const settings = getSettings();
    let raw = data?.confession || '';

    // EXACT APP SCRIPT CLEAN FLOW
    let text = cleanText(raw);

    if (!text || !/[a-zA-Z]/.test(text)) {
      throw new Error('Invalid confession text');
    }

    // duplicate text block (30 sec)
    if (settings.duplicateCheck) {
      const lastText = store.get('LAST_PROCESSED_TEXT');
      const lastTime = store.get('LAST_PROCESSED_TIME');

      if (lastText === text && lastTime && Date.now() - lastTime < 30000) {
        throw new Error('Duplicate confession blocked');
      }

      store.set('LAST_PROCESSED_TEXT', text);
      store.set('LAST_PROCESSED_TIME', Date.now());
    }

    // SAME AS APP SCRIPT
    const confessionNo = await getNextConfessionNo();

    console.log(`🚀 STARTING CONFESSION #${confessionNo}`);

    // split exact
    const parts = settings.autoSplitParts ? splitTextSmart(text, 665) : [text];

    // image generation exact
    const imageBuffers = await generateSlidesImages(parts, confessionNo);

    if (!imageBuffers || !imageBuffers.length) {
      throw new Error('Image generation failed');
    }

    // drive upload same
    const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

    if (!driveUrls || !driveUrls.length) {
      throw new Error('Drive upload failed');
    }

    // SAVE SAME AS PROPERTIES
    store.set(`images_${confessionNo}`, driveUrls);
    store.set(`text_${confessionNo}`, text);

    // EXACT APP SCRIPT CAPTION FLOW
    let aiQuestion = store.get(`aiq_${confessionNo}`);

    if (!aiQuestion) {
      try {
        aiQuestion =
          (await generateAIQuestion(text)) || generateFallbackQuestion(text);
      } catch (error) {
        console.error('AI QUESTION FAILED:', error.message);
        aiQuestion = generateFallbackQuestion(text);
      }

      store.set(`aiq_${confessionNo}`, aiQuestion);
    }

    aiQuestion = addEmotionEmoji(aiQuestion);

    const hashtags = getSmartHashtags(text);

    const caption = buildCaption(aiQuestion, confessionNo, hashtags);

    store.set(`caption_${confessionNo}`, caption);

    // EXACT STATE SAME
    store.set(`state_${confessionNo}`, 'CREATED');

    // processing time
    store.set(`processing_time_${confessionNo}`, Date.now() - startTime);

    // EXACT TELEGRAM FLOW
    if (settings.telegramPreview) {
      await sendTelegram(driveUrls, caption, confessionNo);
    }

    console.log(
      `✅ CONFESSION #${confessionNo} DONE in ${Date.now() - startTime}ms`,
    );

    return {
      success: true,
      confessionNo,
      text,
      images: driveUrls,
      caption,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('FORM SUBMIT ERROR:', error.message);

    throw error;
  }
}

module.exports = {
  processFormSubmit,
};
