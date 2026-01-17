import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function getTgInitData() {
  return window?.Telegram?.WebApp?.initData || "";
}

function ClownCard({ u }) {
  const name = u.clown_name || u.first_name || u.username || `#${u.telegram_id}`;
  const updated = new Date(u.updated_at * 1000).toLocaleString();

  return (
    <div style={{
      border: "1px solid #2a2a2a",
      borderRadius: 16,
      padding: 14,
      background: "#111",
      color: "#fff"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{name}</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>@{u.username || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18 }}>🤡 Lv {u.level}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{updated}</div>
        </div>
      </div>

      <div style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 12,
        background: "#0b0b0b",
        border: "1px solid #222"
      }}>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Lokacija</div>
        <div style={{ fontSize: 16 }}>{u.location || "—"}</div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();
  }, []);

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  async function load() {
  try {
    setErr("");

    const initData = getTgInitData();

    const r = await fetch(`${API_BASE}/api/users`, {
      headers: {
        "x-telegram-init-data": initData
      }
    });

    if (!r.ok) {
      if (r.status === 401) throw new Error("Nisi u Telegram Web App-u");
      if (r.status === 403) throw new Error("Nisi registrovan klovn");
      throw new Error("API error");
    }

    setUsers(await r.json());
  } catch (e) {
    setErr(String(e.message || e));
  }
}
  

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => {
      const name = (u.clown_name || u.first_name || u.username || "").toLowerCase();
      const loc = (u.location || "").toLowerCase();
      return name.includes(s) || loc.includes(s);
    });
  }, [users, q]);

  return (
    <div style={{ minHeight: "100vh", background: "#070707", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "end",
          gap: 16,
          flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>
              Klovn Kafana Dashboard
            </div>
            <div style={{ opacity: 0.7, color: "#fff" }}>
              Ko je gde i koliki je klovn.
            </div>
          </div>

          <div style={{ minWidth: 260 }}>
            <div style={{ opacity: 0.7, color: "#fff", fontSize: 12 }}>
              Search (ime / lokacija)
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="npr. Laza / Centar / Djole"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #333",
                background: "#0b0b0b",
                color: "#fff"
              }}
            />
          </div>
        </div>

        {err ? (
          <div style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #a33",
            background: "#1a0b0b",
            color: "#fff"
          }}>
            Greška: {err} (da li API radi na {API_BASE}?)
          </div>
        ) : null}

        <div style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12
        }}>
          {filtered.map((u) => (
            <ClownCard key={u.telegram_id} u={u} />
          ))}
        </div>
      </div>
    </div>
  );
}