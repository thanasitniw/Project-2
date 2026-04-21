const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "asn.db");

// Ensure data directory exists
const fs = require("fs");
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// ── Schema ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS asn_assignments (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    asn      INTEGER NOT NULL UNIQUE,
    site     TEXT    NOT NULL,
    region   TEXT    NOT NULL,
    host     TEXT    NOT NULL DEFAULT '—',
    peer     TEXT    NOT NULL DEFAULT '—',
    type     TEXT    NOT NULL,
    status   TEXT    NOT NULL DEFAULT 'Assigned',
    date     TEXT    NOT NULL,
    by_user  TEXT    NOT NULL,
    desc     TEXT    NOT NULL DEFAULT '',
    pool     TEXT    NOT NULL DEFAULT '2byte',
    created_at TEXT  NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ts       TEXT    NOT NULL,
    action   TEXT    NOT NULL,
    asn      INTEGER NOT NULL,
    site     TEXT    NOT NULL,
    user     TEXT    NOT NULL,
    detail   TEXT    NOT NULL DEFAULT ''
  );
`);

// ── Seed initial data (only if empty) ────────────────────
const count = db.prepare("SELECT COUNT(*) as c FROM asn_assignments").get();
if (count.c === 0) {
  const insertASN = db.prepare(`
    INSERT INTO asn_assignments (asn,site,region,host,peer,type,status,date,by_user,desc,pool)
    VALUES (@asn,@site,@region,@host,@peer,@type,@status,@date,@by_user,@desc,@pool)
  `);
  const insertAudit = db.prepare(`
    INSERT INTO audit_log (ts,action,asn,site,user,detail)
    VALUES (@ts,@action,@asn,@site,@user,@detail)
  `);
  const seedMany = db.transaction((rows) => {
    for (const r of rows) insertASN.run(r);
  });
  seedMany([
    { asn:64512, site:"BKK-POP-01",     region:"BKK", host:"bkk-pe01.ipcore.net",     peer:"10.0.0.1",    type:"iBGP",    status:"Assigned",      date:"2024-02-10", by_user:"nattakorn", desc:"Core PE router Bangkok PoP 1",            pool:"2byte" },
    { asn:64513, site:"BKK-POP-02",     region:"BKK", host:"bkk-pe02.ipcore.net",     peer:"10.0.0.2",    type:"iBGP",    status:"Assigned",      date:"2024-02-10", by_user:"nattakorn", desc:"Core PE router Bangkok PoP 2",            pool:"2byte" },
    { asn:64514, site:"CNX-POP-01",     region:"CNX", host:"cnx-pe01.ipcore.net",     peer:"10.1.0.1",    type:"iBGP",    status:"Assigned",      date:"2024-03-01", by_user:"somchai",   desc:"Core PE router Chiang Mai",               pool:"2byte" },
    { asn:64515, site:"HKT-POP-01",     region:"HKT", host:"hkt-pe01.ipcore.net",     peer:"10.2.0.1",    type:"MPLS-LDP",status:"Assigned",      date:"2024-03-15", by_user:"somchai",   desc:"Phuket PE with MPLS LDP",                 pool:"2byte" },
    { asn:64516, site:"KKN-POP-01",     region:"KKN", host:"kkn-pe01.ipcore.net",     peer:"10.3.0.1",    type:"iBGP",    status:"Assigned",      date:"2024-04-20", by_user:"wichai",    desc:"Khon Kaen northeast hub",                 pool:"2byte" },
    { asn:64517, site:"UBN-POP-01",     region:"UBN", host:"ubn-pe01.ipcore.net",     peer:"10.4.0.1",    type:"iBGP",    status:"Reserved",      date:"2024-05-01", by_user:"wichai",    desc:"Ubon Ratchathani planned PoP",            pool:"2byte" },
    { asn:64518, site:"OLD-HKT-02",     region:"HKT", host:"hkt-pe02-old.ipcore.net", peer:"—",           type:"iBGP",    status:"Decommissioned",date:"2023-12-01", by_user:"admin",     desc:"Decommissioned — site closed",            pool:"2byte" },
    { asn:64519, site:"OLD-BKK-04",     region:"BKK", host:"bkk-pe04-old.ipcore.net", peer:"—",           type:"iBGP",    status:"Decommissioned",date:"2023-11-01", by_user:"admin",     desc:"Decommissioned — hardware EOL",           pool:"2byte" },
    { asn:64520, site:"BKK-CE-CUST-A",  region:"BKK", host:"bkk-ce01-custA.ipcore.net",peer:"192.168.10.2",type:"eBGP-CE",status:"Assigned",      date:"2024-05-10", by_user:"nattakorn", desc:"Enterprise customer A, VLAN 100",        pool:"2byte" },
    { asn:64521, site:"BKK-CE-CUST-B",  region:"BKK", host:"bkk-ce01-custB.ipcore.net",peer:"192.168.11.2",type:"eBGP-CE",status:"Assigned",      date:"2024-05-15", by_user:"nattakorn", desc:"Enterprise customer B, VLAN 200",        pool:"2byte" },
    { asn:64522, site:"CNX-CE-CUST-C",  region:"CNX", host:"—",                       peer:"—",           type:"eBGP-CE",status:"Reserved",       date:"2024-06-01", by_user:"somchai",   desc:"Planned CE for customer C in CNX",       pool:"2byte" },
    { asn:64523, site:"HKT-CE-CUST-D",  region:"HKT", host:"hkt-ce01-custD.ipcore.net",peer:"192.168.12.2",type:"eBGP-CE",status:"Assigned",      date:"2024-06-10", by_user:"wichai",    desc:"Phuket resort customer",                 pool:"2byte" },
    { asn:64524, site:"KKN-CE-CUST-E",  region:"KKN", host:"kkn-ce01-custE.ipcore.net",peer:"192.168.13.2",type:"eBGP-CE",status:"Assigned",      date:"2024-06-20", by_user:"wichai",    desc:"Industrial estate customer NE",          pool:"2byte" },
    { asn:64525, site:"BKK-CE-CUST-F",  region:"BKK", host:"bkk-ce02-custF.ipcore.net",peer:"192.168.14.2",type:"eBGP-CE",status:"Assigned",      date:"2024-07-15", by_user:"nattakorn", desc:"Financial sector customer F",            pool:"2byte" },
    { asn:64526, site:"BKK-CE-CUST-G",  region:"BKK", host:"bkk-ce02-custG.ipcore.net",peer:"192.168.15.2",type:"eBGP-CE",status:"Assigned",      date:"2024-07-20", by_user:"nattakorn", desc:"Retail chain customer G",                pool:"2byte" },
    { asn:64527, site:"CNX-CE-CUST-H",  region:"CNX", host:"cnx-ce01-custH.ipcore.net",peer:"192.168.16.2",type:"eBGP-CE",status:"Reserved",      date:"2024-07-25", by_user:"somchai",   desc:"Planned for university customer",        pool:"2byte" },
    { asn:64528, site:"HKT-VPN-02",     region:"HKT", host:"hkt-pe01.ipcore.net",     peer:"10.2.0.1",    type:"MPLS-LDP",status:"Assigned",      date:"2024-08-01", by_user:"wichai",    desc:"Hotel chain VPN Phuket region",          pool:"2byte" },
    { asn:64529, site:"KKN-VPN-01",     region:"KKN", host:"kkn-pe01.ipcore.net",     peer:"10.3.0.1",    type:"MPLS-LDP",status:"Assigned",      date:"2024-08-05", by_user:"wichai",    desc:"MPLS VPN Khon Kaen",                     pool:"2byte" },
    { asn:64530, site:"BKK-POP-03",     region:"BKK", host:"bkk-pe03.ipcore.net",     peer:"10.0.0.3",    type:"iBGP",    status:"Assigned",      date:"2024-08-10", by_user:"nattakorn", desc:"New Bangkok PoP expansion",              pool:"2byte" },
    { asn:64550, site:"BKK-VPN-01",     region:"BKK", host:"bkk-pe01.ipcore.net",     peer:"10.0.0.1",    type:"MPLS-LDP",status:"Assigned",      date:"2024-07-01", by_user:"nattakorn", desc:"MPLS VPN service Bangkok",               pool:"2byte" },
    { asn:64551, site:"CNX-VPN-01",     region:"CNX", host:"cnx-pe01.ipcore.net",     peer:"10.1.0.1",    type:"MPLS-LDP",status:"Assigned",      date:"2024-07-05", by_user:"somchai",   desc:"MPLS VPN service CNX",                   pool:"2byte" },
    { asn:64531, site:"UBN-CE-CUST-I",  region:"UBN", host:"—",                       peer:"—",           type:"eBGP-CE",status:"Reserved",       date:"2024-08-15", by_user:"wichai",    desc:"Ubon planned customer deployment",       pool:"2byte" },
  ]);
  const seedAudit = db.transaction((rows) => { for (const r of rows) insertAudit.run(r); });
  seedAudit([
    { ts:"2024-08-15 14:23", action:"CREATE", asn:64531, site:"UBN-CE-CUST-I", user:"wichai",    detail:"Reserved for planned deployment" },
    { ts:"2024-08-10 09:11", action:"CREATE", asn:64530, site:"BKK-POP-03",    user:"nattakorn", detail:"Assigned to new Bangkok PoP" },
    { ts:"2024-08-05 16:44", action:"CREATE", asn:64529, site:"KKN-VPN-01",    user:"wichai",    detail:"MPLS VPN Khon Kaen" },
    { ts:"2024-08-01 10:30", action:"CREATE", asn:64528, site:"HKT-VPN-02",    user:"wichai",    detail:"Hotel chain VPN" },
    { ts:"2023-12-01 08:00", action:"DECOM",  asn:64518, site:"OLD-HKT-02",    user:"admin",     detail:"Site closed, hardware removed" },
    { ts:"2023-11-01 08:00", action:"DECOM",  asn:64519, site:"OLD-BKK-04",    user:"admin",     detail:"EOL hardware replacement" },
  ]);
}

// ── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── Helper ────────────────────────────────────────────────
function getNextFree(pool) {
  const start = pool === "2byte" ? 64512 : 4200000000;
  const end   = pool === "2byte" ? 65534 : 4294967294;
  const used  = new Set(
    db.prepare("SELECT asn FROM asn_assignments WHERE pool=? AND status != 'Decommissioned'")
      .all(pool).map(r => r.asn)
  );
  for (let i = start; i <= end; i++) { if (!used.has(i)) return i; }
  return null;
}

function nowStr() { return new Date().toISOString().replace("T"," ").slice(0,16); }

// ── API Routes ───────────────────────────────────────────

// GET all ASNs
app.get("/api/asns", (req, res) => {
  const rows = db.prepare("SELECT * FROM asn_assignments ORDER BY asn ASC").all();
  res.json(rows);
});

// GET next free ASN
app.get("/api/asns/next-free/:pool", (req, res) => {
  const nf = getNextFree(req.params.pool);
  res.json({ nextFree: nf });
});

// GET stats
app.get("/api/stats", (req, res) => {
  const assigned = db.prepare("SELECT COUNT(*) as c FROM asn_assignments WHERE status='Assigned'").get().c;
  const reserved = db.prepare("SELECT COUNT(*) as c FROM asn_assignments WHERE status='Reserved'").get().c;
  const decom    = db.prepare("SELECT COUNT(*) as c FROM asn_assignments WHERE status='Decommissioned'").get().c;
  const used2    = db.prepare("SELECT COUNT(*) as c FROM asn_assignments WHERE pool='2byte' AND status != 'Decommissioned'").get().c;
  const used4    = db.prepare("SELECT COUNT(*) as c FROM asn_assignments WHERE pool='4byte' AND status != 'Decommissioned'").get().c;
  const nf2      = getNextFree("2byte");
  const nf4      = getNextFree("4byte");
  res.json({ assigned, reserved, decom, total: assigned+reserved+decom, used2, used4, nextFree2: nf2, nextFree4: nf4 });
});

// POST create new ASN
app.post("/api/asns", (req, res) => {
  const { site, region, host, peer, type, status, desc, pool, by_user } = req.body;
  if (!site || !region || !type || !pool) return res.status(400).json({ error: "Missing required fields" });
  const nf = getNextFree(pool);
  if (!nf) return res.status(409).json({ error: "No available ASN in pool" });
  const date = new Date().toISOString().split("T")[0];
  const user = by_user || "nattakorn";
  const result = db.prepare(`
    INSERT INTO asn_assignments (asn,site,region,host,peer,type,status,date,by_user,desc,pool)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(nf, site, region, host||"—", peer||"—", type, status||"Assigned", date, user, desc||"", pool);
  db.prepare("INSERT INTO audit_log (ts,action,asn,site,user,detail) VALUES (?,?,?,?,?,?)")
    .run(nowStr(), "CREATE", nf, site, user, desc||"New assignment");
  const created = db.prepare("SELECT * FROM asn_assignments WHERE id=?").get(result.lastInsertRowid);
  res.status(201).json(created);
});

// PUT update ASN
app.put("/api/asns/:id", (req, res) => {
  const { id } = req.params;
  const existing = db.prepare("SELECT * FROM asn_assignments WHERE id=?").get(id);
  if (!existing) return res.status(404).json({ error: "ASN not found" });
  const { site, region, host, peer, type, status, desc, by_user } = req.body;
  db.prepare(`
    UPDATE asn_assignments SET site=?,region=?,host=?,peer=?,type=?,status=?,desc=? WHERE id=?
  `).run(
    site||existing.site, region||existing.region,
    host||existing.host, peer||existing.peer,
    type||existing.type, status||existing.status,
    desc!==undefined?desc:existing.desc, id
  );
  const user = by_user || "nattakorn";
  db.prepare("INSERT INTO audit_log (ts,action,asn,site,user,detail) VALUES (?,?,?,?,?,?)")
    .run(nowStr(), "EDIT", existing.asn, site||existing.site, user, "Updated via portal");
  res.json(db.prepare("SELECT * FROM asn_assignments WHERE id=?").get(id));
});

// POST decommission ASN
app.post("/api/asns/:id/decommission", (req, res) => {
  const existing = db.prepare("SELECT * FROM asn_assignments WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "ASN not found" });
  db.prepare("UPDATE asn_assignments SET status='Decommissioned' WHERE id=?").run(req.params.id);
  const user = req.body?.by_user || "nattakorn";
  db.prepare("INSERT INTO audit_log (ts,action,asn,site,user,detail) VALUES (?,?,?,?,?,?)")
    .run(nowStr(), "DECOM", existing.asn, existing.site, user, "Decommissioned via portal");
  res.json({ ok: true });
});

// GET audit log
app.get("/api/audit", (req, res) => {
  const rows = db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 200").all();
  res.json(rows);
});

// GET audit for specific ASN
app.get("/api/audit/:asn", (req, res) => {
  const rows = db.prepare("SELECT * FROM audit_log WHERE asn=? ORDER BY id DESC").all(req.params.asn);
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`ASN Manager running on http://localhost:${PORT}`);
});
