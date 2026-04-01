const axios = require('axios');
const { google } = require('googleapis');
const { autoFitTextConfig } = require('./autoFitTextConfig');
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri,
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function createSlidePNG(text, confessionNo, partNo, totalParts) {
  const { fontSize, lineSpacing } = autoFitTextConfig(text.length);
  const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client,
  });

  const slides = google.slides({
    version: 'v1',
    auth: oAuth2Client,
  });

  const templateId = process.env.TEMPLATE_ID;

  const copyRes = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: `confession_${confessionNo}_part_${partNo}`,
    },
  });

  const presentationId = copyRes.data.id;

  const pres = await slides.presentations.get({
    presentationId,
  });

  const confessionShape = pres.data.slides[0].pageElements.find(
    (el) =>
      el.shape &&
      el.shape.text &&
      el.shape.text.textElements?.some((te) =>
        te.textRun?.content?.includes('{{CONFESSION}}'),
      ),
  );
  if (!confessionShape) {
    throw new Error('CONFESSION textbox not found in template');
  }
  const confessionBoxId = confessionShape.objectId;

  const slideId = pres.data.slides[0].objectId;
  const footerText = totalParts > 1 ? `Part ${partNo}/${totalParts}` : '';

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests: [
        {
          replaceAllText: {
            containsText: {
              text: '{{CONFESSION}}',
              matchCase: true,
            },
            replaceText: text,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '{{FOOTER}}',
              matchCase: true,
            },
            replaceText: footerText,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '{{ID_PLACEHOLDER}}',
              matchCase: true,
            },
            replaceText: `Confession #${confessionNo}`,
          },
        },
        {
          replaceAllText: {
            containsText: {
              text: '{{WATERMARK}}',
              matchCase: true,
            },
            replaceText: '@miet_k_dilwale_confession_wale',
          },
        },
        {
          updateTextStyle: {
            objectId: confessionBoxId,
            textRange: {
              type: 'ALL',
            },
            style: {
              fontSize: {
                magnitude: fontSize,
                unit: 'PT',
              },
            },
            fields: 'fontSize',
          },
        },
        {
          updateParagraphStyle: {
            objectId: confessionBoxId,
            textRange: {
              type: 'ALL',
            },
            style: {
              lineSpacing,
            },
            fields: 'lineSpacing',
          },
        },
      ],
    },
  });

  const token = await oAuth2Client.getAccessToken();

  const exportUrl = `https://docs.google.com/presentation/d/${presentationId}/export/png?pageid=${slideId}`;

  const response = await axios.get(exportUrl, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  });

  return Buffer.from(response.data);
}

async function generateSlidesImages(parts, confessionNo) {
  const images = [];

  for (let i = 0; i < parts.length; i++) {
    const buffer = await createSlidePNG(
      parts[i],
      confessionNo,
      i + 1,
      parts.length,
    );
    images.push(buffer);
  }

  return images;
}

module.exports = { generateSlidesImages };
