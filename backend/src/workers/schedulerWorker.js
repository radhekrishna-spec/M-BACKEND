const store = require('../store/store');
const Confession = require('../models/Confession');
const { moveFileToFolder } = require('../services//google/driveService');
const { updateTelegramButtons } = require('../services/telegramUpdateService');
const { postToInstagram } = require('../modules/social/instagramService');

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Dynamic timing based on approved queue count

function getPostTimes(queueCount) {
  let baseHours = [];

  if (queueCount <= 3) {
    baseHours = [9, 15, 21];
  } else if (queueCount <= 6) {
    baseHours = [9, 12, 14, 17, 20, 23];
  } else {
    baseHours = [7, 9, 11, 13, 15, 17, 19, 21, 23];
  }

  return baseHours;
}

function getRandomMinuteForHour(dateKey, hour) {
  const key = `RANDOM_MINUTE_${dateKey}_${hour}`;

  let minute = store.get(key);

  if (minute === undefined || minute === null) {
    minute = Math.floor(Math.random() * 12) + 1; // 1 to 12
    store.set(key, minute);
  }

  return minute;
}

// count approved queue
async function getApprovedQueueCount() {
  return await Confession.countDocuments({
    status: 'APPROVED',
  });
}

// new time based posting logic
async function shouldPostNow() {
  const now = new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
    }),
  );

  if (now.getMinutes() % 20 === 0) {
    return true;
  }
  return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  console.log('⏰ SCHEDULER CHECK RUNNING');
  console.log('🕒 CURRENT TIME:', now.toLocaleTimeString());

  const queueCount = await getApprovedQueueCount();

  if (!queueCount) return false;

  const postHours = getPostTimes(queueCount);

  if (!postHours.includes(currentHour)) {
    return false;
  }

  const todayKey = now.toDateString();

  const randomMinute = getRandomMinuteForHour(todayKey, currentHour);

  // allow only 2 min window
  if (currentMinute < randomMinute || currentMinute > randomMinute + 1) {
    return false;
  }

  const slotKey = `LAST_POST_SLOT_${todayKey}_${currentHour}`;

  if (store.get(slotKey)) {
    return false;
  }

  store.set(slotKey, '1');

  console.log(`✅ Slot matched: ${currentHour}:${randomMinute}`);

  return true;
}

//   if (currentMinute % 2 !== 0) {
//     return false;
//   }

//   return true;
// }

// FIFO approved confession
async function getNextApprovedConfession() {
  return await Confession.findOne({
    status: 'APPROVED',
  }).sort({ confessionNo: 1 });
}

// post flow
async function processApprovedQueue() {
  //console.log('🧾 STORE DATA:', store.getAll());

  const confession = await getNextApprovedConfession();

  //console.log('🧾 NEXT APPROVED CONFESSION:', confession);

  if (!confession) {
    //console.log('❌ no approved confession');
    return {
      success: false,
      message: 'No approved confession',
    };
  }
  const confessionNo = confession.confessionNo;
  const images = confession.images || [];
  const caption = confession.caption || '';

  //console.log('🖼 images:', images);
  //console.log('📝 caption:', caption);

  if (!confessionNo) {
    return {
      success: false,
      message: 'No approved confession',
    };
  }

  if (!images.length) {
    await Confession.updateOne(
      { confessionNo },
      {
        status: 'FAILED',
        failureReason: 'No images found',
      },
    );

    store.set(`state_${confessionNo}`, 'FAILED');

    console.log(`❌ #${confessionNo} marked FAILED`);

    return {
      success: false,
      message: 'No images found',
    };
  }

  try {
    store.set(`posting_${confessionNo}`, '1');
    await Confession.updateOne({ confessionNo }, { status: 'POSTING' });
    // console.log('📤 INSTAGRAM IMAGE URL:', images[0]);
    // console.log('📝 INSTAGRAM CAPTION:', caption);

    const axios = require('axios');

    try {
      const testRes = await axios.get(images[0], {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 5,
      });

      // console.log('🧪 IMAGE FETCH STATUS:', testRes.status);
      // console.log('🧪 IMAGE CONTENT TYPE:', testRes.headers['content-type']);
      // console.log('🧪 IMAGE SIZE:', testRes.data.length);
    } catch (e) {
      console.error('❌ IMAGE URL TEST FAIL:', e.response?.data || e.message);
    }

    await postToInstagram(images, caption);

    const fileIds = store.get(`fileIds_${confessionNo}`) || [];

    for (const fileId of fileIds) {
      await moveFileToFolder(fileId, 'posted');
    }
    await Confession.updateOne(
      { confessionNo },
      {
        status: 'POSTED',
        postedTime: new Date(),
      },
    );

    store.delete(`images_${confessionNo}`);
    store.delete(`caption_${confessionNo}`);
    store.set(`posted_time_${confessionNo}`, Date.now());

    const tgMsgId = store.get(`telegram_msg_${confessionNo}`);

    await updateTelegramButtons(CHAT_ID, tgMsgId, 'posted', confessionNo);

    //console.log(`🚀 Posted confession #${confessionNo}`);
    return {
      success: true,
      confessionNo,
      message: `Confession #${confessionNo} posted successfully`,
    };
  } catch (error) {
    console.error('❌ POST FAIL FULL:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    await Confession.updateOne(
      { confessionNo },
      {
        status: 'FAILED',
        failureReason: error.message,
      },
    );

    return {
      success: false,
      confessionNo,
      message: error.response?.data || error.message,
    };
  } finally {
    store.delete(`posting_${confessionNo}`);
  }
}

// worker
async function startSchedulerWorker() {
  //console.log('Scheduler worker started...');

  setInterval(async () => {
    console.log('🔁 Scheduler interval tick');

    try {
      const next = await getNextApprovedConfession();
      console.log('📦 NEXT APPROVED:', next?.confessionNo);
      if (next && (await shouldPostNow())) {
        await processApprovedQueue();
      }
    } catch (error) {
      console.error('SCHEDULER ERROR:', error.message);
    }
  }, 60000);
}

module.exports = {
  shouldPostNow,
  processApprovedQueue,
  startSchedulerWorker,
};
