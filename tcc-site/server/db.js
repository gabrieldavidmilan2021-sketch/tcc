const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL não configurada. Conecte um PostgreSQL antes de iniciar o servidor.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function init() {
  const schema = [
    'CREATE TABLE IF NOT EXISTS users (',
    'username TEXT PRIMARY KEY,',
    'password TEXT NOT NULL,',
    'fase_atual INTEGER NOT NULL DEFAULT 1,',
    'pontos INTEGER NOT NULL DEFAULT 0',
    ')'
  ].join(' ');
  await getPool().query(schema);
}

function mapUser(row) {
  if (!row) return null;
  return {
    username: row.username,
    password: row.password,
    faseAtual: Number(row.fase_atual),
    pontos: Number(row.pontos)
  };
}

async function getUserByUsername(username) {
  const result = await getPool().query(
    'SELECT username, password, fase_atual, pontos FROM users WHERE username = $1',
    [username]
  );
  return mapUser(result.rows[0]);
}

async function createUser(username, password) {
  const result = await getPool().query(
    'INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING RETURNING username',
    [username, password]
  );
  return result.rowCount === 1;
}

async function saveProgress(username, faseAtual, pontos) {
  const result = await getPool().query(
    'UPDATE users SET fase_atual = $2, pontos = $3 WHERE username = $1',
    [username, faseAtual, pontos]
  );
  return result.rowCount === 1;
}

module.exports = {
  init,
  getUserByUsername,
  createUser,
  saveProgress,
  updateProgress: saveProgress,
  getProgress: getUserByUsername
};