require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');

const confessionRoutes = require('./routes/confessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const submitRoutes = require('./routes/submitRoutes');
const settingsRoutes = require('./routes/settingsRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

// logs folder
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), {
  flags: 'a',
});

// middlewares
app.use(cors());
app.use(helmet());
app.use(compression());


app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

//health
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/confessions', confessionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/', submitRoutes);
app.use('/api', settingsRoutes);

async function startServer() {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on ${PORT}`);
    startWorkersSafely();
  });
}

startServer();






// error handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal error',
  });
});

// SAFE WORKER STARTUP
function startWorkersSafely() {
  try {
    const { startTelegramPoller } = require('./workers/telegramPoller');

    const { startSchedulerWorker } = require('./workers/schedulerWorker');

    const { startRecoveryWorker } = require('./workers/recoveryWorker');

    const { startEditQueueWorker } = require('./modules/confession//workers/editQueueWorker');

    startTelegramPoller();
    startSchedulerWorker();
    startRecoveryWorker();
    startEditQueueWorker();

    console.log('✅ All workers started');
  } catch (error) {
    console.error('WORKER STARTUP ERROR:', error.message);
  }
}

// process level errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED:', err);
});
