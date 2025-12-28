
import express from "express";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import os from "os";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __argvHref = process.argv?.[1] ? pathToFileURL(process.argv[1]).href : null;

const PORT = parseInt(process.env.PORT || "8787", 10);
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_.env";

const ensureDir = (dir) => {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
};

const canWriteDir = (dir) => {
  try {
    ensureDir(dir);
    const testPath = path.join(dir, ".__mg_write_test__");
    fs.writeFileSync(testPath, "ok");
    fs.unlinkSync(testPath);
    return true;
  } catch {
    return false;
  }
};

const pickDbPath = () => {
  if (process.env.DB_PATH) return path.resolve(process.env.DB_PATH);

  const candidates = [];
  if (process.env.MG_DB_DIR) candidates.push(path.resolve(process.env.MG_DB_DIR, "data.sqlite"));

  const cwd = process.cwd();
  candidates.push(path.join(cwd, "backend", "data.sqlite"));
  candidates.push(path.join(cwd, "data.sqlite"));
  candidates.push(path.join(__dirname, "data.sqlite"));

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }

  for (const p of candidates) {
    const dir = path.dirname(p);
    if (canWriteDir(dir)) return p;
  }

  const fallbackDir = path.join(os.homedir(), ".mg_online");
  ensureDir(fallbackDir);
  return path.join(fallbackDir, "data.sqlite");
};

const DB_PATH = pickDbPath();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
app.use(cors()); // For deployment behind different origins; you can lock this down later.

app.use(rateLimit({
  windowMs: 60_000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get("/api/ping", (req, res) => {
  res.json({ ok: true, now: Date.now() });
});

console.log("[MG] DB_PATH:", DB_PATH);

let db;
try {
  db = new Database(DB_PATH);
} catch (e) {
  const fallbackDir = path.join(os.homedir(), ".mg_online");
  ensureDir(fallbackDir);
  const fallbackPath = path.join(fallbackDir, "data.sqlite");
  console.warn("[MG] Failed to open DB at", DB_PATH, "- falling back to", fallbackPath);
  db = new Database(fallbackPath);
}
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  login TEXT NOT NULL UNIQUE,
  nick TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_bot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY,
  save_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard (
  user_id INTEGER PRIMARY KEY,
  score REAL NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard_rebirth (
  user_id INTEGER PRIMARY KEY,
  rebirths INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PvP Arena rating (ELO-lite)
CREATE TABLE IF NOT EXISTS arena_ratings (
  user_id INTEGER PRIMARY KEY,
  rating INTEGER NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  loss_streak INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- PvP fights to prevent farming same opponent (once per day)
CREATE TABLE IF NOT EXISTS arena_fights (
  user_id INTEGER NOT NULL,
  opponent_id INTEGER NOT NULL,
  day_key INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, opponent_id, day_key),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(opponent_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL,
  to_user INTEGER NOT NULL,
  status TEXT NOT NULL, -- pending|accepted|declined
  created_at INTEGER NOT NULL,
  UNIQUE(from_user, to_user),
  FOREIGN KEY(from_user) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(to_user) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friends (
  user_id INTEGER NOT NULL,
  friend_user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(user_id, friend_user_id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(friend_user_id) REFERENCES users(id) ON DELETE CASCADE
);

`);

try {
  const cols = db.prepare("PRAGMA table_info(users)").all().map(r => r.name);
  if(!cols.includes("login")) db.exec("ALTER TABLE users ADD COLUMN login TEXT");
  if(!cols.includes("nick")) db.exec("ALTER TABLE users ADD COLUMN nick TEXT");
  if(!cols.includes("is_bot")) db.exec("ALTER TABLE users ADD COLUMN is_bot INTEGER NOT NULL DEFAULT 0");
} catch {
}


try {
  const cols = db.prepare("PRAGMA table_info(arena_ratings)").all().map(r => r.name);
  const add = (name, sql) => { if(!cols.includes(name)) db.exec(sql); };

  add("win_streak", 'ALTER TABLE arena_ratings ADD COLUMN win_streak INTEGER NOT NULL DEFAULT 0');
  add("loss_streak", 'ALTER TABLE arena_ratings ADD COLUMN loss_streak INTEGER NOT NULL DEFAULT 0');

  if(!cols.includes("pvp_points")) {
    db.exec("ALTER TABLE arena_ratings ADD COLUMN pvp_points INTEGER NOT NULL DEFAULT 0");
    db.exec("UPDATE arena_ratings SET pvp_points = COALESCE(pvp_points, 0) + (COALESCE(wins,0) * 10) WHERE pvp_points = 0 AND COALESCE(wins,0) > 0");
  }

  add("daily_rank_claim_key", 'ALTER TABLE arena_ratings ADD COLUMN daily_rank_claim_key TEXT');
  add("season_key", 'ALTER TABLE arena_ratings ADD COLUMN season_key TEXT');
  add("season_claimed_key", 'ALTER TABLE arena_ratings ADD COLUMN season_claimed_key TEXT');
  add("last_season_key", 'ALTER TABLE arena_ratings ADD COLUMN last_season_key TEXT');

  add("last_season_rating", 'ALTER TABLE arena_ratings ADD COLUMN last_season_rating INTEGER NOT NULL DEFAULT 0');
  add("last_season_points", 'ALTER TABLE arena_ratings ADD COLUMN last_season_points INTEGER NOT NULL DEFAULT 0');
  add("last_season_wins", 'ALTER TABLE arena_ratings ADD COLUMN last_season_wins INTEGER NOT NULL DEFAULT 0');
  add("last_season_losses", 'ALTER TABLE arena_ratings ADD COLUMN last_season_losses INTEGER NOT NULL DEFAULT 0');

} catch {
}

const qFindUserByEmail = db.prepare("SELECT id, email, login, nick, password_hash FROM users WHERE email = ?");
const qFindUserByLogin = db.prepare("SELECT id, email, login, nick, password_hash FROM users WHERE login = ?");
const qFindUserById = db.prepare("SELECT id, email, login, nick FROM users WHERE id = ?");
const qInsertUser = db.prepare("INSERT INTO users(email, login, nick, password_hash, created_at) VALUES(?,?,?,?,?)");
const qInsertBot = db.prepare("INSERT INTO users(email, login, nick, password_hash, is_bot, created_at) VALUES(?,?,?,?,?,?)");
const qGetSave = db.prepare("SELECT save_json, updated_at FROM saves WHERE user_id = ?");
const qUpsertSave = db.prepare(`
INSERT INTO saves(user_id, save_json, updated_at)
VALUES(?,?,?)
ON CONFLICT(user_id) DO UPDATE SET save_json=excluded.save_json, updated_at=excluded.updated_at
`);
const qUpsertScore = db.prepare(`
INSERT INTO leaderboard(user_id, score, updated_at)
VALUES(?,?,?)
ON CONFLICT(user_id) DO UPDATE SET score=excluded.score, updated_at=excluded.updated_at
`);

const qGetScore = db.prepare("SELECT score, updated_at FROM leaderboard WHERE user_id = ?");

const qUpsertRebirth = db.prepare(`
INSERT INTO leaderboard_rebirth(user_id, rebirths, updated_at)
VALUES(?,?,?)
ON CONFLICT(user_id) DO UPDATE SET rebirths=excluded.rebirths, updated_at=excluded.updated_at
`);
const qTop = db.prepare(`
SELECT u.id as uid, u.login as login, u.nick as nick, u.email as email, l.score as score, l.updated_at as updated_at
FROM leaderboard l
JOIN users u ON u.id = l.user_id
WHERE (u.login NOT LIKE 'bot\_%') AND (u.email NOT LIKE '%@bot.%') AND (u.email NOT LIKE '%@bot%')
ORDER BY l.score DESC
LIMIT ?
`);

const qTopRebirth = db.prepare(`
SELECT u.id as uid, u.login as login, u.nick as nick, u.email as email, r.rebirths as rebirths, r.updated_at as updated_at
FROM leaderboard_rebirth r
JOIN users u ON u.id = r.user_id
ORDER BY r.rebirths DESC
LIMIT ?
`);

const qSearchUsers = db.prepare(`
SELECT id, login, nick
FROM users
WHERE login LIKE ? OR nick LIKE ?
ORDER BY login ASC
LIMIT 25
`);

const qReqCreate = db.prepare(`
INSERT INTO friend_requests(from_user, to_user, status, created_at)
VALUES(?,?, 'pending', ?)
`);
const qReqGet = db.prepare(`SELECT * FROM friend_requests WHERE id = ?`);
const qReqIncoming = db.prepare(`
SELECT fr.id, fr.from_user, fr.to_user, fr.status, fr.created_at, u.id as from_uid, u.login as from_login, u.nick as from_nick
FROM friend_requests fr
JOIN users u ON u.id = fr.from_user
WHERE fr.to_user = ? AND fr.status = 'pending'
ORDER BY fr.created_at DESC
LIMIT 50
`);
const qReqOutgoing = db.prepare(`
SELECT fr.id, fr.from_user, fr.to_user, fr.status, fr.created_at, u.id as to_uid, u.login as to_login, u.nick as to_nick
FROM friend_requests fr
JOIN users u ON u.id = fr.to_user
WHERE fr.from_user = ? AND fr.status = 'pending'
ORDER BY fr.created_at DESC
LIMIT 50
`);
const qReqSetStatus = db.prepare(`UPDATE friend_requests SET status = ? WHERE id = ?`);
const qFriendAdd = db.prepare(`INSERT OR IGNORE INTO friends(user_id, friend_user_id, created_at) VALUES(?,?,?)`);
const qFriendDel = db.prepare(`DELETE FROM friends WHERE user_id = ? AND friend_user_id = ?`);
const qReqDelPair = db.prepare(`DELETE FROM friend_requests WHERE (from_user=? AND to_user=?) OR (from_user=? AND to_user=?)`);
const qFriendsList = db.prepare(`
SELECT u.id as uid, u.login as login, u.nick as nick
FROM friends f
JOIN users u ON u.id = f.friend_user_id
WHERE f.user_id = ?
ORDER BY u.login ASC
LIMIT 200
`);

const qGetArenaRating = db.prepare(`
  SELECT rating, wins, losses, win_streak, loss_streak, pvp_points, updated_at,
         daily_rank_claim_key, season_key, season_claimed_key,
         last_season_key, last_season_rating, last_season_points, last_season_wins, last_season_losses
  FROM arena_ratings
  WHERE user_id = ?
`);
const qUpsertArenaRating = db.prepare(`
INSERT INTO arena_ratings(user_id, rating, wins, losses, win_streak, loss_streak, pvp_points, updated_at)
VALUES(?,?,?,?,?,?,?,?)
ON CONFLICT(user_id) DO UPDATE SET rating=excluded.rating, wins=excluded.wins, losses=excluded.losses, win_streak=excluded.win_streak, loss_streak=excluded.loss_streak, pvp_points=excluded.pvp_points, updated_at=excluded.updated_at
`);

const qOpponentsRandom = db.prepare(`
SELECT u.id as uid,
       u.login as login,
       u.nick as nick,
       l.score as score,
       COALESCE(ar.rating, 800) as rating,
       COALESCE(ar.pvp_points, 0) as pvp_points
FROM leaderboard l
JOIN users u ON u.id = l.user_id
LEFT JOIN arena_ratings ar ON ar.user_id = u.id
WHERE u.id <> ?
ORDER BY RANDOM()
LIMIT ?
`);


const qHasFoughtHour = db.prepare("SELECT 1 as ok FROM arena_fights WHERE user_id=? AND opponent_id=? AND day_key=? LIMIT 1");
const qRecordFight = db.prepare("INSERT OR IGNORE INTO arena_fights(user_id, opponent_id, day_key, created_at) VALUES(?,?,?,?)");

const qPvpPointsLeaderboard = db.prepare(`
SELECT u.id as uid,
       u.login as login,
       u.nick as nick,
       COALESCE(ar.pvp_points, 0) as points,
       COALESCE(ar.wins, 0) as wins,
       COALESCE(ar.losses, 0) as losses,
       COALESCE(ar.rating, 800) as rating
FROM users u
LEFT JOIN arena_ratings ar ON ar.user_id = u.id
ORDER BY COALESCE(ar.pvp_points,0) DESC, COALESCE(ar.rating,800) DESC, COALESCE(ar.wins,0) DESC
LIMIT ?
`);

const qTopMastersCurrent = db.prepare(`
  SELECT user_id
  FROM arena_ratings
  WHERE season_key = ?
  ORDER BY COALESCE(pvp_points,0) DESC, COALESCE(rating,0) DESC, COALESCE(wins,0) DESC
  LIMIT 10
`);

const qTopMastersLastSeason = db.prepare(`
  SELECT user_id
  FROM arena_ratings
  WHERE last_season_key = ?
  ORDER BY COALESCE(last_season_points,0) DESC, COALESCE(last_season_rating,0) DESC, COALESCE(last_season_wins,0) DESC
  LIMIT 10
`);

const qSeasonTop10 = db.prepare(`
SELECT user_id as uid
FROM arena_ratings
WHERE season_key = ?
ORDER BY pvp_points DESC, rating DESC, wins DESC
LIMIT 10
`);

const qPrevSeasonTop10 = db.prepare(`
SELECT user_id as uid
FROM arena_ratings
WHERE last_season_key = ?
ORDER BY last_season_points DESC, last_season_rating DESC, last_season_wins DESC
LIMIT 10
`);


const qFindUserByUid = db.prepare("SELECT id, login, nick, email, is_bot FROM users WHERE id = ?");


function safeParseJSON(str) {
  try { return JSON.parse(str); } catch { return null; }
}

function getUserSave(uid) {
  const row = qGetSave.get(uid);
  if (!row) return null;
  return safeParseJSON(row.save_json);
}

function setUserSave(uid, saveObj) {
  const json = JSON.stringify(saveObj);
  qUpsertSave.run(uid, json, Date.now());
}


function extractPublicAvatar(saveObj) {
  const a = (saveObj?.player?.avatar && typeof saveObj.player.avatar === "object")
    ? saveObj.player.avatar
    : saveObj?.profile?.avatar;
  if (!a || typeof a !== "object") return null;
  const out = {};
  if (typeof a.icon === "string" && a.icon.trim()) out.icon = a.icon.trim().slice(0, 8);
  if (typeof a.color === "string" && a.color.trim()) out.color = a.color.trim().slice(0, 32);
  if (typeof a.image === "string" && a.image.startsWith("data:image/")) out.image = a.image;
  if (typeof a.motto === "string" && a.motto.trim()) out.motto = a.motto.trim().slice(0, 80);
  return Object.keys(out).length ? out : null;
}

function getAvatarForUserId(uid) {
  const save = getUserSave(uid);
  return extractPublicAvatar(save);
}

function ownedCount(saveObj, unitId) {
  const seen = saveObj?.seen;
  const c = seen?.[unitId]?.ownedCount;
  return Number.isFinite(c) ? c : 0;
}

function decOwned(saveObj, unitId, n = 1) {
  if (!saveObj.seen) saveObj.seen = {};
  if (!saveObj.seen[unitId]) saveObj.seen[unitId] = {};
  const cur = ownedCount(saveObj, unitId);
  const next = Math.max(0, cur - n);
  saveObj.seen[unitId].ownedCount = next;
  if (next <= 0 && Array.isArray(saveObj.team)) {
    saveObj.team = saveObj.team.map(x => (x === unitId ? null : x));
  }
}

function incOwned(saveObj, unitId, n = 1) {
  if (!saveObj.seen) saveObj.seen = {};
  if (!saveObj.seen[unitId]) saveObj.seen[unitId] = {};
  const cur = ownedCount(saveObj, unitId);
  saveObj.seen[unitId].ownedCount = cur + n;
}

function signToken(user) {
  return jwt.sign({ uid: user.id, email: user.email, login: user.login, nick: user.nick }, JWT_SECRET, { expiresIn: "7d" });
}

const BOT_COUNT = Math.max(400, parseInt(process.env.BOT_COUNT || '2600', 10) || 2600);
const BOT_EMAIL_DOMAIN = process.env.BOT_EMAIL_DOMAIN || "bot.local";

function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }

function makeBotProfile(i){
  const adj = ["Neon","Void","Crimson","Frost","Shadow","Hyper","Quantum","Solar","Lunar","Pixel","Nova","Viper","Rogue","Turbo","Arc","Storm","Blaze","Echo","Mythic","Cyber","Iron","Silent","Savage","Glitch","Omega","Apex"];
  const noun = ["Wolf","Dragon","Reaper","Ninja","Samurai","Phantom","Ranger","Titan","Wraith","Gladiator","Striker","Mage","Guardian","Sniper","Assassin","Valkyrie","Golem","Druid","Pilot","Raider","Sentinel","Spectre","Monk","Hunter","Berserk","Alchemist"]; 
  const tag = String(randInt(10,99));
  const login = `bot_${i}_${randChoice(noun).toLowerCase()}${tag}`;
  const nick = `${randChoice(adj)}${randChoice(noun)}#${tag}`;
  const email = `${login}@${BOT_EMAIL_DOMAIN}`.toLowerCase();
  return { login, nick, email };
}


function utcDayKey(ts=Date.now()){
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,"0");
  const da = String(d.getUTCDate()).padStart(2,"0");
  return parseInt(`${y}${m}${da}`, 10);
}

function utcHourKey(ts=Date.now()){
  return Math.floor(ts / 3600000);
}


function pvpTeamSizeForLevel(level){
  const lvl = Math.max(1, level|0);
  if(lvl >= 40) return 8;
  if(lvl >= 30) return 7;
  if(lvl >= 20) return 6;
  if(lvl >= 10) return 5;
  return 4;
}

function buildTeamDetails(saveObj, teamSize){
  const save = (saveObj && typeof saveObj === "object") ? saveObj : {};
  const ids = Array.isArray(save?.team) ? save.team.slice(0, teamSize).filter(Boolean) : [];
  const seen = (save?.seen && typeof save.seen === "object") ? save.seen : {};
  return ids.map(id=>{
    const s = seen[id] || {};
    return {
      id: String(id),
      level: Number(s.level) || 1,
      const: Number(s.const) || 0,
      ascTier: Number(s.ascTier) || 0
    };
  });
}


function ensureBots(){
  try{
    const botCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_bot = 1").get().c || 0;
    if(botCount >= BOT_COUNT) return;

    const want = BOT_COUNT - botCount;
    const now = Date.now();
    for(let i=0;i<want;i++){
      const prof = makeBotProfile(botCount + i + 1);
      const ph = bcrypt.hashSync("bot_password_unused_" + Math.random().toString(16).slice(2), 8);
      let uid;
      try{
        const info = qInsertBot.run(prof.email, prof.login, prof.nick, ph, 1, now - randInt(0, 30)*86400_000);
        uid = info.lastInsertRowid;
      }catch(e){
        continue;
      }

      const t = (botCount + i) / Math.max(1, BOT_COUNT-1);
      const botRating = Math.max(800, Math.min(1650, Math.round(800 + t*850 + randInt(-40, 40))));
      const botTier = pvpTierFromRating(botRating);

      const tierMult = ({
        Iron: 90,       // ~200–2k (cap)
        Bronze: 140,
        Silver: 220,
        Gold: 340,
        Platinum: 520,
        Emerald: 740,
        Diamond: 980,
      })[botTier.name] || 220;

      const levelRanges = ({
        Iron: [2, 10],        // starter bots weaker
        Bronze: [6, 18],
        Silver: [14, 30],
        Gold: [24, 45],
        Platinum: [38, 65],
        Emerald: [55, 85],
        Diamond: [70, 110],
      })[botTier.name] || [10, 35];

      const level = randInt(levelRanges[0], levelRanges[1]);
      const teamSlots = pvpTeamSizeForLevel(level);
      let score = Math.round(tierMult * level + randInt(0, tierMult));
      if(botTier.name === "Iron") score = Math.min(score, 2000);
      if(botTier.name === "Bronze") score = Math.min(score, 4500);
      if(botTier.name === "Silver") score = Math.min(score, 7000);
      const saveObj = {
        player:{
          username: prof.login,
          displayName: prof.nick,
          level,
          xp: 0,
          avatar:{ color: randChoice(["#8fb3ff","#ff8fb3","#8fffd1","#ffd18f","#c38fff","#8fff8f"]), icon: randChoice(["⭐","⚔️","🛡️","🔥","❄️","⚡","🌿","💎"]), motto: "", image:null },
          createdAt: now - randInt(1, 120)*86400_000,
          lastLoginAt: now - randInt(0, 7)*86400_000
        },
        teamSlots,
        team: Array.from({length:teamSlots}, ()=>null),
        seen: {},
        gold: 0, gems: 0, pulls: 0, essence: 0, cores: 0,
      };

      const poolByTier = (function(){
        const r=[]; for(let k=1;k<=24;k++) r.push("r"+k);
        const sr=[]; for(let k=1;k<=10;k++) sr.push("sr"+k);
        const ssr=[]; for(let k=1;k<=24;k++) ssr.push("ssr"+k);
        const ur=[]; for(let k=1;k<=16;k++) ur.push("ur"+k);
        const pick=(...arrs)=>arrs.flat();
        switch(botTier.name){
          case "Iron": return pick(r, sr.slice(0,4));
          case "Bronze": return pick(r, sr);
          case "Silver": return pick(sr, ssr.slice(0,8));
          case "Gold": return pick(sr, ssr, ur.slice(0,3));
          case "Platinum": return pick(ssr, ur.slice(0,8));
          case "Emerald": return pick(ssr, ur);
          case "Diamond": return pick(ur, ssr);
          default: return pick(r, sr);
        }
      })();

      for(let s=0;s<teamSlots;s++){
        saveObj.team[s] = randChoice(poolByTier);
      }

      setUserSave(uid, saveObj);
      qUpsertScore.run(uid, score, now - randInt(0, 2)*86400_000);
      qUpsertRebirth.run(uid, randInt(0, 25), now - randInt(0, 7)*86400_000);
      const botPts = randInt(80, 1200);
      qUpsertArenaRating.run(uid, botRating, randInt(0, 120), randInt(0, 120), 0, 0, botPts, now);
      try{
        const curSeason = seasonKeyForDate(new Date());
        db.prepare("UPDATE arena_ratings SET season_key=? WHERE user_id=?").run(curSeason, uid);
      }catch(e){}
    }
    console.log(`[MG] Seeded bots: +${want} (total ${BOT_COUNT})`);
  }catch(e){
    console.warn("[MG] ensureBots failed", e);
  }
}

const PVP_TIERS = [
  { name: "Iron",     pl: "Żelazo",   badge: "🪓", start: 800,  step: 20 },
  { name: "Bronze",   pl: "Brąz",     badge: "🥉", start: 900,  step: 20 },
  { name: "Silver",   pl: "Srebro",   badge: "🥈", start: 1000, step: 25 },
  { name: "Gold",     pl: "Złoto",    badge: "🥇", start: 1125, step: 25 },
  { name: "Platinum", pl: "Platyna",  badge: "💠", start: 1250, step: 25 },
  { name: "Emerald",  pl: "Szmaragd", badge: "🟢", start: 1375, step: 25 },
  { name: "Diamond",  pl: "Diament",  badge: "💎", start: 1500, step: 30 },
];

const PVP_POINTS_LADDER = [
  { tier: "Iron",     div: 5, min: 0 },
  { tier: "Iron",     div: 4, min: 100 },
  { tier: "Iron",     div: 3, min: 200 },
  { tier: "Iron",     div: 2, min: 300 },
  { tier: "Iron",     div: 1, min: 450 },

  { tier: "Bronze",   div: 5, min: 650 },
  { tier: "Bronze",   div: 4, min: 850 },
  { tier: "Bronze",   div: 3, min: 1100 },
  { tier: "Bronze",   div: 2, min: 1400 },
  { tier: "Bronze",   div: 1, min: 1750 },

  { tier: "Silver",   div: 5, min: 2150 },
  { tier: "Silver",   div: 4, min: 2600 },
  { tier: "Silver",   div: 3, min: 3100 },
  { tier: "Silver",   div: 2, min: 3700 },
  { tier: "Silver",   div: 1, min: 4400 },

  { tier: "Gold",     div: 5, min: 5200 },
  { tier: "Gold",     div: 4, min: 6100 },
  { tier: "Gold",     div: 3, min: 7100 },
  { tier: "Gold",     div: 2, min: 8300 },
  { tier: "Gold",     div: 1, min: 9700 },

  { tier: "Platinum", div: 5, min: 11300 },
  { tier: "Platinum", div: 4, min: 13200 },
  { tier: "Platinum", div: 3, min: 15400 },
  { tier: "Platinum", div: 2, min: 17900 },
  { tier: "Platinum", div: 1, min: 20700 },

  { tier: "Emerald",  div: 5, min: 23900 },
  { tier: "Emerald",  div: 4, min: 27500 },
  { tier: "Emerald",  div: 3, min: 31600 },
  { tier: "Emerald",  div: 2, min: 36300 },
  { tier: "Emerald",  div: 1, min: 41700 },

  { tier: "Diamond",  div: 5, min: 47800 },
  { tier: "Diamond",  div: 4, min: 54800 },
  { tier: "Diamond",  div: 3, min: 62800 },
  { tier: "Diamond",  div: 2, min: 72000 },
  { tier: "Diamond",  div: 1, min: 82500 },
];

function pointsTier(points){
  const p = Math.max(0, Number(points)||0);
  let best = PVP_POINTS_LADDER[0];
  for(const it of PVP_POINTS_LADDER){
    if(p >= it.min) best = it;
    else break;
  }
  const nextIdx = PVP_POINTS_LADDER.findIndex(x=>x.tier===best.tier && x.div===best.div) + 1;
  const next = (nextIdx>0 && nextIdx < PVP_POINTS_LADDER.length) ? PVP_POINTS_LADDER[nextIdx] : null;
  return { current: best, next };
}

ensureBots();
function ensureBotsByDivision(){
  try{
    const bots = db.prepare(`
      SELECT u.id as uid, COALESCE(ar.rating,800) as rating, COALESCE(ar.pvp_points,0) as pts
      FROM users u
      LEFT JOIN arena_ratings ar ON ar.user_id = u.id
      WHERE u.is_bot = 1
    `).all();

    const count = {};
    for(const b of bots){
      const cur = pointsTier(Number(b.pts)||0).current;
      const tName = cur.tier;
      const tDiv = cur.div;
      const key = `${tName}:${tDiv}`;
      count[key] = (count[key]||0)+1;
    }

    const lowTiers = new Set(['Iron','Bronze','Silver','Gold']);
    const hiTiers  = new Set(['Platinum','Emerald','Diamond']);

    const tierIdx = (name)=>PVP_TIERS.findIndex(x=>x.name===name);
    const divRange = (tierName, div)=>{
      const idx = tierIdx(tierName);
      const t = PVP_TIERS[idx];
      const next = PVP_TIERS[idx+1];
      const step = Math.max(1, t.step|0);
      const band = (5-(div|0));
      const lo = t.start + band*step;
      let hi = lo + step - 1;
      if(div===1){
        hi = next ? (next.start - 1) : (lo + step*3);
      }
      return [lo, hi];
    };

    const now = Date.now();

    const pointsRangeForTierDiv = (tierName, div)=>{
      const idx = PVP_POINTS_LADDER.findIndex(x=>x.tier===tierName && x.div===div);
      if(idx < 0) return [0, 300];
      const cur = PVP_POINTS_LADDER[idx];
      const next = PVP_POINTS_LADDER[idx+1] || null;
      const lo = cur.min;
      const hi = next ? Math.max(lo, next.min - 1) : (lo + 12000);
      const pad = Math.min(500, Math.floor((hi-lo)*0.15));
      return [lo, Math.max(lo, hi - pad)];
    };
    let created = 0;

    for(const tier of PVP_TIERS){
      for(let div=5; div>=1; div--){
        const key = `${tier.name}:${div}`;
        const target = lowTiers.has(tier.name) ? 100 : (hiTiers.has(tier.name) ? 25 : 100);
        const have = count[key]||0;
        const need = Math.max(0, target - have);
        if(!need) continue;
        const [lo,hi] = divRange(tier.name, div);
        for(let i=0;i<need;i++){
          const prof = makeBotProfile(randInt(100000,999999));
          const ph = bcrypt.hashSync('bot_password_unused_' + Math.random().toString(16).slice(2), 8);
          let uid;
          try{
            const info = qInsertBot.run(prof.email, prof.login, prof.nick, ph, 1, now - randInt(0, 30)*86400_000);
            uid = info.lastInsertRowid;
          }catch(e){
            continue;
          }

          const rating = randInt(lo, hi);
          const [plo, phi] = pointsRangeForTierDiv(tier.name, div);
          const basePts = randInt(plo, phi);
          qUpsertArenaRating.run(uid, rating, randInt(0,120), randInt(0,120), 0, 0, basePts, now);
          try{ db.prepare('UPDATE arena_ratings SET season_key=? WHERE user_id=?').run(seasonKeyForDate(new Date()), uid); }catch{}

          const tierMult = ({
            Iron: 70, Bronze: 120, Silver: 200, Gold: 320, Platinum: 520, Emerald: 740, Diamond: 980,
          })[tier.name] || 200;
          const lvlRanges = ({
            Iron:[1,8], Bronze:[6,18], Silver:[12,28], Gold:[22,45], Platinum:[35,65], Emerald:[50,85], Diamond:[65,110]
          })[tier.name] || [10,30];
          const level = randInt(lvlRanges[0], lvlRanges[1]);
          const teamSlots = pvpTeamSizeForLevel(level);
          let score = Math.round(tierMult*level + randInt(0, tierMult));
          if(tier.name==='Iron') score = Math.min(score, 2000);
          if(tier.name==='Bronze') score = Math.min(score, 4500);
          if(tier.name==='Silver') score = Math.min(score, 7000);
          const saveObj = {
            player:{ username: prof.login, displayName: prof.nick, level, xp:0, avatar:{ color: randChoice(['#8fb3ff','#ff8fb3','#8fffd1','#ffd18f','#c38fff','#8fff8f']), icon: randChoice(['⭐','⚔️','🛡️','🔥','❄️','⚡','🌿','💎']), motto:'', image:null }, createdAt: now - randInt(1,120)*86400_000, lastLoginAt: now - randInt(0,7)*86400_000 },
            teamSlots, team: Array.from({length:teamSlots}, ()=>null), seen:{}, gold:0, gems:0, pulls:0, essence:0, cores:0
          };
          const pool = (()=>{
            const r=[...Array(24)].map((_,k)=>'r'+(k+1));
            const sr=[...Array(10)].map((_,k)=>'sr'+(k+1));
            const ssr=[...Array(24)].map((_,k)=>'ssr'+(k+1));
            const ur=[...Array(17)].map((_,k)=>'ur'+(k+1));
            const pickAll=(...a)=>a.flat();
            if(tier.name==='Iron') return pickAll(r, sr.slice(0,4));
            if(tier.name==='Bronze') return pickAll(r, sr);
            if(tier.name==='Silver') return pickAll(sr, ssr.slice(0,8));
            if(tier.name==='Gold') return pickAll(sr, ssr, ur.slice(0,2));
            if(tier.name==='Platinum') return pickAll(ssr, ur.slice(0,6));
            if(tier.name==='Emerald') return pickAll(ssr, ur);
            if(tier.name==='Diamond') return pickAll(ur, ssr);
            return pickAll(r,sr);
          })();
          for(let s=0;s<teamSlots;s++) saveObj.team[s] = randChoice(pool);
          setUserSave(uid, saveObj);
          qUpsertScore.run(uid, score, now);
          qUpsertRebirth.run(uid, randInt(0,25), now);

          created += 1;
        }
      }
    }

    try{
      const curSeason = seasonKeyForDate(new Date());
      const top10 = db.prepare(`
        SELECT user_id as uid, pvp_points as pts
        FROM arena_ratings
        WHERE season_key = ?
        ORDER BY pts DESC
        LIMIT 10
      `).all(curSeason);
      const topSet = new Set(top10.map(r=>r.uid));
      const botsInTop = db.prepare(`
        SELECT COUNT(*) as c
        FROM users u
        JOIN arena_ratings ar ON ar.user_id=u.id
        WHERE u.is_bot=1 AND ar.season_key=?
        ORDER BY ar.pvp_points DESC
        LIMIT 10
      `).get(curSeason);
      if(top10.length < 10){
        const candidates = db.prepare(`
          SELECT u.id as uid
          FROM users u
          JOIN arena_ratings ar ON ar.user_id=u.id
          WHERE u.is_bot=1 AND ar.season_key=?
          ORDER BY ar.pvp_points DESC
          LIMIT 30
        `).all(curSeason);
        let base = (top10[0]?.pts|0) + 250;
        for(let i=0;i<10-top10.length && i<candidates.length;i++){
          const uid = candidates[i].uid;
          if(topSet.has(uid)) continue;
          qUpsertArenaRating.run(uid, randInt(1550, 1650), 0,0,0,0, base + i*10, now);
        }
      }
    }catch(e){}

    if(created) console.log(`[MG] ensureBotsByDivision: +${created}`);
  }catch(e){
    console.warn('[MG] ensureBotsByDivision failed', e);
  }
}

ensureBotsByDivision();


function attachExistingBotsToSeason(){
  try{
    const cur = seasonKeyForDate(new Date());
    db.prepare(`
      UPDATE arena_ratings
      SET season_key = COALESCE(season_key, ?)
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = 1)
        AND (season_key IS NULL OR season_key = '')
    `).run(cur);
  }catch(e){
  }
}
attachExistingBotsToSeason();

function normalizeExistingBotSeasonPoints(){
  try{
    const curSeason = seasonKeyForDate(new Date());

    const ladderIdx = new Map(PVP_POINTS_LADDER.map((x,i)=>[`${x.tier}:${x.div}`, i]));
    const pointsRangeForTierDiv = (tierName, div)=>{
      const idx = ladderIdx.get(`${tierName}:${div}`);
      if(idx == null) return [0, 300];
      const cur = PVP_POINTS_LADDER[idx];
      const next = PVP_POINTS_LADDER[idx+1] || null;
      const lo = cur.min;
      const hi = next ? Math.max(lo, next.min - 1) : (lo + 12000);
      const pad = Math.min(500, Math.floor((hi-lo)*0.15));
      return [lo, Math.max(lo, hi - pad)];
    };

    const bots = db.prepare(`
      SELECT u.id as uid, COALESCE(ar.rating,800) as rating, COALESCE(ar.pvp_points,0) as pts
      FROM users u
      JOIN arena_ratings ar ON ar.user_id=u.id
      WHERE u.is_bot=1 AND ar.season_key=?
    `).all(curSeason);

    let changed = 0;
    const now = Date.now();
    for(const b of bots){
      const rk = pvpTierFromRating(Number(b.rating)||800);
      const [lo, hi] = pointsRangeForTierDiv(rk.name, rk.division);
      const pts = Number(b.pts)||0;
      if(pts < lo){
        db.prepare(`UPDATE arena_ratings SET pvp_points=?, updated_at=? WHERE user_id=?`).run(randInt(lo, hi), now, b.uid);
        changed++;
      }
    }
    if(changed) console.log(`[MG] normalizeExistingBotSeasonPoints: fixed ${changed}`);
  }catch(e){
  }
}
normalizeExistingBotSeasonPoints();

function ensureMasterTop10PointFloor(){
  try{
    const curSeason = seasonKeyForDate(new Date());
    const now = Date.now();
    const DIAMOND1_MIN = (PVP_POINTS_LADDER.find(x=>x.tier==='Diamond' && x.div===1)?.min) ?? 82500;
    const TARGET_TOP1 = Math.max(DIAMOND1_MIN + 8000, 90000);

    const top1 = db.prepare(`
      SELECT COALESCE(MAX(ar.pvp_points),0) as m
      FROM arena_ratings ar
      WHERE ar.season_key=?
    `).get(curSeason);
    const maxPts = Number(top1?.m)||0;
    if(maxPts >= TARGET_TOP1) return;

    const bots = db.prepare(`
      SELECT u.id as uid
      FROM users u
      JOIN arena_ratings ar ON ar.user_id=u.id
      WHERE u.is_bot=1 AND ar.season_key=?
      ORDER BY ar.pvp_points DESC
      LIMIT 20
    `).all(curSeason);
    if(!bots.length) return;

    for(let i=0;i<10 && i<bots.length;i++){
      const uid = bots[i].uid;
      const pts = TARGET_TOP1 + i*250 + randInt(0,120);
      db.prepare(`UPDATE arena_ratings SET pvp_points=?, updated_at=? WHERE user_id=?`).run(pts, now, uid);
    }
    console.log(`[MG] ensureMasterTop10PointFloor: boosted bots to ~${TARGET_TOP1}+`);
  }catch(e){
  }
}
ensureMasterTop10PointFloor();

function clampExistingBotScores(){
  try{
    const bots = db.prepare(`
      SELECT u.id as uid, l.score as score, COALESCE(ar.rating, 800) as rating
      FROM users u
      JOIN leaderboard l ON l.user_id = u.id
      LEFT JOIN arena_ratings ar ON ar.user_id = u.id
      WHERE u.is_bot = 1
    `).all();

    const caps = { Iron:2000, Bronze:4500, Silver:7000, Gold:16000, Platinum:28000, Emerald:42000, Diamond:60000, Master:80000 };
    const now = Date.now();
    for(const b of bots){
      const tier = pvpTierFromRating(Number(b.rating)||800);
      const cap = caps[tier.name] || 7000;
      let s = Number(b.score)||0;
      if(tier.name === "Iron" && s < 600) s = randInt(650, 1400);
      if(tier.name === "Bronze" && s < 1400) s = randInt(1500, 3200);
      if(tier.name === "Silver" && s < 2800) s = randInt(3000, 5600);
      if(s > cap) s = cap - randInt(0, Math.max(50, Math.floor(cap*0.12)));
      if(s !== Number(b.score)){
        qUpsertScore.run(b.uid, Math.max(10, Math.floor(s)), now);
      }
    }
  }catch(e){
  }
}
clampExistingBotScores();


function eloUpdate(myRating, oppRating, win){
  const K = 18;
  const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  const score = win ? 1 : 0;
  const delta = Math.round(K * (score - expected));
  return delta;
}

function runDailyArenaSimIfNeeded(){
  try{
    const key = 'arena_daily_sim_key_v1';
    const today = todayKeyLocal();
    const row = db.prepare('SELECT value FROM app_meta WHERE key=?').get(key);
    const last = row ? parseInt(row.value||'0',10) : 0;
    if(last >= today) return;

    const curSeason = seasonKeyForDate(new Date());

    const botRows = db.prepare(`
      SELECT u.id as uid,
             COALESCE(ar.rating,800) as rating,
             COALESCE(ar.wins,0) as wins,
             COALESCE(ar.losses,0) as losses,
             COALESCE(ar.win_streak,0) as win_streak,
             COALESCE(ar.loss_streak,0) as loss_streak,
             COALESCE(ar.pvp_points,0) as pts,
             COALESCE(l.score,0) as power
      FROM users u
      LEFT JOIN arena_ratings ar ON ar.user_id=u.id
      LEFT JOIN leaderboard l ON l.user_id=u.id
      WHERE u.is_bot=1
    `).all();

    if(botRows.length){
      const byUid = { }
      for(const b of botRows) byUid[b.uid]=b;

      for(const b of botRows){
        for(let k=0;k<3;k++){
          const cand = botRows[Math.floor(Math.random()*botRows.length)];
          if(!cand || cand.uid===b.uid) continue;
          const p = winProbPower(b.power, cand.power);
          const bWin = Math.random() < p;

          const d1 = eloUpdate(b.rating, cand.rating, bWin);
          const d2 = eloUpdate(cand.rating, b.rating, !bWin);
          b.rating = Math.max(0, (b.rating|0) + d1);
          cand.rating = Math.max(0, (cand.rating|0) + d2);

          const baseWinPts = 8;
          const baseLossPts = 4;
          const pointsDeltaB = bWin ? baseWinPts : -baseLossPts;
          const pointsDeltaO = bWin ? -baseLossPts : baseWinPts;
          b.pts = Math.max(0, (b.pts|0) + pointsDeltaB);
          cand.pts = Math.max(0, (cand.pts|0) + pointsDeltaO);
        }
      }

      const now = Date.now();
      for(const b of botRows){
        qUpsertArenaRating.run(b.uid, b.rating|0, b.wins|0, b.losses|0, b.win_streak|0, b.loss_streak|0, b.pts|0, now);
        try{ db.prepare('UPDATE arena_ratings SET season_key=? WHERE user_id=?').run(curSeason, b.uid); }catch(e){}
      }
    }

    try{
      const humans = db.prepare(`
        SELECT u.id as uid, COALESCE(ar.rating,800) as rating, COALESCE(ar.pvp_points,0) as pts
        FROM users u
        JOIN arena_ratings ar ON ar.user_id=u.id
        WHERE u.is_bot=0
      `).all();
      const now = Date.now();
      for(const h of humans){
        const drift = randInt(-8, 8);
        const newR = Math.max(0, (h.rating|0) + drift);
        if(newR !== (h.rating|0)){
          qUpsertArenaRating.run(h.uid, newR, 0,0,0,0, h.pts|0, now);
        }
      }
    }catch(e){}

    db.prepare('INSERT OR REPLACE INTO app_meta(key,value) VALUES(?,?)').run(key, String(today));
    console.log('[MG] Daily arena sim ran for', today);

    try{ ensureBotsByDivision(); }catch(e){}
  }catch(e){
    console.warn('[MG] runDailyArenaSimIfNeeded failed', e);
  }
}

runDailyArenaSimIfNeeded();
setInterval(runDailyArenaSimIfNeeded, 60_000);

function resetArenaForHumansOnce(){
  try{
    const key = "arena_reset_humans_v2_2025_12";
    const row = db.prepare("SELECT value FROM app_meta WHERE key=?").get(key);
    if(row && row.value) return;

    const baseRating = 800;
    db.prepare(`
      UPDATE arena_ratings
      SET rating=?, wins=0, losses=0, win_streak=0, loss_streak=0,
          pvp_points=0,
          daily_rank_claim_key=NULL,
          season_claimed_key=NULL,
          updated_at=?
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = 0)
    `).run(baseRating, Date.now());

    db.exec(`
      DELETE FROM arena_fights
      WHERE user_id IN (SELECT id FROM users WHERE is_bot = 0)
         OR opponent_id IN (SELECT id FROM users WHERE is_bot = 0)
    `);

    db.prepare("INSERT OR REPLACE INTO app_meta(key, value) VALUES(?,?)").run(key, String(Date.now()));
    console.log("[MG] PvP arena reset applied for humans");
  }catch(e){
    console.warn("[MG] PvP arena reset failed", e);
  }
}

resetArenaForHumansOnce();

function getOrInitArena(uid){
  const row = qGetArenaRating.get(uid);
  if(row) return row;
  const base = { rating: 800, wins: 0, losses: 0, win_streak: 0, loss_streak: 0, pvp_points: 0, updated_at: Date.now() };
  qUpsertArenaRating.run(uid, base.rating, base.wins, base.losses, base.win_streak, base.loss_streak, base.pvp_points, base.updated_at);
  return base;
}



function romanDivision(div){
  switch(Number(div)||0){
    case 5: return "V";
    case 4: return "IV";
    case 3: return "III";
    case 2: return "II";
    case 1: return "I";
    default: return "";
  }
}

function pvpTierFromRating(rating){
  const r = Math.max(0, Number(rating)||0);
  let best = PVP_TIERS[0];
  for(const it of PVP_TIERS){
    if(r >= it.start) best = it;
  }
  const step = Math.max(1, best.step|0);
  const idx = Math.max(0, Math.floor((r - best.start) / step));
  const division = Math.max(1, 5 - Math.min(4, idx));
  const display = best.pl || best.name;
  const label = `${best.badge} ${display} ${romanDivision(division)}`.trim();
  return { name: best.name, badge: best.badge, division, label, display };
}

function pvpRank(rating, isMaster=false){
  if(isMaster){
    return { name: "Master", badge: "👑", division: null, label: "👑 Mistrz", display: "Mistrz" };
  }
  return pvpTierFromRating(rating);
}

function pvpRankFromPoints(points, isMaster=false){
  if(isMaster){
    return { name: "Master", badge: "👑", division: null, label: "👑 Mistrz", display: "Mistrz" };
  }
  const cur = pointsTier(points|0).current;
  const plMap = {
    Iron: "Żelazo",
    Bronze: "Brąz",
    Silver: "Srebro",
    Gold: "Złoto",
    Platinum: "Platyna",
    Emerald: "Szmaragd",
    Diamond: "Diament",
  };
  const badgeMap = {
    Iron: "📌",
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Platinum: "💠",
    Emerald: "🟩",
    Diamond: "💎",
  };
  const name = cur.tier;
  const division = cur.div;
  const display = plMap[name] || name;
  const badge = badgeMap[name] || "";
  const label = `${badge} ${display} ${romanDivision(division)}`.trim();
  return { name, badge, division, label, display };
}

function pvpRankOrderServer(rank){
  try{
    if(!rank || !rank.name) return 0;
    if(rank.name === "Master") return 999;
    const tierOrder = { Iron:1, Bronze:2, Silver:3, Gold:4, Platinum:5, Emerald:6, Diamond:7 };
    const t = tierOrder[rank.name] || 0;
    const div = Math.max(1, Math.min(5, Number(rank.division||5)));
    return (t*10) + (6-div);
  }catch(e){ return 0; }
}

function seasonKeyForDate(d=new Date()){
  const y = d.getFullYear();
  const m = d.getMonth()+1; // 1-12
  return `${y}-${String(m).padStart(2,"0")}`;
}

function prevSeasonKey(curKey){
  const m = String(curKey||"").match(/^(\d{4})-(\d{2})$/);
  if(!m) return null;
  let y = Number(m[1]);
  let mo = Number(m[2]);
  mo -= 1;
  if(mo <= 0){ mo = 12; y -= 1; }
  return `${y}-${String(mo).padStart(2,"0")}`;
}

const DAILY_RANK_REWARDS = {
  Iron:     { gems: 40,   gold: 2000 },
  Bronze:   { gems: 80,   gold: 3000 },
  Silver:   { gems: 200,  gold: 6000 },
  Gold:     { gems: 450,  gold: 12000 },
  Platinum: { gems: 900,  gold: 22000 },
  Emerald:  { gems: 1400, gold: 30000 },
  Diamond:  { gems: 2000, gold: 40000 },
  Master:   { gems: 3000, gold: 60000 },
};

const SEASON_RANK_REWARDS = {
  Iron:     { gems: 1200,  gold: 45000 },
  Bronze:   { gems: 2000,  gold: 60000 },
  Silver:   { gems: 5000,  gold: 120000 },
  Gold:     { gems: 9000,  gold: 200000 },
  Platinum: { gems: 12000, gold: 280000 },
  Emerald:  { gems: 14000, gold: 340000 },
  Diamond:  { gems: 16000, gold: 400000 },
  Master:   { gems: 24000, gold: 600000 },
};

function todayKeyLocal(){
  const d = new Date();
  return d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
}

function ensureSeasonUpToDate(uid){
  const ar = getOrInitArena(uid);
  const cur = seasonKeyForDate(new Date());
  const existingKey = ar.season_key || null;

  if(!existingKey){
    db.prepare("UPDATE arena_ratings SET season_key=? WHERE user_id=?").run(cur, uid);
    return { ...ar, season_key: cur };
  }

  if(existingKey !== cur){
    db.prepare(`
      UPDATE arena_ratings
      SET last_season_key=?,
          last_season_rating=rating,
          last_season_points=COALESCE(pvp_points,0),
          last_season_wins=COALESCE(wins,0),
          last_season_losses=COALESCE(losses,0),
          season_key=?,
          pvp_points=0,
          wins=0,
          losses=0,
          win_streak=0,
          loss_streak=0,
          updated_at=?
      WHERE user_id=?
    `).run(existingKey, cur, Date.now(), uid);
    return getOrInitArena(uid);
  }
  return ar;
}

function winProbPower(myP, oppP){
  const a = Math.max(1, Number(myP)||1);
  const b = Math.max(1, Number(oppP)||1);
  const ratio = a / b;
  const x = Math.log(ratio); // symmetric
  const p = 1 / (1 + Math.exp(-x * 2.2));
  return Math.min(0.97, Math.max(0.03, p));
}

function winProbCombined(myP, oppP, myRating, oppRating){
  const pPower = winProbPower(myP, oppP);
  const pRating = 1 / (1 + Math.pow(10, ((oppRating|0) - (myRating|0)) / 500));
  const p = (0.7 * pPower) + (0.3 * pRating);
  return Math.min(0.97, Math.max(0.03, p));
}


function elementMultiplier(atkEl, defEl){
  if(!atkEl) atkEl = "";
  if(!defEl) defEl = "";

  if(atkEl === "Limited") return 1.12;
  if(defEl === "Limited") return 0.90; // Limited is sturdy vs everything

  const adv = {
    "Legenda": "FNAF",
    "FNAF": "Elo żelo",
    "Elo żelo": "Legenda",
  };
  if(adv[atkEl] === defEl) return 1.20;
  if(adv[defEl] === atkEl) return 0.85;
  return 1.00;
}

function normalizeElements(arr){
  if(!Array.isArray(arr)) return [];
  return arr.map(x=>String(x||"").trim()).filter(Boolean).slice(0, 8);
}

function pickElementCycle(list, idx){
  if(!list || !list.length) return "";
  return list[idx % list.length];
}

function simulatePvpBattle(myP, oppP, myEls, oppEls, seed){
  const rng = (function mulberry32(a){
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(seed>>>0);

  const A = max1(Number(myP)||0);
  const B = max1(Number(oppP)||0);
  const aEls = normalizeElements(myEls);
  const bEls = normalizeElements(oppEls);

  let myHp = 100;
  let oppHp = 100;
  const log = [];

  const firstMe = (rng() < (0.45 + 0.20 * clamp01((A - B) / (A + B + 1)))) ;
  let attacker = firstMe ? "me" : "opp";

  const maxRounds = 24;
  for(let t=0; t<maxRounds && myHp>0 && oppHp>0; t++){
    const atkP = attacker === "me" ? A : B;
    const defP = attacker === "me" ? B : A;

    const share = atkP / (atkP + defP);
    const base = 10 + (share * 26); // 10..36

    const atkEl = attacker === "me" ? pickElementCycle(aEls, t) : pickElementCycle(bEls, t);
    const defEl = attacker === "me" ? pickElementCycle(bEls, t) : pickElementCycle(aEls, t);
    const em = elementMultiplier(atkEl, defEl);

    const variance = 0.92 + rng() * 0.16; // ±8%
    let dmg = base * em * variance;

    const crit = rng() < 0.08;
    if(crit) dmg *= 1.6;

    dmg = Math.max(3, Math.floor(dmg));

    if(attacker === "me") oppHp = Math.max(0, oppHp - dmg);
    else myHp = Math.max(0, myHp - dmg);

    log.push({
      turn: t + 1,
      attacker,
      atkEl,
      defEl,
      mult: Number(em.toFixed(2)),
      dmg,
      crit,
      myHp,
      oppHp,
    });

    attacker = attacker === "me" ? "opp" : "me";
  }

  if(myHp > 0 && oppHp > 0){
    if(myHp === oppHp){
      if(A >= B) oppHp = 0;
      else myHp = 0;
    } else {
      if(myHp > oppHp) oppHp = 0;
      else myHp = 0;
    }
    const last = log[log.length-1];
    if(last){ last.myHp = myHp; last.oppHp = oppHp; }
  }

  const win = (oppHp <= 0 && myHp > 0);
  return { win, log };
}

function max1(n){ return (Number.isFinite(n) && n > 1) ? n : 1; }
function clamp01(x){ x = Number(x)||0; return x < 0 ? 0 : (x > 1 ? 1 : x); }

function pvpRewardsForResult(win, myRating, oppRating){
  const diff = (oppRating|0) - (myRating|0);
  const up = Math.max(-400, Math.min(400, diff));
  const bonus = 1 + (up / 1200);
  const baseGold = win ? 1800 : 600;
  const baseGems = win ? 6 : 2;
  return {
    gold: Math.max(0, Math.floor(baseGold * bonus)),
    gems: Math.max(0, Math.floor(baseGems * bonus)),
  };
}

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer\s+(.+)$/i);
  if(!m) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/register", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const login = String(req.body?.login || "").trim();
  const nick = String(req.body?.nick || "").trim();
  const password = String(req.body?.password || "");
  if(email.length < 3 || !email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if(login.length < 3) return res.status(400).json({ error: "Login musi mieć min. 3 znaki" });
  if(!/^[a-zA-Z0-9_.-]+$/.test(login)) return res.status(400).json({ error: "Login może mieć tylko litery/cyfry i ._-" });
  if(nick.length < 2) return res.status(400).json({ error: "Nick musi mieć min. 2 znaki" });
  if(password.length < 6) return res.status(400).json({ error: "Hasło musi mieć min. 6 znaków" });

  const existsEmail = qFindUserByEmail.get(email);
  if(existsEmail) return res.status(409).json({ error: "Konto z tym emailem już istnieje" });
  const existsLogin = qFindUserByLogin.get(login);
  if(existsLogin) return res.status(409).json({ error: "Ten login jest zajęty" });

  const hash = await bcrypt.hash(password, 12);
  const info = qInsertUser.run(email, login, nick, hash, Date.now());
  const user = { id: info.lastInsertRowid, email, login, nick };
  const token = signToken(user);
  res.json({ token });
});

app.post("/api/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const login = String(req.body?.login || "").trim();
  const password = String(req.body?.password || "");
  if(email.length < 3 || !email.includes("@")) return res.status(400).json({ error: "Invalid email" });
  if(login.length < 3) return res.status(400).json({ error: "Invalid login" });
  const user = qFindUserByEmail.get(email);
  if(!user) return res.status(401).json({ error: "Złe dane logowania" });
  if(user.login !== login) return res.status(401).json({ error: "Złe dane logowania" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok) return res.status(401).json({ error: "Złe dane logowania" });
  const token = signToken(user);
  res.json({ token });
});

app.get("/api/me", auth, (req, res) => {
  const u = qFindUserById.get(req.user.uid);
  if(!u) return res.status(401).json({ error: "Invalid user" });
  res.json({ email: u.email, login: u.login, nick: u.nick, uid: u.id });
});

app.get("/api/save", auth, (req, res) => {
  const row = qGetSave.get(req.user.uid);
  if (!row) return res.json({ save: null, updated_at: null });
  const save = safeParseJSON(row.save_json);
  if (!save) return res.json({ save: null, updated_at: row.updated_at || null });
  res.json({ save, updated_at: row.updated_at || null });
});

app.put("/api/save", auth, (req, res) => {
  const saveObj = req.body?.save;
  if (!saveObj || typeof saveObj !== "object") {
    return res.status(400).json({ error: "Invalid save" });
  }
  try {
    setUserSave(req.user.uid, saveObj);
    res.json({ ok: true });
  } catch (e) {
    console.error("[MG] /api/save failed", e);
    res.status(500).json({ error: "Save failed" });
  }
});

app.get("/api/debug/dbinfo", auth, (req, res) => {
  const u = qFindUserById.get(req.user.uid);
  const sv = qGetSave.get(req.user.uid);
  res.json({ uid: req.user.uid, email: u?.email, login: u?.login, nick: u?.nick, db_path: DB_PATH, has_save: !!sv, updated_at: sv?.updated_at || null });
});

app.get("/api/users/search", auth, (req, res) => {
  const q = String(req.query.q || "").trim();
  if(q.length < 2) return res.json({ users: [] });
  const like = `%${q}%`;
  const rows = qSearchUsers.all(like, like).map(r => ({ login: r.login, nick: r.nick }));
  res.json({ users: rows });
});

app.get("/api/friends/list", auth, (req, res) => {
  const rows = qFriendsList.all(req.user.uid).map(r => ({
    login: r.login,
    nick: r.nick,
    avatar: getAvatarForUserId(r.uid)
  }));
  res.json({ friends: rows });
});

app.get("/api/friends/requests", auth, (req, res) => {
  const incoming = qReqIncoming.all(req.user.uid).map(r => ({
    id: r.id,
    from_login: r.from_login,
    from_nick: r.from_nick,
    from_avatar: getAvatarForUserId(r.from_uid),
    created_at: r.created_at
  }));
  const outgoing = qReqOutgoing.all(req.user.uid).map(r => ({
    id: r.id,
    to_login: r.to_login,
    to_nick: r.to_nick,
    to_avatar: getAvatarForUserId(r.to_uid),
    created_at: r.created_at
  }));
  res.json({ incoming, outgoing });
});

app.post("/api/friends/request", auth, (req, res) => {
  const toLogin = String(req.body?.to_login || "").trim();
  if(toLogin.length < 3) return res.status(400).json({ error: "Podaj login" });
  const toUser = qFindUserByLogin.get(toLogin);
  if(!toUser) return res.status(404).json({ error: "Nie znaleziono użytkownika" });
  if(toUser.id === req.user.uid) return res.status(400).json({ error: "Nie możesz dodać siebie" });
  const already = db.prepare("SELECT 1 FROM friends WHERE user_id=? AND friend_user_id=?").get(req.user.uid, toUser.id);
  if(already) return res.status(409).json({ error: "Już jesteście znajomymi" });
  try {
    qReqCreate.run(req.user.uid, toUser.id, Date.now());
  } catch {
    return res.status(409).json({ error: "Zaproszenie już istnieje" });
  }
  res.json({ ok: true });
});

app.post("/api/friends/requests/:id/accept", auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const fr = qReqGet.get(id);
  if(!fr) return res.status(404).json({ error: "Nie znaleziono zaproszenia" });
  if(fr.to_user !== req.user.uid) return res.status(403).json({ error: "Brak dostępu" });
  if(fr.status !== "pending") return res.status(400).json({ error: "Zaproszenie nie jest aktywne" });
  const now = Date.now();
  qReqSetStatus.run("accepted", id);
  qFriendAdd.run(fr.from_user, fr.to_user, now);
  qFriendAdd.run(fr.to_user, fr.from_user, now);
  res.json({ ok: true });
});

app.post("/api/friends/requests/:id/decline", auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const fr = qReqGet.get(id);
  if(!fr) return res.status(404).json({ error: "Nie znaleziono zaproszenia" });
  if(fr.to_user !== req.user.uid) return res.status(403).json({ error: "Brak dostępu" });
  if(fr.status !== "pending") return res.status(400).json({ error: "Zaproszenie nie jest aktywne" });
  qReqSetStatus.run("declined", id);
  res.json({ ok: true });
});

app.delete("/api/friends/remove/:login", auth, (req, res) => {
  const login = String(req.params.login || "").trim();
  if(login.length < 3) return res.status(400).json({ error: "Nieprawidłowy login" });
  const other = qFindUserByLogin.get(login);
  if(!other) return res.status(404).json({ error: "Nie znaleziono użytkownika" });
  if(other.id === req.user.uid) return res.status(400).json({ error: "Nie możesz usunąć siebie" });

  qFriendDel.run(req.user.uid, other.id);
  qFriendDel.run(other.id, req.user.uid);
  qReqDelPair.run(req.user.uid, other.id, other.id, req.user.uid);
  res.json({ ok: true });
});


app.post("/api/leaderboard/submit", auth, (req, res) => {
  const score = Number(req.body?.score);
  if(!Number.isFinite(score)) return res.status(400).json({ error: "Invalid score" });
  qUpsertScore.run(req.user.uid, score, Date.now());
  res.json({ ok: true });
});

app.get("/api/leaderboard/top", (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "100"), 10) || 100));
  const rows = qTop.all(limit).map(r => ({
    login: r.login,
    nick: r.nick,
    email: r.email,
    score: r.score,
    updated_at: r.updated_at,
    avatar: getAvatarForUserId(r.uid)
  }));
  res.json({ top: rows });
});

app.post("/api/leaderboard/rebirth/submit", auth, (req, res) => {
  const rebirths = Number(req.body?.rebirths);
  if(!Number.isFinite(rebirths)) return res.status(400).json({ error: "Invalid rebirths" });
  qUpsertRebirth.run(req.user.uid, Math.max(0, Math.floor(rebirths)), Date.now());
  res.json({ ok: true });
});


app.get("/api/leaderboard/find", auth, (req, res) => {
  const nickQ = String(req.query?.nick || "").trim();
  if(!nickQ) return res.status(400).json({ error: "Missing nick" });

  const qFind = db.prepare(`
    SELECT u.id as uid, u.login as login, u.nick as nick, COALESCE(l.score, 0) as score
    FROM users u
    LEFT JOIN leaderboard l ON l.user_id = u.id
    WHERE lower(u.nick) = lower(?)
    LIMIT 10
  `);
  const rows = qFind.all(nickQ);
  if(!rows.length) return res.status(404).json({ error: "Not found" });

  const qRank = db.prepare("SELECT 1 + COUNT(*) as rank FROM leaderboard WHERE score > ?");
  const qTotal = db.prepare("SELECT COUNT(*) as total FROM leaderboard");
  const total = qTotal.get()?.total || 0;

  const out = rows.map(r=>{
    const rank = qRank.get(r.score||0)?.rank || null;
    return {
      uid: r.uid,
      login: r.login,
      nick: r.nick,
      score: r.score||0,
      rank,
      total,
      avatar: getAvatarForUserId(r.uid)
    };
  });
  res.json({ results: out });
});

app.get("/api/leaderboard/rebirth/top", (req, res) => {
  const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit || "100"), 10) || 100));
  const rows = qTopRebirth.all(limit).map(r => ({
    login: r.login,
    nick: r.nick,
    email: r.email,
    rebirths: r.rebirths,
    updated_at: r.updated_at,
    avatar: getAvatarForUserId(r.uid)
  }));
  res.json({ top: rows });
});

app.get("/api/arena/pvp/me", auth, (req, res) => {
  const ar0 = ensureSeasonUpToDate(req.user.uid);
  const me = qFindUserById.get(req.user.uid);
  if(!me) return res.status(401).json({ error: "Invalid user" });
  const save = getUserSave(req.user.uid) || {};
  const lvl = Number(save?.player?.level) || 1;
  const teamSize = pvpTeamSizeForLevel(lvl);
  const ar = ar0 || getOrInitArena(req.user.uid);
  const ptsProg = pointsTier(ar.pvp_points|0);
  const curSeason = ar.season_key || seasonKeyForDate(new Date());
  const top10 = new Set(qSeasonTop10.all(curSeason).map(r => r.uid));
  const isMaster = top10.has(req.user.uid);
  const scoreRow = qGetScore.get(req.user.uid);
  const myPower = Number(scoreRow?.score) || 0;
  const team = Array.isArray(save?.team) ? save.team.slice(0, teamSize).filter(Boolean) : [];
  const teamDetails = buildTeamDetails(save, teamSize);
  res.json({
    uid: req.user.uid,
    login: me.login,
    nick: me.nick,
    avatar: extractPublicAvatar(save),
    rating: ar.rating,
    rank: pvpRankFromPoints(ar.pvp_points|0, isMaster),
    wins: ar.wins,
    losses: ar.losses,
    pvp_points: ar.pvp_points,
    points_rank: {
      current: ptsProg.current,
      next: ptsProg.next,
    },
    points_ladder: PVP_POINTS_LADDER,
    season_key: ar.season_key || seasonKeyForDate(new Date()),
    myPower,
    level: lvl,
    teamSize,
    team,
    teamDetails
  });
});

app.get("/api/arena/pvp/opponents", auth, (req, res) => {
  ensureSeasonUpToDate(req.user.uid);
  const limit = Math.max(3, Math.min(20, parseInt(String(req.query.limit || "8"), 10) || 8));
  const poolSize = Math.max(30, Math.min(120, limit * 12));

  const myAr = getOrInitArena(req.user.uid);
  const myPowerRow = qGetScore.get(req.user.uid);
  const myPower = myPowerRow ? Number(myPowerRow.score) || 0 : 0;
  const curSeason = seasonKeyForDate(new Date());
  const top10 = new Set(qSeasonTop10.all(curSeason).map(r => r.uid));
  const myIsMaster = top10.has(req.user.uid);
  const myRank = pvpRankFromPoints(myAr.pvp_points|0, myIsMaster);

  function powerOK(oppPower){
    const p = Number(oppPower)||0;
    if(myPower <= 0) return true;
    if(myRank.name === "Iron") return p <= Math.min(2500, Math.floor(myPower*1.55) + 350);
    if(myRank.name === "Bronze") return p <= Math.min(5500, Math.floor(myPower*1.65) + 650);
    if(myRank.name === "Silver") return p <= Math.min(9000, Math.floor(myPower*1.75) + 950);
    return p <= Math.floor(myPower*2.25) + 1600;
  }

  function tierIndex(name){
    return ["Iron","Bronze","Silver","Gold","Platinum","Emerald","Diamond","Master"].indexOf(name);
  }
  function canFace(oppRank){
    if(myRank.name === "Master") return (oppRank.name === "Master" || oppRank.name === "Diamond");
    if(myRank.name === "Diamond") return (oppRank.name === "Diamond" || oppRank.name === "Master");
    if(oppRank.name === myRank.name) return true;
    const mi = tierIndex(myRank.name);
    const oi = tierIndex(oppRank.name);
    if(mi >= 0 && oi === mi + 1) {
      return (oppRank.division === 5); // lowest of next tier
    }
    return false;
  }

  const rows = qOpponentsRandom.all(req.user.uid, poolSize);
  const out = [];
  for(const r of rows){
    if(out.length >= limit) break;
    const save = getUserSave(r.uid) || {};
    const lvl = Number(save?.player?.level) || 1;
    const teamSize = pvpTeamSizeForLevel(lvl);
    const team = Array.isArray(save?.team) ? save.team.slice(0, teamSize).filter(Boolean) : [];
    const teamDetails = buildTeamDetails(save, teamSize);
    const ar = getOrInitArena(r.uid);
    const isMaster = top10.has(r.uid);
    const rk = pvpRankFromPoints(ar.pvp_points|0, isMaster);

    if(!canFace(rk)) continue;
    if(!powerOK(Number(r.score)||0)) continue;
    if(!powerOK(r.score)) continue;

    out.push({
      uid: r.uid,
      login: r.login,
      nick: r.nick,
      avatar: extractPublicAvatar(save),
      level: lvl,
      teamSize,
      team,
      teamDetails,
      teamPower: Number(r.score) || 0,
      rating: ar.rating,
      rank: rk,
      canFightToday: !qHasFoughtHour.get(req.user.uid, r.uid, utcHourKey()),
    });
  }
  res.json({ opponents: out, myRank });
});

app.get("/api/arena/pvp/points_leaderboard", auth, (req, res) => {
  ensureSeasonUpToDate(req.user.uid);
  const limit = Math.max(10, Math.min(100, parseInt(String(req.query.limit || "100"), 10) || 100));
  const rows = qPvpPointsLeaderboard.all(limit);
  const curSeason = seasonKeyForDate(new Date());
  const masterSet = new Set(qSeasonTop10.all(curSeason).map(r => r.uid));
  const out = rows.map((r, idx) => {
    const save = getUserSave(r.uid) || {};
    const lvl = Number(save?.player?.level) || 1;
    return {
      uid: r.uid,
      login: r.login,
      nick: r.nick,
      avatar: extractPublicAvatar(save),
      level: lvl,
      points: Number(r.points) || 0,
      wins: Number(r.wins) || 0,
      losses: Number(r.losses) || 0,
      rating: Number(r.rating) || 0,
      rank: pvpRank(Number(r.rating)||0, masterSet.has(r.uid)),
    };
  });
  res.json({ leaderboard: out });
});

app.get("/api/arena/pvp/masters_leaderboard", auth, (req, res) => {
  ensureSeasonUpToDate(req.user.uid);
  const curSeason = seasonKeyForDate(new Date());
  const top10 = qSeasonTop10.all(curSeason).map(r=>r.uid);
  const out = [];
  for(const uid of top10){
    const u = qFindUserByUid.get(uid);
    if(!u) continue;
    const ar = getOrInitArena(uid);
    const save = getUserSave(uid) || {};
    const lvl = Number(save?.player?.level) || 1;
    out.push({
      uid,
      login: u.login,
      nick: u.nick,
      avatar: extractPublicAvatar(save),
      level: lvl,
      points: Number(ar.pvp_points) || 0,
      wins: Number(ar.wins) || 0,
      losses: Number(ar.losses) || 0,
      rating: Number(ar.rating) || 0,
      rank: pvpRank(ar.rating, true),
      season_key: curSeason,
    });
  }
  res.json({ masters: out, season_key: curSeason });
});

app.get("/api/arena/pvp/rewards_state", auth, (req, res) => {
  const ar = ensureSeasonUpToDate(req.user.uid);
  const curSeason = ar.season_key || seasonKeyForDate(new Date());
  const isMasterNow = new Set(qSeasonTop10.all(curSeason).map(r => r.uid)).has(req.user.uid);
  const rankNow = pvpRank(ar.rating, isMasterNow);
  const today = todayKeyLocal();
  const canDaily = String(ar.daily_rank_claim_key||"") !== String(today);

  const prevKey = ar.last_season_key || null;
  const wasMasterPrev = prevKey ? new Set(qPrevSeasonTop10.all(prevKey).map(r => r.uid)).has(req.user.uid) : false;
  const prevRank = prevKey ? pvpRank(ar.last_season_rating, wasMasterPrev) : null;
  const canSeason = !!prevKey && String(ar.season_claimed_key||"") !== String(prevKey);

  const now = new Date();
  const nextDaily = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0,0).getTime();
  const nextSeasonStart = new Date(now.getFullYear(), now.getMonth()+1, 1, 0,0,0,0).getTime();
  res.json({
    rating: ar.rating,
    rank: rankNow,
    season_key: curSeason,
    daily: {
      canClaim: canDaily,
      claimedKey: ar.daily_rank_claim_key || null,
      reward: DAILY_RANK_REWARDS[rankNow.name] || DAILY_RANK_REWARDS.Iron,
      nextAt: nextDaily,
    },
    season: {
      canClaim: canSeason,
      lastSeasonKey: prevKey,
      lastSeasonRating: ar.last_season_rating,
      lastSeasonRank: prevRank,
      reward: prevRank ? (SEASON_RANK_REWARDS[prevRank.name] || SEASON_RANK_REWARDS.Iron) : null,
      nextSeasonStartsAt: nextSeasonStart,
    }
  });
});

app.post("/api/arena/pvp/claim_daily_rank", auth, (req, res) => {
  const ar = ensureSeasonUpToDate(req.user.uid);
  const today = todayKeyLocal();
  if(String(ar.daily_rank_claim_key||"") === String(today)){
    return res.status(409).json({ error: "Daily reward already claimed" });
  }
  const curSeason = ar.season_key || seasonKeyForDate(new Date());
  const isMasterNow = new Set(qSeasonTop10.all(curSeason).map(r => r.uid)).has(req.user.uid);
  const rk = pvpRank(ar.rating, isMasterNow);
  const reward = DAILY_RANK_REWARDS[rk.name] || DAILY_RANK_REWARDS.Iron;
  const save = getUserSave(req.user.uid) || {};
  save.gold = (Number(save.gold)||0) + (reward.gold|0);
  save.gems = (Number(save.gems)||0) + (reward.gems|0);
  setUserSave(req.user.uid, save);
  db.prepare("UPDATE arena_ratings SET daily_rank_claim_key=? WHERE user_id=?").run(String(today), req.user.uid);
  res.json({ ok:true, reward, rank: rk });
});

app.post("/api/arena/pvp/claim_season_rank", auth, (req, res) => {
  const ar = ensureSeasonUpToDate(req.user.uid);
  const prevKey = ar.last_season_key || null;
  if(!prevKey) return res.status(409).json({ error: "No finished season yet" });
  if(String(ar.season_claimed_key||"") === String(prevKey)){
    return res.status(409).json({ error: "Season reward already claimed" });
  }
  const wasMasterPrev = new Set(qPrevSeasonTop10.all(prevKey).map(r => r.uid)).has(req.user.uid);
  const rk = pvpRank(ar.last_season_rating, wasMasterPrev);
  const reward = SEASON_RANK_REWARDS[rk.name] || SEASON_RANK_REWARDS.Iron;
  const save = getUserSave(req.user.uid) || {};
  save.gold = (Number(save.gold)||0) + (reward.gold|0);
  save.gems = (Number(save.gems)||0) + (reward.gems|0);
  setUserSave(req.user.uid, save);
  db.prepare("UPDATE arena_ratings SET season_claimed_key=? WHERE user_id=?").run(String(prevKey), req.user.uid);
  res.json({ ok:true, reward, seasonKey: prevKey, rank: rk });
});

app.post("/api/arena/pvp/fight", auth, (req, res) => {
  ensureSeasonUpToDate(req.user.uid);
  const oppUid = parseInt(String(req.body?.opponent_uid || "0"), 10);
  if(!oppUid) return res.status(400).json({ error: "Missing opponent_uid" });
  if(oppUid === req.user.uid) return res.status(400).json({ error: "Invalid opponent" });

  const oppUser = qFindUserByUid.get(oppUid);
  if(!oppUser) return res.status(404).json({ error: "Opponent not found" });

  ensureSeasonUpToDate(oppUid);

  try{ ensureSeasonUpToDate(oppUid); }catch{}

  const hourKey = utcHourKey();
  if(qHasFoughtHour.get(req.user.uid, oppUid, hourKey)) {
    return res.status(409).json({ error: "Already fought this opponent this hour", nextInMs: ((hourKey+1)*3600000 - Date.now()) });
  }


  
const myScoreRow = qGetScore.get(req.user.uid);
const oppScoreRow = qGetScore.get(oppUid);

const bodyMyPower = Number(req.body?.my_power);
const bodyOppPower = Number(req.body?.opp_power);
const myPower = Number.isFinite(bodyMyPower) && bodyMyPower > 0 ? bodyMyPower : (Number(myScoreRow?.score) || 0);
const oppPower = Number.isFinite(bodyOppPower) && bodyOppPower > 0 ? bodyOppPower : (Number(oppScoreRow?.score) || 0);

const myElements = normalizeElements(req.body?.my_elements);
const oppElements = normalizeElements(req.body?.opp_elements);

const myAr = getOrInitArena(req.user.uid);
const oppAr = getOrInitArena(oppUid);

const curSeason = seasonKeyForDate(new Date());
const top10 = new Set(qSeasonTop10.all(curSeason).map(r => r.uid));
const myRank = pvpRankFromPoints(myAr.pvp_points|0, top10.has(req.user.uid));


const seed = ((Date.now()>>>0) ^ (req.user.uid*2654435761) ^ (oppUid*97531))>>>0;
const sim = simulatePvpBattle(myPower, oppPower, myElements, oppElements, seed);
const win = !!sim.win;

const est = winProbPower(myPower, oppPower);
const winProb = Number(est.toFixed(3));

  const K = 24;
  const expected = 1 / (1 + Math.pow(10, (oppAr.rating - myAr.rating) / 400));
  const score = win ? 1 : 0;
  const delta = Math.round(K * (score - expected));
  const newRating = Math.max(0, (myAr.rating|0) + delta);
  const newWins = (myAr.wins|0) + (win ? 1 : 0);
  const newLosses = (myAr.losses|0) + (win ? 0 : 1);

  const prevWinStreak = (myAr.win_streak|0) || 0;
  const prevLossStreak = (myAr.loss_streak|0) || 0;
  const winStreak = win ? Math.min(50, prevWinStreak + 1) : 0;
  const lossStreak = win ? 0 : Math.min(50, prevLossStreak + 1);

  const tierPts = {
    Iron:     { win: 8,  loss: 6 },
    Bronze:   { win: 10, loss: 7 },
    Silver:   { win: 12, loss: 8 },
    Gold:     { win: 14, loss: 9 },
    Platinum: { win: 18, loss: 11 },
    Emerald:  { win: 22, loss: 13 },
    Diamond:  { win: 28, loss: 16 },
    Master:   { win: 34, loss: 18 },
  };
  const baseWinPts = (tierPts[myRank.name]?.win ?? 12);
  const baseLossPts = (tierPts[myRank.name]?.loss ?? 8);
  const winBonus = win ? Math.min(10, Math.max(0, winStreak - 1) * 2) : 0;      // 2/4/6/8/10...
  const lossPenalty = win ? 0 : (baseLossPts + Math.min(10, Math.max(0, lossStreak - 1) * 2));
  const pointsDelta = win ? (baseWinPts + winBonus) : (-lossPenalty);

  const newPoints = Math.max(0, (myAr.pvp_points|0) + pointsDelta);

  const rankBefore = myRank;
  const rankAfter = pvpRankFromPoints(newPoints, top10.has(req.user.uid));
  const rankUp = pvpRankOrderServer(rankAfter) > pvpRankOrderServer(rankBefore);
  qUpsertArenaRating.run(req.user.uid, newRating, newWins, newLosses, winStreak, lossStreak, newPoints, Date.now());

  const rw = pvpRewardsForResult(win, myAr.rating, oppAr.rating);

  const oppSave = getUserSave(oppUid) || {};
  const oppLvl = Number(oppSave?.player?.level) || 1;
  const oppTeamSize = pvpTeamSizeForLevel(oppLvl);
  const oppTeam = Array.isArray(oppSave?.team) ? oppSave.team.slice(0, oppTeamSize).filter(Boolean) : [];
  const oppTeamDetails = buildTeamDetails(oppSave, oppTeamSize);

  qRecordFight.run(req.user.uid, oppUid, hourKey, Date.now());

res.json({
    result: win ? "win" : "loss",
    myPower,
    oppPower,
    winProb,
    battleLog: sim.log,
    rating: { before: myAr.rating, after: newRating, delta },
    pvp_points: { before: myAr.pvp_points|0, after: newPoints, delta: pointsDelta },
    rank_before: rankBefore,
    rank_after: rankAfter,
    rank_up: rankUp,
    rank_before: rankBefore,
    rank_after: rankAfter,
    rank_up: rankUp,
    streaks: { win: winStreak, loss: lossStreak },
    wl: { wins: newWins, losses: newLosses },
    rewards: rw,
    opponent: {
      uid: oppUid,
      login: oppUser.login,
      nick: oppUser.nick,
      avatar: extractPublicAvatar(oppSave),
      level: oppLvl,
      teamSize: oppTeamSize,
      team: oppTeam,
      teamDetails: oppTeamDetails,
      teamPower: oppPower,
      rating: oppAr.rating,
    }
  });
});

const publicDir = path.join(__dirname, "public");
app.use("/", express.static(publicDir, { extensions: ["html"] }));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "gra.html"));
});

export function startServer(p = PORT) {
  return new Promise((resolve) => {
    const server = app.listen(p, () => resolve(server));
  });
}

if (__argvHref && import.meta.url === __argvHref) {
  startServer().then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
