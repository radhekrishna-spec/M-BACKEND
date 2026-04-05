const axios = require('axios');
const store = require('../store');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// reusable safe delay
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// EXACT SAME AS APPSCRIPT + UPGRADED
async function sendTelegram(images, caption, confessionNo, isEdit = false) {
  if (store.get(`telegram_sending_${confessionNo}`)) return;

  store.set(`telegram_sending_${confessionNo}`, '1');

  try {
    const chunkSize = 10;
    const sentMessageIds = [];

    for (let i = 0; i < images.length; i += chunkSize) {
      const chunk = images.slice(i, i + chunkSize);

      const media = chunk.map((img, idx) => ({
        type: 'photo',
        media: img,
        caption: i === 0 && idx === 0 ? caption : undefined,
      }));

      const mediaRes = await axios.post(
        `${BASE_URL}/sendMediaGroup`,
        {
          chat_id: CHAT_ID,
          media,
        },
        {
          timeout: 20000,
        },
      );

      const results = mediaRes.data?.result || [];

      results.forEach((msg) => {
        if (msg?.message_id) {
          sentMessageIds.push(msg.message_id);
        }
      });

      await sleep(1200);
    }

    // button message only if new confession
    const res = await axios.post(
      `${BASE_URL}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: `Confession #${confessionNo} Approval`,
        reply_markup: {
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
        },
      },
      {
        timeout: 15000,
      },
    );

    const messageId = res.data?.result?.message_id;

    store.set(`telegram_msg_${confessionNo}`, messageId);

    store.set(`telegram_media_msgs_${confessionNo}`, sentMessageIds);
    store.set(`telegram_sent_${confessionNo}`, 'yes');

    console.log(`✅ Telegram sent for #${confessionNo}`);
  } finally {
    store.delete(`telegram_sending_${confessionNo}`);
  }
}

// SAME SIMPLE TEXT MESSAGE
async function sendTelegramMessage(chatId, text) {
  try {
    return await axios.post(
      `${BASE_URL}/sendMessage`,
      {
        chat_id: chatId,
        text,
      },
      {
        timeout: 10000,
      },
    );
  } catch (error) {
    console.error('TG TEXT SEND FAIL:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendTelegram,
  sendTelegramMessage,
};
