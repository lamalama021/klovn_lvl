import "dotenv/config";
import { Telegraf } from "telegraf";
import { db, now } from "./db.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:5173";
const GROUP_INVITE_URL = process.env.GROUP_INVITE_URL || "https://t.me/+xxxx";

function mainKeyboard() {
  return {
    keyboard: [
      ["🤡 Moj status", "⬆️ Level +1"],
      ["📍 Promeni lokaciju", "📊 Dashboard"],
      ["🍻 Uđi u grupu"]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

function upsertUser(ctx) {
  const u = ctx.from;
  const updated_at = now();
  const telegram_id = u.id;

  const exists = db.prepare(`SELECT telegram_id FROM users WHERE telegram_id=?`).get(telegram_id);

  if (exists) {
    db.prepare(`
      UPDATE users
      SET username=COALESCE(?, username),
          first_name=COALESCE(?, first_name),
          updated_at=?
      WHERE telegram_id=?
    `).run(u.username ?? null, u.first_name ?? null, updated_at, telegram_id);
  } else {
    db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, clown_name, level, location, updated_at)
      VALUES (?, ?, ?, NULL, 0, '', ?)
    `).run(telegram_id, u.username ?? null, u.first_name ?? null, updated_at);
  }

  return telegram_id;
}

function getUser(id) {
  return db.prepare(`SELECT * FROM users WHERE telegram_id=?`).get(id);
}

function statusText(row) {
  const name = row.clown_name || row.first_name || row.username || `#${row.telegram_id}`;
  return `🤡 ${name}\nLevel: ${row.level}\nLokacija: ${row.location || "-"}`;
}

bot.start(async (ctx) => {
  const id = upsertUser(ctx);
  const row = getUser(id);

  await ctx.reply(
    "Dobrodošao u Klovn Kafanu 🤡🍻\n\nKlikni dugmiće ispod ili koristi komande:\n/level 0-10\n/where <lokacija>\n/status",
    { reply_markup: mainKeyboard() }
  );

  // opcionalno: odmah pokaži status
  await ctx.reply(statusText(row));
});

bot.hears("🤡 Moj status", (ctx) => {
  const id = upsertUser(ctx);
  ctx.reply(statusText(getUser(id)));
});

bot.command("status", (ctx) => {
  const id = upsertUser(ctx);
  ctx.reply(statusText(getUser(id)));
});

bot.hears("⬆️ Level +1", (ctx) => {
  const id = upsertUser(ctx);
  db.prepare(`UPDATE users SET level=MIN(level+1, 10), updated_at=? WHERE telegram_id=?`).run(now(), id);
  ctx.reply(`✅ Level je sada ${getUser(id).level}`);
});

bot.command("level", (ctx) => {
  const id = upsertUser(ctx);
  const arg = ctx.message.text.split(" ").slice(1).join(" ").trim();
  const level = Number(arg);
  if (!Number.isFinite(level) || level < 0 || level > 10) return ctx.reply("Napiši: /level 0-10");
  db.prepare(`UPDATE users SET level=?, updated_at=? WHERE telegram_id=?`).run(level, now(), id);
  ctx.reply(`✅ Level setovan na ${level}`);
});

bot.hears("📍 Promeni lokaciju", (ctx) =>
  ctx.reply("Pošalji: /where <lokacija>\nPrimer: /where Kod Laze")
);

bot.command("where", (ctx) => {
  const id = upsertUser(ctx);
  const location = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!location) return ctx.reply("Napiši: /where <lokacija>");
  db.prepare(`UPDATE users SET location=?, updated_at=? WHERE telegram_id=?`).run(location, now(), id);
  ctx.reply(`📍 Lokacija upisana: ${location}`);
});

bot.hears("📊 Dashboard", async (ctx) => {
  await ctx.reply("📊 Otvori dashboard:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 Dashboard", web_app: { url: process.env.DASHBOARD_URL } }]
      ]
    }
  });
});

bot.hears("🍻 Uđi u grupu", (ctx) => ctx.reply(`🍻 Link grupe: ${GROUP_INVITE_URL}`));

bot.launch().then(() => console.log("Bot running"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

bot.command("dash", async (ctx) => {
  await ctx.reply("TEST WebApp dugme:", {
    reply_markup: {
      inline_keyboard: [[
        { text: "📊 OPEN DASHBOARD", web_app: { url: process.env.DASHBOARD_URL } }
      ]]
    }
  });
});