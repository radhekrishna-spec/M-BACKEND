const { google } = require('googleapis');
const { Readable } = require('stream');
const store = require('../../store/store');

const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
const QUEUE_FOLDER_ID = process.env.QUEUE_FOLDER_ID;
const POSTED_FOLDER_ID = process.env.POSTED_FOLDER_ID;
const REJECTED_FOLDER_ID = process.env.REJECTED_FOLDER_ID;
const EDIT_ARCHIVE_FOLDER_ID = process.env.EDIT_ARCHIVE_FOLDER_ID;

function getDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({
    version: 'v3',
    auth,
  });
}

function getDriveDirectImageUrl(fileId) {
  return `https://docs.google.com/presentation/d/${fileId}/export/png`;
}

async function uploadImagesToDrive(
  imageBuffers,
  confessionNo,
  folderType = 'queue',
) {
  const drive = getDriveClient();

  const folderMap = {
    root: ROOT_FOLDER_ID,
    queue: QUEUE_FOLDER_ID,
    posted: POSTED_FOLDER_ID,
    rejected: REJECTED_FOLDER_ID,
    edited: EDIT_ARCHIVE_FOLDER_ID,
  };

  const folderId = folderMap[folderType] || QUEUE_FOLDER_ID;

  let storedImages = [];
  let ids = store.get(`fileIds_${confessionNo}`) || [];

  for (let index = 0; index < imageBuffers.length; index++) {
    const imgName =
      imageBuffers.length === 1
        ? `c_${confessionNo}.png`
        : `c_${confessionNo}_part${index + 1}.png`;

    const stream = Readable.from(imageBuffers[index]);

    const res = await drive.files.create({
      requestBody: {
        name: imgName,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/png',
        body: stream,
      },
      fields: 'id',
    });

    const fileId = res.data.id;

    ids.push(fileId);
    storedImages.push(getDriveDirectImageUrl(fileId));
  }

  store.set(`fileIds_${confessionNo}`, ids);

  return storedImages;
}

async function moveFileToFolder(fileId, folderType) {
  const drive = getDriveClient();

  const folderMap = {
    root: ROOT_FOLDER_ID,
    queue: QUEUE_FOLDER_ID,
    posted: POSTED_FOLDER_ID,
    rejected: REJECTED_FOLDER_ID,
    edited: EDIT_ARCHIVE_FOLDER_ID,
  };

  const targetFolderId = folderMap[folderType];

  const file = await drive.files.get({
    fileId,
    fields: 'parents',
  });

  const previousParents = file.data.parents.join(',');

  await drive.files.update({
    fileId,
    addParents: targetFolderId,
    removeParents: previousParents,
    fields: 'id, parents',
  });

  console.log(`✅ File moved to ${folderType}`);
}

module.exports = {
  uploadImagesToDrive,
  moveFileToFolder,
  getDriveDirectImageUrl,
};
