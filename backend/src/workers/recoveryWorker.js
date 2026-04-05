const store = require('../store');
const { updateTelegramButtons } = require('../services/telegramUpdateService');

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// EXACT SAME DEADLOCK BREAK + SAFE
function breakDeadLocks() {
  const all = store.getAll() || {};

  for (const key in all) {
    // stuck posting lock
    if (key.startsWith('posting_')) {
      const id = key.replace('posting_', '');

      const posted = store.get(`state_${id}`) === 'POSTED';

      if (!posted) {
        console.log(`🔓 Breaking posting lock for #${id}`);
        store.delete(key);
      }
    }

    // stuck edit worker
    if (key === 'EDIT_WORKING') {
      const queue = store.get('EDIT_QUEUE') || [];

      if (!queue.length) {
        console.log('🔓 Clearing stuck EDIT_WORKING');
        store.delete('EDIT_WORKING');
      }
    }

    // telegram stuck lock
    if (key.startsWith('telegram_sending_')) {
      const id = key.replace('telegram_sending_', '');

      const sent = store.get(`telegram_sent_${id}`);

      if (!sent) {
        console.log(`🔓 Clearing TG lock for #${id}`);
        store.delete(key);
      }
    }
  }
}

// EXACT SAME QUEUE HEAL + IMPROVED
function healQueueSystem() {
  const all = store.getAll() || {};

  for (const key in all) {
    if (key.startsWith('state_')) {
      const id = key.replace('state_', '');

      const state = all[key];

      // approved but no images -> fail safe
      if (state === 'APPROVED') {
        const images = store.get(`images_${id}`) || [];

        if (!images.length) {
          console.log(`⚠️ Healing failed state #${id}`);
          store.set(`state_${id}`, 'FAILED');
        }
      }

      // created but no telegram sent
      if (state === 'CREATED') {
        const sent = store.get(`telegram_sent_${id}`);

        if (!sent) {
          store.set(`state_${id}`, 'RETRY_PENDING');
        }
      }
    }
  }
}

// EXACT SAME BUTTON RESTORE + SAFE
async function restoreAllTelegramButtons() {
  const all = store.getAll() || {};

  for (const key in all) {
    if (!key.startsWith('telegram_msg_')) {
      continue;
    }

    const confessionNo = key.replace('telegram_msg_', '');

    const messageId = all[key];

    const state = store.get(`state_${confessionNo}`);

    let status = 'default';

    if (state === 'APPROVED') {
      status = 'approved';
    } else if (state === 'REJECTED') {
      status = 'rejected';
    } else if (state === 'POSTED') {
      status = 'posted';
    }

    try {
      await updateTelegramButtons(CHAT_ID, messageId, status, confessionNo);
    } catch (error) {
      console.error(`BUTTON RESTORE FAIL #${confessionNo}`, error.message);
    }
  }
}

// AUTO RECOVERY LOOP
function startRecoveryWorker() {
  console.log('Recovery worker started...');

  setInterval(async () => {
    try {
      breakDeadLocks();
      healQueueSystem();
      await restoreAllTelegramButtons();
    } catch (error) {
      console.error('RECOVERY WORKER ERROR:', error.message);
    }
  }, 300000); // every 5 min
}

module.exports = {
  breakDeadLocks,
  healQueueSystem,
  restoreAllTelegramButtons,
  startRecoveryWorker,
};
