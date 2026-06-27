require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { unsealData } = require('iron-session');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const SESSION_PASSWORD = process.env.SESSION_SECRET || 'a-very-long-and-secure-password-that-is-at-least-32-chars';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL }),
});

// ── Store active auction timers ──
// auctionId -> { phase: "preview"|"active", timeout, ... }
const auctionTimers = new Map();

/**
 * Parse iron-session cookie properly using unsealData.
 * iron-session v8 stores the cookie as: base64(sealData(sessionData, { password }))
 */
async function getSessionFromCookie(cookieStr) {
  try {
    if (!cookieStr) return null;
    const cookies = {};
    cookieStr.split(';').forEach((c) => {
      const [name, ...rest] = c.trim().split('=');
      if (name && rest.length) cookies[name.trim()] = rest.join('=');
    });
    const raw = cookies['jingpai-session'];
    if (!raw) return null;

    // iron-session v8 cookie value is the seal string directly (format: <seal>Fe26.<version>)
    const sessionData = await unsealData(raw, { password: SESSION_PASSWORD });
    return sessionData && sessionData.userId ? { userId: sessionData.userId } : null;
  } catch {
    // Cookie might be corrupted or password mismatch — treat as no session
    return null;
  }
}

async function getUserFromSession(cookieStr) {
  const session = await getSessionFromCookie(cookieStr);
  if (!session?.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, nickname: true, role: true, enabled: true },
  });
  if (!user?.enabled) return null;
  return user;
}

function startAuctionTimer(auctionId, resetSeconds, io) {
  stopAuctionTimer(auctionId);

  const timer = {
    lastBidTime: new Date(),
    resetSeconds,
    timeout: null,
  };

  timer.timeout = setTimeout(() => {
    endAuction(auctionId, io);
  }, resetSeconds * 1000);

  auctionTimers.set(auctionId, timer);
}

function startPreviewTimer(auctionId, previewSeconds, io) {
  stopAuctionTimer(auctionId);

  const timer = {
    phase: "preview",
    previewSeconds,
    startedAt: new Date(),
    timeout: null,
  };

  timer.timeout = setTimeout(async () => {
    await transitionToActive(auctionId, io);
  }, previewSeconds * 1000);

  auctionTimers.set(auctionId, timer);
  console.log(`[Preview] Auction ${auctionId} preview started (${previewSeconds}s)`);
}

async function transitionToActive(auctionId, io) {
  stopAuctionTimer(auctionId);
  try {
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction || auction.status !== "preview") return;

    // Verify preview time has actually elapsed
    const previewElapsed = auction.startedAt
      ? Math.floor((Date.now() - new Date(auction.startedAt).getTime()) / 1000)
      : auction.previewSeconds;

    if (previewElapsed < auction.previewSeconds) {
      // Preview not actually done yet — restart
      const remaining = auction.previewSeconds - previewElapsed;
      auctionTimers.set(auctionId, {
        phase: "preview",
        previewSeconds: auction.previewSeconds,
        startedAt: auction.startedAt,
        timeout: setTimeout(() => transitionToActive(auctionId, io), remaining * 1000),
      });
      console.log(`[Preview] Restarted ${auctionId} (not yet elapsed), ${remaining}s remaining`);
      return;
    }

    await prisma.auction.update({ where: { id: auctionId }, data: { status: "active" } });
    io.to(auctionId).emit("bidding-started", { auctionId, bidResetSeconds: auction.bidResetSeconds });
    startAuctionTimer(auctionId, auction.bidResetSeconds, io);
    console.log(`[Preview] Auction ${auctionId} → active`);
  } catch (err) {
    console.error(`[Preview] Error transitioning ${auctionId}:`, err.message);
  }
}

function stopAuctionTimer(auctionId) {
  const existing = auctionTimers.get(auctionId);
  if (existing) {
    clearTimeout(existing.timeout);
    auctionTimers.delete(auctionId);
  }
}

function resetAuctionTimer(auctionId, resetSeconds, io) {
  stopAuctionTimer(auctionId);
  startAuctionTimer(auctionId, resetSeconds, io);
}

/** Restore timers and auto-create auctions on boot */
async function startAuctionTimers(io) {
  // ── Auto-create auctions for vehicles with autoAuction=true ──
  const autoVehicles = await prisma.vehicle.findMany({ where: { autoAuction: true } });
  for (const v of autoVehicles) {
    const existing = await prisma.auction.findFirst({
      where: { vehicleId: v.id, status: { in: ["pending", "preview", "active"] } },
    });
    if (!existing) {
      const newAuction = await autoCreateAuction(v.id, v.previewSeconds, 120);
      if (newAuction) {
        await prisma.auction.update({
          where: { id: newAuction.id },
          data: { status: "preview", startedAt: new Date() },
        });
        io.emit("preview-started", { auctionId: newAuction.id, previewSeconds: v.previewSeconds });
        startPreviewTimer(newAuction.id, v.previewSeconds, io);
        console.log(`[AutoAuction] Created & started auction for "${v.title}"`);
      }
    }
  }

  // ── Restore preview timers ──
  const previewAuctions = await prisma.auction.findMany({ where: { status: "preview" } });
  for (const a of previewAuctions) {
    if (!a.startedAt) continue;
    const elapsed = Math.floor((Date.now() - new Date(a.startedAt).getTime()) / 1000);
    if (elapsed >= a.previewSeconds) {
      // Preview should have finished — transition to active
      await transitionToActive(a.id, io);
    } else {
      const remaining = a.previewSeconds - elapsed;
      auctionTimers.set(a.id, {
        phase: "preview",
        previewSeconds: a.previewSeconds,
        startedAt: new Date(a.startedAt),
        timeout: setTimeout(() => transitionToActive(a.id, io), remaining * 1000),
      });
      console.log(`[Timer] Restored preview timer for ${a.id} (${remaining}s remaining)`);
    }
  }

  // ── Restore active timers ──
  const activeAuctions = await prisma.auction.findMany({ where: { status: "active" } });
  for (const a of activeAuctions) {
    const lastBid = await prisma.bid.findFirst({
      where: { auctionId: a.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const lastBidTime = lastBid?.createdAt || a.startedAt;
    if (!lastBidTime) continue;

    const elapsed = Math.floor((Date.now() - new Date(lastBidTime).getTime()) / 1000);
    if (elapsed >= a.bidResetSeconds) {
      await endAuction(a.id, io);
    } else {
      const remaining = a.bidResetSeconds - elapsed;
      auctionTimers.set(a.id, {
        phase: "active",
        lastBidTime: new Date(lastBidTime),
        resetSeconds: a.bidResetSeconds,
        timeout: setTimeout(() => endAuction(a.id, io), remaining * 1000),
      });
    }
  }

  // Also restore relist timers — check ended auctions with autoRelist that need reprocessing
  // (rare edge case: process ended while server was down)
  const relistCandidates = await prisma.auction.findMany({
    where: { status: "ended", autoRelist: true },
    orderBy: { endedAt: "desc" },
    take: 5,
  });
  for (const a of relistCandidates) {
    if (!a.endedAt) continue;
    const elapsed = Math.floor((Date.now() - new Date(a.endedAt).getTime()) / 1000);
    const delay = a.relistDelaySeconds;
    if (elapsed >= delay) {
      // Delay already passed — create immediately
      const newAuction = await autoCreateAuction(a.vehicleId, a.previewSeconds, a.bidResetSeconds);
      if (newAuction) {
        await prisma.auction.update({
          where: { id: newAuction.id },
          data: { status: "preview", startedAt: new Date() },
        });
        io.emit("preview-started", { auctionId: newAuction.id, previewSeconds: a.previewSeconds });
        startPreviewTimer(newAuction.id, a.previewSeconds, io);
      }
    } else {
      scheduleRelist(a.vehicleId, a.previewSeconds, a.bidResetSeconds, delay - elapsed, io);
    }
  }

  console.log(`[Timer] Restored ${auctionTimers.size} active timers`);
}

/**
 * End an auction — called when the timer fires.
 * Checks the DB before ending to handle Server Action bids that
 * bypass the in-memory timer.
 */
async function endAuction(auctionId, io) {
  stopAuctionTimer(auctionId);
  try {
    // Double-check: has a bid been placed since the timer was set?
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
      },
    });

    if (!auction || (auction.status !== 'active' && auction.status !== 'preview')) return;

    // Only check bid timer restart for active auctions (preview has no bids)
    if (auction.status === 'active') {
      const lastBidTime = auction.bids[0]?.createdAt || auction.startedAt;
      if (lastBidTime) {
        const elapsed = Math.floor((Date.now() - new Date(lastBidTime).getTime()) / 1000);
        if (elapsed < auction.bidResetSeconds) {
          // A bid was placed recently (e.g. via Server Action) — restart the timer
          const remaining = auction.bidResetSeconds - elapsed;
          auctionTimers.set(auctionId, {
            phase: "active",
            lastBidTime: new Date(lastBidTime),
            resetSeconds: auction.bidResetSeconds,
            timeout: setTimeout(() => endAuction(auctionId, io), remaining * 1000),
          });
          console.log(`[Timer] Restarted ${auctionId} (bid detected), ${remaining}s remaining`);
          return;
        }
      }
    }

    const wasPreview = auction.status === 'preview';

    // Actually end
    const ended = await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'ended', endedAt: new Date() },
      include: { currentWinner: { select: { id: true, nickname: true } } },
    });
    await prisma.vehicle.update({
      where: { id: ended.vehicleId },
      // Preview → no bidding happened, vehicle goes back to available
      // Active → bidding occurred, vehicle is sold
      data: { status: wasPreview ? 'available' : 'sold' },
    });
    io.to(auctionId).emit('auction-ended', {
      auctionId,
      winner: ended.currentWinner,
      finalAmount: ended.currentHighestBid,
      autoRelist: ended.autoRelist,
      relistDelaySeconds: ended.relistDelaySeconds,
    });
    console.log(`[Auction] ${auctionId} ended (${wasPreview ? 'preview' : 'active'})`);

    // Auto-relist: schedule new auction after delay
    if (ended.autoRelist) {
      scheduleRelist(ended.vehicleId, ended.previewSeconds, ended.bidResetSeconds, ended.relistDelaySeconds, io);
      // Also emit relist-scheduled to the old auction room so the card can show countdown
      io.to(auctionId).emit('relist-scheduled', {
        auctionId,
        delaySeconds: ended.relistDelaySeconds,
        scheduledAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error(`[Auction] Error ending auction ${auctionId}:`, err.message);
  }
}

/**
 * Schedule a new auction after relistDelaySeconds, with auto-start.
 */
function scheduleRelist(vehicleId, previewSeconds, bidResetSeconds, delaySeconds, io) {
  const timerId = `relist-${vehicleId}-${Date.now()}`;
  console.log(`[Relist] Scheduling new auction for vehicle ${vehicleId} in ${delaySeconds}s`);

  const timeout = setTimeout(async () => {
    auctionTimers.delete(timerId);
    try {
      const newAuction = await autoCreateAuction(vehicleId, previewSeconds, bidResetSeconds);
      if (newAuction) {
        // Immediately start preview
        await prisma.auction.update({
          where: { id: newAuction.id },
          data: { status: "preview", startedAt: new Date() },
        });
        io.to(newAuction.id).emit("preview-started", { auctionId: newAuction.id, previewSeconds });
        startPreviewTimer(newAuction.id, previewSeconds, io);
        console.log(`[Relist] New auction ${newAuction.id} created & started`);
      }
    } catch (err) {
      console.error(`[Relist] Error creating auction:`, err.message);
    }
  }, delaySeconds * 1000);

  auctionTimers.set(timerId, { phase: "relist", timeout });
}

/**
 * Create a new auction for a vehicle (used by auto-relist and boot-time auto-create).
 */
async function autoCreateAuction(vehicleId, previewSeconds, bidResetSeconds) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) { console.error(`[AutoAuction] Vehicle ${vehicleId} not found`); return null; }

  // Check no existing pending/preview/active auction for this vehicle
  const existing = await prisma.auction.findFirst({
    where: { vehicleId, status: { in: ["pending", "preview", "active"] } },
  });
  if (existing) { console.log(`[AutoAuction] Vehicle ${vehicleId} already has active auction`); return null; }

  // Find an admin user to be the creator
  const admin = await prisma.user.findFirst({ where: { role: "admin", enabled: true } });
  if (!admin) { console.error("[AutoAuction] No admin user found"); return null; }

  // Ensure vehicle is in_auction
  if (vehicle.status === "available") {
    await prisma.vehicle.update({ where: { id: vehicleId }, data: { status: "in_auction" } });
  }

  return await prisma.auction.create({
    data: {
      vehicleId,
      status: "pending",
      bidResetSeconds,
      previewSeconds,
      autoRelist: true,
      relistDelaySeconds: vehicle.relistDelaySeconds,
      createdBy: admin.id,
    },
  });
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // 将非 Socket.IO 的 WebSocket 升级请求交给 Next.js HMR 处理
  const upgradeHandler = app.getUpgradeHandler();
  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '/');
    if (!pathname || !pathname.startsWith('/socket.io')) {
      upgradeHandler(req, socket, head);
    }
  });

  const io = new Server(server, {
    path: '/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Expose io to Server Actions so they can broadcast events
  global.__io = io;
  global.__stopAuctionTimer = stopAuctionTimer;
  global.__startAuctionTimer = (auctionId, resetSeconds) => startAuctionTimer(auctionId, resetSeconds, io);
  global.__startPreviewTimer = (auctionId, previewSeconds) => startPreviewTimer(auctionId, previewSeconds, io);
  global.__transitionToActive = (auctionId) => transitionToActive(auctionId, io);
  global.__endAuction = (auctionId) => endAuction(auctionId, io);

  // Socket.IO auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieStr = socket.handshake.headers.cookie;
      const user = await getUserFromSession(cookieStr);
      socket.data.user = user;
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join-auction', async ({ auctionId }) => {
      socket.join(auctionId);
      console.log(`[Socket] ${socket.id} joined auction ${auctionId}`);
      // Send current timer state
      const timer = auctionTimers.get(auctionId);
      if (timer) {
        if (timer.phase === "preview") {
          const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, timer.previewSeconds - elapsed);
          socket.emit('timer-sync', { auctionId, remainingSeconds: remaining, phase: "preview" });
        } else if (timer.phase === "active") {
          const elapsed = Math.floor((Date.now() - timer.lastBidTime.getTime()) / 1000);
          const remaining = Math.max(0, timer.resetSeconds - elapsed);
          socket.emit('timer-sync', { auctionId, remainingSeconds: remaining, phase: "active" });
        }
      }
    });

    socket.on('leave-auction', ({ auctionId }) => {
      socket.leave(auctionId);
    });

    socket.on('place-bid', async ({ auctionId, amount }) => {
      try {
        const user = socket.data.user;
        if (!user) {
          socket.emit('bid-failed', { message: '请先登录' });
          return;
        }

        // ── Cooldown: prevent rapid-fire bids (3 seconds) ──
        const lastUserBid = await prisma.bid.findFirst({
          where: { auctionId, userId: user.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });
        if (lastUserBid) {
          const sinceLastBid = (Date.now() - new Date(lastUserBid.createdAt).getTime()) / 1000;
          if (sinceLastBid < 3) {
            socket.emit('bid-failed', { message: `请等待 ${Math.ceil(3 - sinceLastBid)} 秒后再出价` });
            return;
          }
        }

        // Execute bid in a transaction
        const result = await prisma.$transaction(async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: { vehicle: true },
          });

          if (!auction) throw new Error('拍卖不存在');
          if (auction.status !== 'active') throw new Error('拍卖未在进行中');

          const minBid = (auction.currentHighestBid || auction.vehicle.startingPrice) + auction.vehicle.minBidIncrement;
          if (amount < minBid) throw new Error(`出价必须至少 ¥${minBid.toLocaleString()}`);

          // Create bid
          const bid = await tx.bid.create({
            data: {
              auctionId,
              userId: user.id,
              amount,
            },
          });

          // Update auction
          const updated = await tx.auction.update({
            where: { id: auctionId },
            data: {
              currentHighestBid: amount,
              currentWinnerId: user.id,
              bidCount: { increment: 1 },
            },
          });

          return { bid, updated, vehicleTitle: auction.vehicle.title };
        });

        // Ensure bidding socket is in the room before broadcasting
        socket.join(auctionId);

        // Broadcast to room (for auction page real-time updates)
        io.to(auctionId).emit('bid-update', {
          auctionId,
          amount: result.bid.amount,
          userId: user.id,
          nickname: user.nickname,
          bidCount: result.updated.bidCount,
          bidId: result.bid.id,
          vehicleTitle: result.vehicleTitle,
          timestamp: result.bid.createdAt.toISOString(),
        });

        // Global notification (for the navbar notification bar — all clients)
        io.emit('bid-notification', {
          auctionId,
          amount: result.bid.amount,
          nickname: user.nickname,
          vehicleTitle: result.vehicleTitle,
        });

        // Reset timer
        resetAuctionTimer(auctionId, result.updated.bidResetSeconds, io);
        const timer = auctionTimers.get(auctionId);
        const remaining = timer ? timer.resetSeconds : result.updated.bidResetSeconds;
        io.to(auctionId).emit('timer-reset', { auctionId, remainingSeconds: remaining, phase: "active" });

        socket.emit('bid-success', { auctionId, amount: result.bid.amount });
        console.log(`[Bid] ${user.nickname} bid ¥${amount} on auction ${auctionId}`);
      } catch (err) {
        const message = err.message;
        if (message.includes('Unique constraint')) {
          socket.emit('bid-failed', { message: '该金额已被出价，请尝试其他金额' });
        } else {
          socket.emit('bid-failed', { message });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  // Restore active auction timers on startup
  startAuctionTimers(io);

  server.listen(port, hostname, () => {
    const localIP = getLocalIP();
    console.log(`🚀 竞拍系统已启动`);
    console.log(`📍 局域网访问: http://${localIP}:${port}`);

    // Try Cloudflare Tunnel
    tryStartTunnel(port);
  });
});

function tryStartTunnel(port) {
  const { spawn } = require('child_process');
  // Find cloudflared exe — check project dir, user bin, then PATH
  const fs = require('fs');
  const path = require('path');

  // Clean up stale tunnel URL from previous run
  const urlFile = path.join(__dirname, '.tunnel-url');
  try { fs.unlinkSync(urlFile); } catch {}

  let cloudflaredPath = 'cloudflared';
  const localExe = path.join(__dirname, 'cloudflared.exe');
  const userBin = path.join(process.env.USERPROFILE || 'C:\\Users\\Administrator', 'bin', 'cloudflared.exe');
  if (fs.existsSync(localExe)) cloudflaredPath = localExe;
  else if (fs.existsSync(userBin)) cloudflaredPath = userBin;

  const child = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let tunnelUrl = null;

  child.stderr.on('data', (data) => {
    const msg = data.toString();
    // Parse the trycloudflare.com URL from stderr
    const match = msg.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      console.log(`🌐 外网访问: ${tunnelUrl}`);
      // Write tunnel URL to a file the frontend can read
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(
        path.join(__dirname, '.tunnel-url'),
        tunnelUrl
      );
    }
  });

  child.on('error', () => {
    console.log('💡 提示: 安装 cloudflared 可启用外网访问');
    console.log('   下载地址: https://github.com/cloudflare/cloudflared/releases');
  });

  child.on('exit', () => {
    // Clean up on exit
    const fs = require('fs');
    const path = require('path');
    const urlFile = path.join(__dirname, '.tunnel-url');
    try { fs.unlinkSync(urlFile); } catch {}
  });
}

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
