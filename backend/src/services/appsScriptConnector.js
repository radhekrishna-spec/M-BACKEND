const axios = require('axios');

const WEBHOOK_URL = process.env.APPS_SCRIPT_WEBHOOK_URL;

async function sendToAppsScript(text) {
  const payload = {
    response: {
      getItemResponses: () => [],
    },
    text,
  };

  const res = await axios.post(
    WEBHOOK_URL,
    {
      source: 'node_server',
      text,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  return res.data;
}

module.exports = { sendToAppsScript };
