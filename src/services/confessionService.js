const store = require('../store');
const { processEditQueue } = require("../workers/editQueueWorker");

async function approve(id) {
  store.props[`state_${id}`] = 'APPROVED';
  console.log(`Approved #${id}`);
}

async function reject(id) {
  store.props[`state_${id}`] = 'REJECTED';
  console.log(`Rejected #${id}`);
}

async function startEdit(id) {
  store.props.editing_active = id;
  store.props.awaiting_edit_input = true;
  console.log(`Editing started #${id}`);
}



async function confirmEdit(id) {
  const text = store.props[`pending_edit_${id}`];

  if (!text) return;

  store.props[`text_${id}`] = text;

  delete store.props[`pending_edit_${id}`];
  delete store.props.awaiting_edit_input;

  await processEditQueue();

  delete store.props.editing_active;

  console.log(`Edit confirmed #${id}`);
}

async function stopEdit(id) {
  delete store.props.editing_active;
  delete store.props.awaiting_edit_input;
  delete store.props[`pending_edit_${id}`];

  console.log(`Edit stopped #${id}`);
}

module.exports = {
  approve,
  reject,
  startEdit,
  confirmEdit,
  stopEdit,
};
