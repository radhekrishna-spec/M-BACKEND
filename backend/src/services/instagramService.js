const axios = require('axios');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;

async function postSingleImage(imageUrl, caption) {
  const container = await axios.post(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
    null,
    {
      params: {
        image_url: imageUrl,
        caption,
        access_token: ACCESS_TOKEN,
      },
    },
  );

  const creationId = container.data.id;

  if (!creationId) {
    throw new Error('Single image container create failed');
  }

  await axios.post(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
    null,
    {
      params: {
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      },
    },
  );

  return true;
}

async function postCarousel(images, caption) {
  const children = [];

  for (const url of images) {
    console.log('INSTAGRAM URL RECEIVED:', url);

    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
      null,
      {
        params: {
          image_url: url,
          is_carousel_item: true,
          access_token: ACCESS_TOKEN,
        },
      },
    );

    const id = res.data.id;

    if (!id) {
      throw new Error('Child media create failed');
    }

    children.push(id);
  }

  await new Promise((r) => setTimeout(r, 15000));

  const carousel = await axios.post(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
    null,
    {
      params: {
        children: children.join(','),
        caption,
        media_type: 'CAROUSEL',
        access_token: ACCESS_TOKEN,
      },
    },
  );

  const creationId = carousel.data.id;

  if (!creationId) {
    throw new Error('Carousel create failed');
  }

  await axios.post(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
    null,
    {
      params: {
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      },
    },
  );

  return true;
}

// AUTO DECISION FUNCTION
async function postToInstagram(images, caption) {
  if (!images || !images.length) {
    throw new Error('No images provided');
  }

  if (images.length === 1) {
    return await postSingleImage(images[0], caption);
  }

  return await postCarousel(images, caption);
}

module.exports = {
  postSingleImage,
  postCarousel,
  postToInstagram,
};
