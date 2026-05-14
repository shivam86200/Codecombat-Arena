const Submission = require('../models/Submission');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createSubmission = catchAsync(async (req, res, next) => {
  const { code, language, problemId, tournamentId } = req.body;

  if (!code || !language || !tournamentId) {
    return next(new AppError('Code, language, and tournamentId are required.', 400));
  }

  const submission = await Submission.create({
    userId: req.userId,
    tournamentId,
    code,
    language,
    resultSummary: 'Pending'
  });

  // Future: Integrate Judge0 here to actually run the code against the hidden test cases
  
  res.status(201).json({
    status: 'success',
    data: { submission }
  });
});
