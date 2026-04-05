const appsScriptService = require('./appsScriptService');

async function handleSubmit(text) {
  return await appsScriptService.submitConfession(text);
}

module.exports = {
  handleSubmit,
};
