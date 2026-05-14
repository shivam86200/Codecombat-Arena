const Tournament = require('../models/Tournament');
const Submission = require('../models/Submission');
const walletService = require('../services/walletService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getAllTournaments = catchAsync(async (req, res, next) => {
  const tournaments = await Tournament.find().sort({ createdAt: -1 });

  // Dynamically update status based on time
  const now = new Date();
  for (let t of tournaments) {
    if (t.startTime && t.endTime) {
      if (now < t.startTime) t.status = 'UPCOMING';
      else if (now >= t.startTime && now <= t.endTime) t.status = 'LIVE';
      else t.status = 'COMPLETED';
      await t.save();
    }
  }

  res.status(200).json({ status: 'success', data: { tournaments } });
});

exports.getCurrentTournament = catchAsync(async (req, res, next) => {
  // Still provided for backward compatibility but we can just return one active tournament
  const tournament = await Tournament.findOne({ status: { $in: ['OPEN', 'LIVE', 'UPCOMING'] } }).sort({ createdAt: -1 });
  if (!tournament) return next(new AppError('No active tournament found.', 404));
  res.status(200).json({ status: 'success', data: { tournament } });
});

exports.getTournamentById = catchAsync(async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id).populate('participants', 'username rank');
  if (!tournament) return next(new AppError('Tournament not found', 404));

  const now = new Date();
  if (tournament.startTime && tournament.endTime) {
    if (now < tournament.startTime) tournament.status = 'UPCOMING';
    else if (now >= tournament.startTime && now <= tournament.endTime) tournament.status = 'LIVE';
    else tournament.status = 'COMPLETED';
    await tournament.save();
  }

  res.status(200).json({ status: 'success', data: { tournament } });
});

exports.joinTournament = catchAsync(async (req, res, next) => {
  const tournamentId = req.params.id;
  const userId = req.userId;

  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    return next(new AppError('Tournament not found.', 404));
  }

  if (tournament.status === 'COMPLETED' || tournament.status === 'LIVE') {
    return next(new AppError('Tournament is no longer open for entries.', 400));
  }

  if (tournament.participants.length >= tournament.maxParticipants) {
    return next(new AppError('Tournament is full.', 400));
  }

  if (tournament.participants.includes(userId)) {
    return next(new AppError('You have already joined this tournament.', 200));
  }

  // Deduct entry fee
  if (tournament.entryFee > 0) {
    try {
      await walletService.processTransaction(userId, -tournament.entryFee, 'TOURNAMENT_ENTRY', null, tournamentId);
    } catch (err) {
      return next(new AppError('Insufficient coins to join the tournament.', 400));
    }
  }

  tournament.participants.push(userId);
  await tournament.save();

  res.status(200).json({
    status: 'success',
    message: 'You have joined the tournament successfully!',
    data: {
      tournament,
    },
  });
});

exports.getTournamentLeaderboard = catchAsync(async (req, res, next) => {
  const tournamentId = req.params.id;

  const submissions = await Submission.find({ tournamentId, resultSummary: 'Passed' }).populate('userId', 'username');

  const scoreMap = {};
  submissions.forEach(sub => {
    const uid = sub.userId._id.toString();
    if (!scoreMap[uid]) {
      scoreMap[uid] = { userId: uid, username: sub.userId.username, score: 0, timePenalty: 0 };
    }
    scoreMap[uid].score += 10;
    scoreMap[uid].timePenalty += new Date(sub.createdAt).getTime();
  });

  const leaderboard = Object.values(scoreMap).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timePenalty - b.timePenalty;
  });

  res.status(200).json({
    status: 'success',
    data: { leaderboard },
  });
});

exports.seedTournament = catchAsync(async (req, res, next) => {
  const t1 = await Tournament.create({
    title: 'Weekly Blitz Championship',
    description: 'Top-8 single-elimination. Three DSA rounds — solve fastest to advance.',
    entryFee: 50,
    difficulty: 'Medium',
    status: 'UPCOMING',
    startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 26),
    prizePool: 1000,
    maxParticipants: 32,
    problems: ['two-sum', 'reverse-linked-list']
  });

  const t2 = await Tournament.create({
    title: 'Grand Arena Monthly',
    description: 'Full bracket with AI-judged submissions. Pride and glory for the winner.',
    entryFee: 100,
    difficulty: 'Hard',
    status: 'LIVE',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 1),
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
    prizePool: 5000,
    maxParticipants: 100,
    problems: ['lru-cache', 'merge-k-sorted-lists']
  });

  res.status(201).json({
    status: 'success',
    message: 'Test tournaments seeded successfully!',
    data: { tournaments: [t1, t2] },
  });
});

const aiService = require('../services/aiService');

exports.createAITournament = catchAsync(async (req, res, next) => {
  const { title, numberOfProblems, difficulty, description } = req.body;

  if (!numberOfProblems || numberOfProblems < 1 || numberOfProblems > 5) {
    return next(new AppError('Number of problems must be between 1 and 5.', 400));
  }

  const durationMap = { Easy: 10, Medium: 20, Hard: 40 };
  const duration = durationMap[difficulty] || 20;

  const problems = await aiService.generateTournamentProblems(numberOfProblems, difficulty);

  const tournament = await Tournament.create({
    title,
    description,
    difficulty,
    duration,
    status: 'UPCOMING',
    createdBy: req.userId,
    problems,
    entryFee: 50, // Arbitrary for AI created
    maxParticipants: 100,
    prizePool: 500
  });

  res.status(201).json({
    status: 'success',
    data: { tournament }
  });
});

exports.startTournament = catchAsync(async (req, res, next) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return next(new AppError('Tournament not found', 404));

  if (tournament.status === 'LIVE' || tournament.status === 'COMPLETED') {
    return next(new AppError('Tournament already started or completed.', 400));
  }

  const duration = tournament.duration || 20;
  tournament.status = 'LIVE';
  tournament.startTime = new Date();
  tournament.endTime = new Date(Date.now() + duration * 60000);
  
  await tournament.save();

  res.status(200).json({
    status: 'success',
    data: { tournament }
  });
});
