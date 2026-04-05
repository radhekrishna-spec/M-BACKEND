const { google } = require('googleapis');
const { autoFitTextConfig } = require('./slideTextFit');
const { getGoogleAuthClient } = require('./googleAuthService');
const { exportSlideAsPNG } = require('./slideExportService');

async function createSlidePNG(text, confessionNo, partNo, totalParts) {
  const auth = getGoogleAuthClient();

  const drive = google.drive({
    version: 'v3',
    auth,
  });

  const slides = google.slides({
    version: 'v1',
    auth,
  });

  const { fontSize, lineSpacing } = autoFitTextConfig(text.length);

  const copyRes = await drive.files.copy({
    fileId: process.env.TEMPLATE_ID,
    requestBody: {
      name: `confession_${confessionNo}_part_${partNo}`,
    },
  });

  const presentationId = copyRes.data.id;

  try {
    const pres = await slides.presentations.get({
      presentationId,
    });

    const slide = pres.data.slides[0];
    const slideId = slide.objectId;

    const confessionShape = slide.pageElements.find(
      (el) =>
        el.shape &&
        el.shape.text &&
        el.shape.text.textElements?.some((te) =>
          te.textRun?.content?.includes('{{CONFESSION}}'),
        ),
    );

    if (!confessionShape) {
      throw new Error('CONFESSION textbox not found');
    }

    const confessionBoxId = confessionShape.objectId;

    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests: buildSlideRequests(
          text,
          confessionNo,
          partNo,
          totalParts,
          confessionBoxId,
          fontSize,
          lineSpacing,
        ),
      },
    });

    return await exportSlideAsPNG(auth, presentationId, slideId);
  } finally {
    // IMPORTANT CLEANUP
    await drive.files.delete({
      fileId: presentationId,
    });
  }
}

function buildSlideRequests(
  text,
  confessionNo,
  partNo,
  totalParts,
  confessionBoxId,
  fontSize,
  lineSpacing,
) {
  const footerText = totalParts > 1 ? `Part ${partNo}/${totalParts}` : '';

  return [
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
      updateTextStyle: {
        objectId: confessionBoxId,
        textRange: { type: 'ALL' },
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
        textRange: { type: 'ALL' },
        style: { lineSpacing },
        fields: 'lineSpacing',
      },
    },
  ];
}

async function generateSlidesImages(parts, confessionNo) {
  return Promise.all(
    parts.map((part, index) =>
      createSlidePNG(part, confessionNo, index + 1, parts.length),
    ),
  );
}

module.exports = { generateSlidesImages };
