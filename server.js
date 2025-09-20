
import bcrypt from 'bcryptjs';
import qrcode from 'qrcode';
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import dbInit from './db.js';
import admin from 'firebase-admin';
import fs from 'fs';

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret:'secret',resave:false,saveUninitialized:true}));

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

// Serve static files from the current directory
app.use(express.static('.'));

// Firebase Admin
if (fs.existsSync('./firebase-admin.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./firebase-admin.json', 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.log('Missing firebase-admin.json file!');
}

// Database
const db = dbInit();

// Middleware to protect routes
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// Routes
app.get('/', (req,res)=>res.redirect('/login'));
app.get('/login',(req,res)=>res.render('login'));
app.get('/register',(req,res)=>res.render('register'));
app.get('/dashboard', requireLogin, (req,res)=>res.render('dashboard', { user: req.session.user }));
app.get('/passwords', requireLogin, (req,res)=>res.render('passwords', { user: req.session.user }));
app.get('/ids', requireLogin, (req,res)=>res.render('ids', { user: req.session.user }));
app.get('/account', requireLogin, (req,res)=>res.render('account', { user: req.session.user }));

// API: Firebase login
app.post('/api/login', async (req, res) => {
    // Expect idToken from frontend
    const idToken = req.body.idToken;
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        req.session.user = { uid: decoded.uid, email: decoded.email };
        res.json({ success: true });
    } catch (e) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
});

// API: Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// API: CRUD for TOTP (2FA codes)
app.get('/api/totp', requireLogin, (req, res) => {
    const rows = db.prepare('SELECT * FROM totp').all();
    res.json(rows);
});
app.post('/api/totp', requireLogin, (req, res) => {
    const { name, secret } = req.body;
    db.prepare('INSERT INTO totp (name, secret) VALUES (?, ?)').run(name, secret);
    res.json({ success: true });
});
app.delete('/api/totp/:id', requireLogin, (req, res) => {
    db.prepare('DELETE FROM totp WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// API: CRUD for passwords (with hashing)
app.get('/api/passwords', requireLogin, (req, res) => {
    let rows = db.prepare('SELECT * FROM passwords').all();
    // Don't send hashed passwords, just for demo
    rows = rows.map(p => ({ ...p, password: '••••••••' }));
    res.json(rows);
});
app.post('/api/passwords', requireLogin, async (req, res) => {
    const { site, username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO passwords (site, username, password) VALUES (?, ?, ?)').run(site, username, hash);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Error saving password.' });
    }
});
app.delete('/api/passwords/:id', requireLogin, (req, res) => {
    db.prepare('DELETE FROM passwords WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// API: QR code generation for export
app.get('/api/export-qr', requireLogin, async (req, res) => {
    const totp = db.prepare('SELECT * FROM totp').all();
    const passwords = db.prepare('SELECT * FROM passwords').all();
    const ids = db.prepare('SELECT * FROM ids').all();
    const json = JSON.stringify({ totp, passwords, ids });
    try {
        const qr = await qrcode.toDataURL(json);
        res.json({ qr });
    } catch (err) {
        res.status(500).json({ error: 'QR generation failed.' });
    }
});

// API: Search and sort endpoints
app.get('/api/search/:type', requireLogin, (req, res) => {
    const { type } = req.params;
    const q = req.query.q || '';
    let rows = [];
    if (type === 'totp') {
        rows = db.prepare('SELECT * FROM totp WHERE name LIKE ?').all(`%${q}%`);
    } else if (type === 'passwords') {
        rows = db.prepare('SELECT * FROM passwords WHERE site LIKE ? OR username LIKE ?').all(`%${q}%`, `%${q}%`);
    } else if (type === 'ids') {
        rows = db.prepare('SELECT * FROM ids WHERE id_name LIKE ? OR id_value LIKE ?').all(`%${q}%`, `%${q}%`);
    }
    res.json(rows);
});

// API: CRUD for IDs
app.get('/api/ids', requireLogin, (req, res) => {
    const rows = db.prepare('SELECT * FROM ids').all();
    res.json(rows);
});
app.post('/api/ids', requireLogin, (req, res) => {
    const { id_name, id_value } = req.body;
    db.prepare('INSERT INTO ids (id_name, id_value) VALUES (?, ?)').run(id_name, id_value);
    res.json({ success: true });
});
app.delete('/api/ids/:id', requireLogin, (req, res) => {
    db.prepare('DELETE FROM ids WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// API: Export all data (for sync)
app.get('/api/export', requireLogin, (req, res) => {
    const totp = db.prepare('SELECT * FROM totp').all();
    const passwords = db.prepare('SELECT * FROM passwords').all();
    const ids = db.prepare('SELECT * FROM ids').all();
    res.json({ totp, passwords, ids });
});

// API: Import all data (for sync)
app.post('/api/import', requireLogin, (req, res) => {
    const { totp, passwords, ids } = req.body;
    if (Array.isArray(totp)) {
        totp.forEach(t => db.prepare('INSERT INTO totp (name, secret) VALUES (?, ?)').run(t.name, t.secret));
    }
    if (Array.isArray(passwords)) {
        passwords.forEach(p => db.prepare('INSERT INTO passwords (site, username, password) VALUES (?, ?, ?)').run(p.site, p.username, p.password));
    }
    if (Array.isArray(ids)) {
        ids.forEach(i => db.prepare('INSERT INTO ids (id_name, id_value) VALUES (?, ?)').run(i.id_name, i.id_value));
    }
    res.json({ success: true });
});

// API: Change password (dummy, since Firebase handles passwords)
app.post('/api/change-password', requireLogin, (req, res) => {
    // This would call Firebase API to change password
    res.json({ success: true });
});

app.listen(8080,()=>console.log('Server running on port 8080'));
