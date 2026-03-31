const store = require('../store');

async function processApprovedQueue() {
  const keys = Object.keys(store.props);

  for (const key of keys) {
    if (!key.startsWith('state_')) continue;

    const id = key.replace('state_', '');

    if (store.props[key] === 'APPROVED') {
      console.log(`Posting confession #${id}`);

      store.props[key] = 'POSTED';

      // future: instagram post call yahin add karenge
    }
  }
}

function startSchedulerWorker() {
  setInterval(async () => {
    await processApprovedQueue();
  }, 5000);
}

module.exports = {
  startSchedulerWorker,
  processApprovedQueue,
};
