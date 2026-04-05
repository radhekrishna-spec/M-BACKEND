const store = require('../store');

function checkDuplicate(text) {
  const lastText = store.get('LAST_PROCESSED_TEXT');
  const lastTime = store.get('LAST_PROCESSED_TIME');

  if (lastText === text && lastTime && Date.now() - lastTime < 30000) {
    throw new Error('Duplicate confession blocked');
  }

  store.set('LAST_PROCESSED_TEXT', text);
  store.set('LAST_PROCESSED_TIME', Date.now());
}

module.exports = {
  checkDuplicate,
};
