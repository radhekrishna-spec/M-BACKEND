const Confession = require('../models/Confession');
const { moveFileToFolder } = require('./driveService');
const { postToInstagram } = require('./instagramService');
const { google } = require('googleapis');

exports.postNowById = async (id) => {
  if (!id) throw new Error('id is required');

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({
    version: 'v3',
    auth,
  });

  const fileName = `c_${id}.png`;

  const searchRes = await drive.files.list({
    q: `name='${fileName}' and '${process.env.QUEUE_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)',
  });

  if (!searchRes.data.files.length) {
    throw new Error(`No queue image found for confession #${id}`);
  }

  const fileId = searchRes.data.files[0].id;

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

  const confession = await Confession.findOne({
    confessionNo: id,
  });

  const caption = confession?.message || `Confession #${id}`;

  await postToInstagram([imageUrl], caption);

  await moveFileToFolder(fileId, 'posted');

  await Confession.findOneAndUpdate({ confessionNo: id }, { status: 'posted' });

  return {
    message: `Confession #${id} posted successfully`,
  };
};
