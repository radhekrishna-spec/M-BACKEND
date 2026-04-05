require('dotenv').config({ path: '../.env' });
const connectDB = require('./config/db');
const {
  createManualConfession,
} = require('./services/manualConfessionService');

async function run() {
  await connectDB();

  await createManualConfession('Bhaiiiii mujhe usse pyaar hai ❤️');

  process.exit();
}

run();
