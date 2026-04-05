const store = require('../store');
const {
  buildCaption,
  generateAIQuestion,
  generateFallbackQuestion,
  addEmotionEmoji,
  getSmartHashtags,
} = require('./captionService');

async function createCaptionFlow(text, confessionNo) {
  let aiQuestion = store.get(`aiq_${confessionNo}`);

  if (!aiQuestion) {
    try {
      aiQuestion =
        (await generateAIQuestion(text)) || generateFallbackQuestion(text);
    } catch {
      aiQuestion = generateFallbackQuestion(text);
    }

    store.set(`aiq_${confessionNo}`, aiQuestion);
  }

  aiQuestion = addEmotionEmoji(aiQuestion);

  const hashtags = getSmartHashtags(text);
  const caption = buildCaption(aiQuestion, confessionNo, hashtags);

  store.set(`caption_${confessionNo}`, caption);

  return caption;
}

module.exports = {
  createCaptionFlow,
};
