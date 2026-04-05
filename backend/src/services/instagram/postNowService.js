const Confession = require('../../models/Confession');
const { moveFileToFolder } = require('../google/driveService');
const { postToInstagram } = require('../../modules/social/instagramService');
const { google } = require('googleapis');

exports.postNowById = async (id) => {
  try {
    if (!id) throw new Error('id is required');

    console.log(`🚀 Manual post requested for #${id}`);

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

    console.log('🔍 Searching queue image:', fileName);

    const searchRes = await drive.files.list({
      q: `name='${fileName}' and '${process.env.QUEUE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    if (!searchRes.data.files.length) {
      throw new Error(`No queue image found for confession #${id}`);
    }

    const fileId = searchRes.data.files[0].id;

    console.log('✅ Queue image found:', fileId);

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch (error) {
    console.error('❌ POST NOW ERROR:', error.response?.data || error.message);

    throw error;
  }
};
