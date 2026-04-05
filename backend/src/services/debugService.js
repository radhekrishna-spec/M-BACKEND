const store = require('../store');
function healthCheck(){
  return {
    ok:true,
    queue: store.editQueue.length,
    activeEdit: store.props.editing_active || null,
    totalKeys: Object.keys(store.props).length
  };
}
function apocalypseReset(){
  store.props = {};
  store.editQueue = [];
  store.postQueue = [];
  store.history = {};
  return { reset:true };
}
module.exports={ healthCheck, apocalypseReset };