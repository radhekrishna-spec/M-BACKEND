const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema(
  {
    confessionNo: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    caption: {
      type: String,
      default: '',
      trim: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'POSTING', 'POSTED', 'FAILED', 'REJECTED'],
      status: 'PENDING',
      index: true,
    },

    postedTime: {
      type: Date,
      default: null,
    },

    telegramMessageId: {
      type: String,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Confession', confessionSchema);
