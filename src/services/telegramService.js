const axios = require('axios');

async function sendTelegram(images, caption, confessionNo) {
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  console.log('FINAL URL:', url);

  await axios.post(url, {
    chat_id: chatId,
    text: `Test confession #${confessionNo}\n${caption}`,
  });
}

module.exports = { sendTelegram };
