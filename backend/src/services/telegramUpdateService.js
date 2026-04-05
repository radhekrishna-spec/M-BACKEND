const axios = require('axios');
const store = require('../store');
const { sendTelegramMessage } = require('./telegramService');
const { addToEditQueue } = require('../workers/editQueueWorker');
const { processFormSubmit } = require('./formSubmitService');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// EXACT SAME BUTTON UPDATE FLOW + SAFE

const { splitTextSmart } = require('./splitText');
const { generateSlidesImages } = require('./slidesService');
const { uploadImagesToDrive } = require('./driveService');

async function confirmEdit(chatId, confessionNo, text) {
  try {
    await sendTelegramMessage(
      chatId,
      `🛠 Creating preview for #${confessionNo}...`,
    );

    store.set(`pending_edit_text_${confessionNo}`, text);

    const parts = splitTextSmart(text, 665);

    const imageBuffers = await generateSlidesImages(parts, confessionNo);

    const driveUrls = await uploadImagesToDrive(imageBuffers, confessionNo);

    store.set(`preview_images_${confessionNo}`, driveUrls);

    // send preview image only
    await axios.post(`${BASE_URL}/sendPhoto`, {
      chat_id: chatId,
      photo: driveUrls[0],
      caption: `👀 Preview for #${confessionNo}`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'CONFIRM ✅',
              callback_data: `confirmpreview_${confessionNo}`,
            },
            {
              text: 'RE-EDIT ✏️',
              callback_data: `reedit_${confessionNo}`,
            },
          ],
        ],
      },
    });

    store.delete('awaiting_edit_input');
    store.delete('editing_active');
    store.delete('editing_chat');
    store.delete('editing_time');
  } catch (error) {
    console.error('CONFIRM EDIT ERROR:', error.message);
  }
}
async function updateTelegramButtons(chatId, messageId, status, confessionNo) {
  if (!messageId) return;

  let keyboard;

  if (status === 'approved') {
    keyboard = {
      inline_keyboard: [
        [
          {
            text: 'EDIT ✏️',
            callback_data: `edit_${confessionNo}`,
          },
          {
            text: 'REJECT ❌',
            callback_data: `reject_${confessionNo}`,
          },
        ],
        [
          {
            text: 'SEE MORE ⚙️',
            callback_data: `more_${confessionNo}`,
          },
        ],
      ],
    };
  } else if (status === 'rejected') {
    keyboard = {
      inline_keyboard: [
        [
          {
            text: 'APPROVE ✅',
            callback_data: `approve_${confessionNo}`,
          },
          {
            text: 'EDIT ✏️',
            callback_data: `edit_${confessionNo}`,
          },
        ],
        [
          {
            text: 'SEE MORE ⚙️',
            callback_data: `more_${confessionNo}`,
          },
        ],
      ],
    };
  } else if (status === 'editing') {
    keyboard = {
      inline_keyboard: [
        [
          {
            text: 'STOP EDITING ❌',
            callback_data: `stopedit_${confessionNo}`,
          },
        ],
      ],
    };
  } else {
    keyboard = {
      inline_keyboard: [
        [
          {
            text: 'APPROVE ✅',
            callback_data: `approve_${confessionNo}`,
          },
          {
            text: 'REJECT ❌',
            callback_data: `reject_${confessionNo}`,
          },
          {
            text: 'SEE MORE ⚙️',
            callback_data: `more_${confessionNo}`,
          },
        ],
      ],
    };
  }

  try {
    await axios.post(
      `${BASE_URL}/editMessageReplyMarkup`,
      {
        chat_id: chatId,
        message_id: Number(messageId),
        reply_markup: keyboard,
      },
      {
        timeout: 10000,
      },
    );
  } catch (error) {
    const err = error.response?.data;

    if (err?.description?.includes('message is not modified')) {
      console.log('⚠️ Same buttons already applied');
      return;
    }

    console.error('BUTTON UPDATE ERROR:', err || error.message);
  }
}

// EXACT SAME APPROVE FLOW + DUP SAFE
async function approveConfession(chatId, messageId, confessionNo) {
  if (store.get(`state_${confessionNo}`) === 'APPROVED') {
    await sendTelegramMessage(chatId, '⚠️ Already approved');
    return;
  }

  store.set(`status_${confessionNo}`, 'approved');
  store.set(`state_${confessionNo}`, 'APPROVED');
  store.set(`approved_time_${confessionNo}`, Date.now());

  const tgMsgId = store.get(`telegram_msg_${confessionNo}`);

  await updateTelegramButtons(CHAT_ID, tgMsgId, 'approved', confessionNo);

  await sendTelegramMessage(chatId, `✅ Confession #${confessionNo} approved`);
}

// EXACT SAME REJECT FLOW + SAFE
async function rejectConfession(chatId, messageId, confessionNo) {
  if (store.get(`state_${confessionNo}`) === 'REJECTED') {
    await sendTelegramMessage(chatId, '⚠️ Already rejected');
    return;
  }

  store.set(`status_${confessionNo}`, 'rejected');
  store.set(`state_${confessionNo}`, 'REJECTED');
  store.set(`rejected_time_${confessionNo}`, Date.now());

  await updateTelegramButtons(chatId, messageId, 'rejected', confessionNo);

  await sendTelegramMessage(chatId, `❌ Confession #${confessionNo} rejected`);
}

// EXACT SAME EDIT START FLOW + TIMEOUT
async function startEditMode(chatId, messageId, confessionNo) {
  const oldText = store.get(`text_${confessionNo}`);

  if (!oldText) {
    await sendTelegramMessage(
      chatId,
      `❌ Original text not found for #${confessionNo}`,
    );
    return;
  }

  store.set('editing_active', confessionNo);
  store.set('editing_chat', chatId);
  store.set('editing_time', Date.now());
  store.set('awaiting_edit_input', '1');

  await updateTelegramButtons(chatId, messageId, 'editing', confessionNo);

  await sendTelegramMessage(
    chatId,
    `✏️ Editing #${confessionNo}\n\n📌 Current text:\n${oldText}\n\nSend new edited text now.`,
  );
}

module.exports = {
  approveConfession,
  rejectConfession,
  startEditMode,
  updateTelegramButtons,
  confirmEdit,
};
