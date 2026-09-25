const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'troque_esta_chave_secret_para_producao';

app.use(cors());
app.use(bodyParser.json());

const siteRoot = path.join(__dirname, '..');
for (const directory of ['css', 'js', 'img', 'teste', 'testes']) {
  app.use('/' + directory, express.static(path.join(siteRoot, directory)));
}
app.get('/', (req, res) => res.sendFile(path.join(siteRoot, 'index.html')));
app.get('/:page.html', (req, res, next) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(req.params.page)) return next();
  res.sendFile(path.join(siteRoot, req.params.page + '.html'), (err) => {
    if (err) next();
  });
});

function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success: false, message: 'Sem token' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ success: false, message: 'Token inválido' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload.username;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token expirado ou inválido' });
  }
}

app.get('/health', (req, res) => res.json({ success: true }));

app.post('/api/register', async (req, res) => {
  const username = (req.body?.username || '').trim().toLowerCase();
  const password = (req.body?.password || '').trim();
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Informe usuário e senha' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const created = await db.createUser(username, hash);
    if (!created) return res.status(400).json({ success: false, message: 'Usuário já existe' });
    const token = generateToken(username);
    return res.json({ success: true, token, username, faseAtual: 1, pontos: 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erro ao criar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const username = (req.body?.username || '').trim().toLowerCase();
  const password = (req.body?.password || '').trim();
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Informe usuário e senha' });
  }
  try {
    const user = await db.getUserByUsername(username);
    if (!user) return res.status(400).json({ success: false, message: 'Usuário não encontrado' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Senha incorreta' });
    const token = generateToken(username);
    return res.json({
      success: true,
      token,
      username: user.username,
      faseAtual: user.faseAtual,
      pontos: user.pontos
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erro ao fazer login' });
  }
});

app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserByUsername(req.user);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    return res.json({
      success: true,
      faseAtual: user.faseAtual,
      pontos: user.pontos,
      username: user.username
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erro ao obter progresso' });
  }
});

app.post('/api/save', authMiddleware, async (req, res) => {
  const { faseAtual, pontos } = req.body || {};
  if (typeof faseAtual !== 'number' && typeof pontos !== 'number') {
    return res.status(400).json({ success: false, message: 'Envie faseAtual e pontos como números' });
  }
  try {
    const user = await db.getUserByUsername(req.user);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    const newFase = typeof faseAtual === 'number' ? faseAtual : user.faseAtual;
    const newPontos = typeof pontos === 'number' ? pontos : user.pontos;
    await db.updateProgress(req.user, newFase, newPontos);
    return res.json({ success: true, faseAtual: newFase, pontos: newPontos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erro ao salvar progresso' });
  }
});

db.init().catch((err) => {
  console.error('PostgreSQL indisponível; cadastro e progresso não poderão ser salvos:', err);
});
app.listen(PORT, () => console.log('TCC server rodando na porta ' + PORT));