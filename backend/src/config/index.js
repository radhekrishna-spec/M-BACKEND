import dotenv from 'dotenv';
dotenv.config();
export const config = {
  accessToken: process.env.ACCESS_TOKEN,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  cmdBotToken: process.env.CMD_BOT_TOKEN,

  pageName: process.env.PAGE_NAME,

  templateId: process.env.TEMPLATE_ID,
  igUserId: process.env.IG_USER_ID,

  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  cmdChatId: process.env.CMD_CHAT_ID,

  rootFolderId: process.env.ROOT_FOLDER_ID,
  queueFolderId: process.env.QUEUE_FOLDER_ID,
  postedFolderId: process.env.POSTED_FOLDER_ID,
  rejectedFolderId: process.env.REJECTED_FOLDER_ID,
  editArchiveFolderId: process.env.EDIT_ARCHIVE_FOLDER_ID,

  geminiApiKey: process.env.GEMINI_API_KEY,
  imgbbKey: process.env.IMGBB_KEY,

  safeLimit: Number(process.env.SAFE_LIMIT || 665),
};
