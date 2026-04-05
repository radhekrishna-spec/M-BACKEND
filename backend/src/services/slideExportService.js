const axios = require('axios');

async function exportSlideAsPNG(authClient, presentationId, slideId) {
  const token = await authClient.getAccessToken();

  const exportUrl = `https://docs.google.com/presentation/d/${presentationId}/export/png`;

  const response = await axios.get(exportUrl, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  });

  const contentType = response.headers['content-type'];

  //console.log('🧪 SLIDE EXPORT TYPE:', contentType);

  if (!contentType || !contentType.includes('image/png')) {
    throw new Error(`Invalid export type: ${contentType}`);
  }

  const imageBuffer = Buffer.from(response.data);

  //console.log('📦 PNG SIZE:', imageBuffer.length);

  return imageBuffer;
}

module.exports = { exportSlideAsPNG };
