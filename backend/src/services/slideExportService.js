const axios = require('axios');

async function exportSlideAsPNG(authClient, presentationId, slideId) {
  const token = await authClient.getAccessToken();

  const exportUrl =
    `https://docs.google.com/presentation/d/${presentationId}` +
    `/export/png?pageid=${slideId}`;

  const response = await axios.get(exportUrl, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${token.token}`,
    },
  });

  return Buffer.from(response.data);
}

module.exports = { exportSlideAsPNG };
