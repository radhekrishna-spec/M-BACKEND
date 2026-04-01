const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../config/runtimeSettings.json');

function getSettings() {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function updateSettings(newSettings) {
  fs.writeFileSync(filePath, JSON.stringify(newSettings, null, 2));
  return newSettings;
}

module.exports = {
  getSettings,
  updateSettings,
};
