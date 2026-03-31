require("dotenv").config();
const express = require('express');
const { startWorkers } = require('./workers');


const submitRoutes = require('./routes/submitRoutes');

const app = express();

app.use(express.json());

app.use('/', submitRoutes);

startWorkers();

app.listen(3000, () => {
  console.log('server running on 3000');
});
