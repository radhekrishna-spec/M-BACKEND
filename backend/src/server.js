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
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const { startWorkers } = require('./workers/index');

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
app.use('/api/admin', adminRoutes);

async function startServer() {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on ${PORT}`);

    setTimeout(() => {
      startWorkers();
      console.log('✅ All workers started');
    }, 10000);
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

// process level errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED:', err);
});
