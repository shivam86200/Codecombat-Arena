const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED'],
      default: 'PENDING',
    },
    problemId: {
      type: String,
      required: [true, 'A match must have a problemId'],
    },
    aiVerdictWinnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aiVerdictReason: {
      type: String,
      default: '',
    },
    aiScoreA: {
      type: Number,
      default: 0,
    },
    aiScoreB: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for submissions (optional but helpful)
matchSchema.virtual('submissions', {
  ref: 'Submission',
  foreignField: 'matchId',
  localField: '_id',
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
