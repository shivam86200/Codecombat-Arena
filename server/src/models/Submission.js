const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      default: 'javascript',
    },
    resultSummary: {
      type: String,
      default: 'Pending', // e.g., 'Passed', 'Failed', 'Timeout'
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Indexing for faster lookups
submissionSchema.index({ matchId: 1, userId: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
