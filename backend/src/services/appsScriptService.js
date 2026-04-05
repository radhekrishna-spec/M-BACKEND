const axios = require('axios');

async function submitConfession(text) {
  const res = await axios.post(process.env.APPS_SCRIPT_URL, {
    action: 'submit_confession',
    text,
  });

  return res.data;
}

async function editConfession(id, text) {
  const res = await axios.post(process.env.APPS_SCRIPT_URL, {
    action: 'edit_confession',
    id,
    text,
  });

  return res.data;
}

module.exports = {
  submitConfession,
  editConfession,
};
