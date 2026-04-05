const axios = require('axios');
const store = require('../store/store');

const {
  approveConfession,
  rejectConfession,
  startEditMode,
  confirmEdit,
  updateTelegramButtons,
} = require('../services/telegramUpdateService');

const {
  processFormSubmit,
} = require('../modules/confession/formSubmitService');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let lastUpdateId = 0;
let isPolling = false;
const processedCallbacks = new Map();

// cleanup old callback ids
function cleanupProcessedCallbacks() {
  const now = Date.now();

  for (const [id, time] of processedCallbacks.entries()) {
    if (now - time > 5 * 60 * 1000) {
      processedCallbacks.delete(id);
    }
  }
}

async function answerCallback(cbId, text = 'Done ✅') {
  try {
    await axios.post(
      `${BASE_URL}/answerCallbackQuery`,
      {
        callback_query_id: cbId,
        text,
        show_alert: false,
      },
      {
        timeout: 10000,
      },
    );
  } catch (error) {
    console.error(
      'CALLBACK ANSWER ERROR:',
      error.response?.data || error.message,
    );
  }
}

async function pollTelegramUpdates() {
  //console.log('📡 polling with offset:', lastUpdateId + 1);
  if (isPolling) return;

  isPolling = true;

  try {
    cleanupProcessedCallbacks();

    const res = await axios.get(`${BASE_URL}/getUpdates`, {
      params: {
        offset: lastUpdateId + 1,
        timeout: 50,
      },
      timeout: 60000,
    });

    const updates = res.data?.result || [];

    for (const update of updates) {
     // console.log('📩 FULL UPDATE:', JSON.stringify(update, null, 2));

      if (update.callback_query) {
       // console.log('🟢 CALLBACK RECEIVED');
       // console.log('🟢 DATA:', update.callback_query.data);
       // console.log('🟢 CHAT ID:', update.callback_query.message?.chat?.id);
        //console.log('🟢 MSG ID:', update.callback_query.message?.message_id);
      }
      lastUpdateId = update.update_id;

      // ===============================
      // HANDLE NORMAL TEXT FOR EDIT FLOW
      // ===============================
      if (update.message?.text) {
        const text = update.message.text.trim();
        const chatId = update.message.chat.id;

        const activeEditId = store.get('editing_active');
        const awaitingEdit = store.get('awaiting_edit_input');
        const editingChat = store.get('editing_chat');

        if (
          awaitingEdit === '1' &&
          activeEditId &&
          String(editingChat) === String(chatId)
        ) {
          //console.log(`✏️ Edit text received for #${activeEditId}`);

          await confirmEdit(chatId, activeEditId, text);

          continue;
        }
      }

      // only callback after text check
      if (!update.callback_query) continue;

      const cb = update.callback_query;
      const cbId = cb.id;

      // duplicate callback protection
      if (processedCallbacks.has(cbId)) {
        continue;
      }

      processedCallbacks.set(cbId, Date.now());

      const data = cb.data;
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;

      try {
        if (data.startsWith('approve_')) {
          const id = data.replace('approve_', '');

          await approveConfession(chatId, messageId, id);

          await answerCallback(cbId, 'Approved ✅');
        } else if (data.startsWith('stopedit_')) {
          const id = data.replace('stopedit_', '');

          store.delete('awaiting_edit_input');
          store.delete('editing_active');
          store.delete('editing_chat');
          store.delete('editing_time');

          const tgMsgId = store.get(`telegram_msg_${id}`);

          await updateTelegramButtons(chatId, tgMsgId, 'default', id);

          await answerCallback(cbId, 'Editing stopped ❌');
        } else if (data.startsWith('reedit_')) {
          const id = data.replace('reedit_', '');

          store.set('editing_active', id);
          store.set('editing_chat', chatId);
          store.set('awaiting_edit_input', '1');

          await answerCallback(cbId, 'Edit again ✏️');
        } else if (data.startsWith('confirmpreview_')) {
          const id = data.replace('confirmpreview_', '');

          const text = store.get(`pending_edit_text_${id}`);

          await processFormSubmit({ confession: text }, id);

          const tgMsgId = store.get(`telegram_msg_${id}`);

          await updateTelegramButtons(chatId, tgMsgId, 'default', id);

          await answerCallback(cbId, 'Confirmed ✅');
        } else if (data.startsWith('reject_')) {
          const id = data.replace('reject_', '');

          await rejectConfession(chatId, messageId, id);

          await answerCallback(cbId, 'Rejected ❌');
        } else if (data.startsWith('edit_')) {
          const id = data.replace('edit_', '');

          await startEditMode(chatId, messageId, id);

          await answerCallback(cbId, 'Edit mode ✏️');
        } else if (data.startsWith('more_')) {
          await answerCallback(cbId, 'More options ⚙️');
        }
      } catch (callbackError) {
        console.error('CALLBACK PROCESS ERROR:', callbackError.message);

        await answerCallback(cbId, 'Failed ❌');
      }
    }
  } catch (error) {
    const err = error.response?.data || error.message;

    console.error('POLL ERROR:', err);

    if (error.response?.data?.error_code === 409) {
      //console.log('⚠️ Conflict detected, waiting before retry...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return;
    }
  } finally {
    isPolling = false;
  }
}

let pollerStarted = false;


function startTelegramPoller() {
  //console.log('🚀 startTelegramPoller called at:', new Date().toISOString());
  console.trace('📍 POLLER START TRACE');

  if (pollerStarted) {
    //console.log('⚠️ Poller already started');
    return;
  }

  pollerStarted = true;

  //console.log('✅ Telegram poller actually started');

  const pollLoop = async () => {
    try {
      await pollTelegramUpdates();
    } catch (error) {
      console.error('POLL LOOP ERROR:', error.message);
    } finally {
      setTimeout(pollLoop, 3000);
    }
  };

  pollLoop();
}

module.exports = {
  startTelegramPoller,
};
