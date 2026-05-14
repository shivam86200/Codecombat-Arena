const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'OPEN', 'LIVE', 'COMPLETED'],
      default: 'UPCOMING',
    },
    entryFee: {
      type: Number,
      required: true,
      default: 50,
    },
    maxParticipants: {
      type: Number,
      default: 100,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    problems: [
      {
        title: String,
        description: String,
        constraints: [String],
        inputFormat: String,
        outputFormat: String,
        sampleInput: String,
        sampleOutput: String,
        hiddenTestCases: [
          {
            input: String,
            output: String,
          }
        ]
      },
    ],
    prizePool: {
      type: Number,
      default: 0,
    },
    winners: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rank: Number,
        rewardCoins: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;
