const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'pending',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Confession', confessionSchema);
