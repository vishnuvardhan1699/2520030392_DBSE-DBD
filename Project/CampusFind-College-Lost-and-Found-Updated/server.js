const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3000;
const db = new sqlite3.Database(path.join(__dirname, "lostfound.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','lecturer')),
    points INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    report_type TEXT NOT NULL CHECK(report_type IN ('Lost','Found')),
    report_date TEXT NOT NULL,
    location TEXT NOT NULL,
    contact TEXT NOT NULL,
    reporter_id INTEGER,
    status TEXT NOT NULL DEFAULT 'Active',
    image_url TEXT DEFAULT '',
    reward_points INTEGER NOT NULL DEFAULT 25,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reporter_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    claimant_id INTEGER NOT NULL,
    claimant_name TEXT NOT NULL,
    claimant_contact TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(claimant_id) REFERENCES users(id)
  )`);

  // Seed demo accounts.
  const seedUser = (name, email, password, role, points) => {
    db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO users(name,email,password,role,points) VALUES(?,?,?,?,?)",
          [name, email, bcrypt.hashSync(password, 10), role, points]
        );
      }
    });
  };
  seedUser("Demo Student", "student@college.edu", "student123", "student", 40);
  seedUser("Demo Lecturer", "lecturer@college.edu", "lecturer123", "lecturer", 75);

  db.get("SELECT COUNT(*) AS count FROM items", (err, row) => {
    if (!err && row.count === 0) {
      db.all("SELECT id FROM users ORDER BY id LIMIT 1", (e, users) => {
        const uid = users && users[0] ? users[0].id : null;
        const sample = [
          ["Black Wallet","Accessories","Black leather wallet found near the library entrance.","Found","2026-09-10","Central Library","9876543210",uid,"Active","https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80",25],
          ["Blue Water Bottle","Others","Blue insulated bottle with a small sticker on the side.","Lost","2026-09-09","Block A, Ground Floor","9876501234",uid,"Active","https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",0],
          ["Scientific Calculator","Electronics","Black scientific calculator found after CSE lab session.","Found","2026-09-08","CSE Lab 2","9123456780",uid,"Active","https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80",25],
          ["Student ID Card","Documents","College ID card found near the main auditorium.","Found","2026-09-07","Main Auditorium","9000012345",uid,"Active","",25]
        ];
        const stmt = db.prepare(`INSERT INTO items
          (item_name,category,description,report_type,report_date,location,contact,reporter_id,status,image_url,reward_points)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
        sample.forEach(x => stmt.run(x));
        stmt.finalize();
      });
    }
  });
});

app.post("/api/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Please fill all fields." });
  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)", [name,email,hash,role], function(err) {
    if (err) return res.status(400).json({ error: err.message.includes("UNIQUE") ? "Email already registered." : "Unable to create account." });
    res.json({ message: "Account created successfully." });
  });
});

app.post("/api/login", (req, res) => {
  const { email, password, role } = req.body;
  db.get("SELECT * FROM users WHERE email=? AND role=?", [email, role], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid college email, password or role." });
    }
    const safeUser = { id:user.id, name:user.name, email:user.email, role:user.role, points:user.points };
    res.json({ user: safeUser });
  });
});

app.post("/api/forgot-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Enter email and a password with at least 6 characters." });
  }
  db.run("UPDATE users SET password=? WHERE email=?", [bcrypt.hashSync(newPassword, 10), email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "No account found with that college email." });
    res.json({ message: "Password reset successfully." });
  });
});

app.get("/api/items", (req, res) => {
  const { search="", type="All", category="All" } = req.query;
  let sql = `SELECT i.*, COALESCE(u.name,'Campus User') AS reporter_name, COALESCE(u.points,0) AS reporter_points
             FROM items i LEFT JOIN users u ON u.id=i.reporter_id WHERE 1=1`;
  const params=[];
  if (type !== "All") { sql += " AND i.report_type=?"; params.push(type); }
  if (category !== "All") { sql += " AND i.category=?"; params.push(category); }
  if (search) {
    sql += " AND (i.item_name LIKE ? OR i.description LIKE ? OR i.location LIKE ?)";
    const s=`%${search}%`; params.push(s,s,s);
  }
  sql += " ORDER BY CASE WHEN i.status='Active' THEN 0 ELSE 1 END, i.created_at DESC";
  db.all(sql, params, (err, rows) => err ? res.status(500).json({error:err.message}) : res.json(rows));
});

app.post("/api/items", (req, res) => {
  const {item_name,category,description,report_type,report_date,location,contact,image_url="",reporter_id} = req.body;
  if (!item_name || !category || !description || !report_type || !report_date || !location || !contact || !reporter_id) {
    return res.status(400).json({error:"Please fill all required fields."});
  }
  const reward = report_type === "Found" ? 25 : 0;
  db.run(`INSERT INTO items(item_name,category,description,report_type,report_date,location,contact,reporter_id,image_url,reward_points)
          VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [item_name,category,description,report_type,report_date,location,contact,reporter_id,image_url,reward],
    function(err){
      if(err) return res.status(500).json({error:err.message});
      res.json({message:"Item reported successfully.",id:this.lastID});
    });
});

app.post("/api/claims", (req,res) => {
  const {item_id, claimant_id, claimant_name, claimant_contact, message} = req.body;
  if(!item_id || !claimant_id || !claimant_name || !claimant_contact || !message) {
    return res.status(400).json({error:"Please fill all claim details."});
  }
  db.run(`INSERT INTO claims(item_id,claimant_id,claimant_name,claimant_contact,message)
          VALUES(?,?,?,?,?)`, [item_id,claimant_id,claimant_name,claimant_contact,message], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({message:"Claim request sent to the item reporter."});
  });
});

// The user who uploaded a Found item confirms that it has been returned.
// That reporter then receives the configured finder reward points.
app.put("/api/items/:id/recover", (req,res) => {
  const { user_id } = req.body;
  db.get("SELECT * FROM items WHERE id=?", [req.params.id], (err,item) => {
    if(err) return res.status(500).json({error:err.message});
    if(!item) return res.status(404).json({error:"Item not found."});
    if(Number(item.reporter_id) !== Number(user_id)) return res.status(403).json({error:"Only the person who uploaded this report can confirm the return."});
    if(item.status === "Recovered") return res.status(400).json({error:"This item is already marked recovered."});

    db.run("UPDATE items SET status='Recovered' WHERE id=?", [item.id], function(updateErr){
      if(updateErr) return res.status(500).json({error:updateErr.message});
      if(item.report_type === "Found" && item.reward_points > 0) {
        db.run("UPDATE users SET points=points+? WHERE id=?", [item.reward_points, item.reporter_id], () => {
          res.json({message:"Item recovered. Finder points awarded.", points_awarded:item.reward_points});
        });
      } else {
        res.json({message:"Item recovered.", points_awarded:0});
      }
    });
  });
});

app.get("/api/profile/:id", (req,res) => {
  db.get("SELECT id,name,email,role,points FROM users WHERE id=?", [req.params.id], (err,user) => {
    if(err) return res.status(500).json({error:err.message});
    if(!user) return res.status(404).json({error:"User not found."});
    res.json(user);
  });
});

app.get("/api/stats", (req,res) => {
  db.get(`SELECT
    (SELECT COUNT(*) FROM items) total,
    (SELECT COUNT(*) FROM items WHERE report_type='Lost' AND status='Active') lost,
    (SELECT COUNT(*) FROM items WHERE report_type='Found' AND status='Active') found,
    (SELECT COUNT(*) FROM items WHERE status='Recovered') recovered`, (err,row) => {
      if(err) return res.status(500).json({error:err.message});
      res.json(row);
    });
});

app.listen(PORT, () => console.log(`CampusFind running at http://localhost:${PORT}`));
