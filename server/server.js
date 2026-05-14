require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss          = require('xss-clean');
const http         = require('http');
const { Server }   = require('socket.io');

const connectDB      = require('./src/config/db');
const mountRoutes    = require('./src/routes/index');
const notFound       = require('./src/middleware/notFound');
const errorHandler   = require('./src/middleware/errorHandler');
const matchmaking    = require('./src/services/matchmakingService');

/* ── App ──────────────────────────────────────────────── */
const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// Allow all origins in development for mobile testing, otherwise use .env
const CLIENT = process.env.NODE_ENV === 'development' 
  ? true 
  : (process.env.CLIENT_ORIGIN || 'http://localhost:5173');

/* ── Socket.IO ────────────────────────────────────────── */
const io = new Server(server, {
  cors: { origin: CLIENT, methods: ['GET', 'POST'], credentials: true },
});

// Inject io into matchmaking service
matchmaking.setIo(io);

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('disconnect', async () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    await matchmaking.handleDisconnect(socket.id);
  });
});

/* ── Security Middleware ──────────────────────────────── */
app.use(helmet());

const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(cors({
  origin:      CLIENT,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Core Middleware ──────────────────────────────────── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ── Routes ───────────────────────────────────────────── */
mountRoutes(app);

/* ── 404 + Error Handler ──────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ── Start ────────────────────────────────────────────── */
const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Socket.IO   : enabled`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

start();
