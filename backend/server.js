import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./db.js";
import QRCode from "qrcode";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/users", (req, res) => {
  const rows = db
    .prepare(
      `SELECT telegram_id, username, first_name, clown_name, level, location, updated_at
       FROM users
       ORDER BY updated_at DESC`
    )
    .all();
  res.json(rows);
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

// Create invite
app.post("/api/invite", (req, res) => {
  const code = "INV_" + Math.random().toString(36).slice(2, 10);
  const maxUses = Number(req.body?.max_uses || 0) || null;
  const now = Math.floor(Date.now() / 1000);

  db.prepare(
    `INSERT INTO invites (code, created_at, max_uses, uses)
     VALUES (?, ?, ?, 0)`
  ).run(code, now, maxUses);

  res.json({ code });
});

// QR for invite
app.get("/api/invite/:code/qr", async (req, res) => {
  const { code } = req.params;
  const invite = db.prepare(`SELECT code FROM invites WHERE code=?`).get(code);
  if (!invite) return res.status(404).send("Invalid invite");

  const botLink =
    process.env.BOT_LINK || "https://t.me/YOUR_BOT_USERNAME";

  const url = `${botLink}?start=${code}`;
  const png = await QRCode.toBuffer(url, { scale: 8 });

  res.setHeader("Content-Type", "image/png");
  res.send(png);
});