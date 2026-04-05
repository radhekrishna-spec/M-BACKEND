class Store {
  constructor() {
    this.data = new Map();
    this.pendingApprovals = new Map();
    this.editQueue = [];
    this.retryQueue = [];
    this.processedIds = new Set();
  }

  // ===== OLD COMPAT STYLE =====
  get(key) {
    return this.data.get(key);
  }

  set(key, value) {
    this.data.set(key, value);
    return value;
  }

  delete(key) {
    return this.data.delete(key);
  }

  has(key) {
    return this.data.has(key);
  }

  getAll() {
    return Object.fromEntries(this.data.entries());
  }

  // ===== NEW QUEUE HELPERS =====
  setPending(id, value) {
    this.pendingApprovals.set(id, value);
  }

  getPending(id) {
    return this.pendingApprovals.get(id);
  }

  deletePending(id) {
    this.pendingApprovals.delete(id);
  }

  addToEditQueue(item) {
    let queue = this.get('EDIT_QUEUE') || [];
    queue.push(item);
    this.set('EDIT_QUEUE', queue);
  }

  getEditQueue() {
    return this.get('EDIT_QUEUE') || [];
  }

  shiftEditQueue() {
    let queue = this.get('EDIT_QUEUE') || [];
    const item = queue.shift();
    this.set('EDIT_QUEUE', queue);
    return item;
  }

  addRetry(item) {
    let queue = this.get('RETRY_QUEUE') || [];
    queue.push(item);
    this.set('RETRY_QUEUE', queue);
  }

  getRetryQueue() {
    return this.get('RETRY_QUEUE') || [];
  }

  shiftRetryQueue() {
    let queue = this.get('RETRY_QUEUE') || [];
    const item = queue.shift();
    this.set('RETRY_QUEUE', queue);
    return item;
  }

  markProcessed(id) {
    this.processedIds.add(id);
  }

  isProcessed(id) {
    return this.processedIds.has(id);
  }
}

module.exports = new Store();
