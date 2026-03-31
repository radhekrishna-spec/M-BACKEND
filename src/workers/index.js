const { startEditQueueWorker } = require('./editQueueWorker');
const { startSchedulerWorker } = require('./schedulerWorker');

function startWorkers() {
  startEditQueueWorker();
  startSchedulerWorker();
}

module.exports = { startWorkers };
