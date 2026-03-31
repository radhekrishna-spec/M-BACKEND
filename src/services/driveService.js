const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

const credentials = require('../../oauth-client.json');

const { client_id, client_secret, redirect_uris } =
  credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0],
);



oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function uploadImagesToDrive(buffers, confessionNo) {
  const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client,
  });

  const urls = [];

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: `c_${confessionNo}_${i + 1}.png`,
        parents: [process.env.ROOT_FOLDER_ID],
      },
      media: {
        mimeType: 'image/png',
        body: bufferStream,
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    const fileId = res.data.id;

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
      supportsAllDrives: true,
    });

    urls.push(`https://drive.google.com/uc?id=${fileId}`);
  }

  return urls;
}

module.exports = { uploadImagesToDrive };
