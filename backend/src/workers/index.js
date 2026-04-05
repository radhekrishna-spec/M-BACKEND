const { startTelegramPoller } = require('./telegramPoller');

const {
  startEditQueueWorker,
} = require('../modules/confession/workers/editQueueWorker');

const { startSchedulerWorker } = require('./schedulerWorker');
const { startRecoveryWorker } = require('./recoveryWorker');

let pollerStarted = false;

function startWorkers() {
  if (pollerStarted) {
    //console.log('⚠️ Poller already running');
    return;
  }

  pollerStarted = true;

  startTelegramPoller();
  startEditQueueWorker();
  startSchedulerWorker();
  startRecoveryWorker();
}

module.exports = {
  startWorkers,
};
