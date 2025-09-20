import Database from 'better-sqlite3';
const db = new Database('webauth.db');
db.prepare('CREATE TABLE IF NOT EXISTS totp (id INTEGER PRIMARY KEY, user_id TEXT, name TEXT, secret TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY, user_id TEXT, site TEXT, username TEXT, password TEXT)').run();
db.prepare('CREATE TABLE IF NOT EXISTS ids (id INTEGER PRIMARY KEY, user_id TEXT, id_name TEXT, id_value TEXT)').run();
export default function dbInit() { return db; }
