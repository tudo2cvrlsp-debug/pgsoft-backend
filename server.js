
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_segura';

const users = {};

// Registro
app.post('/api/register', (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) return res.status(400).json({ error: 'Preencha tudo' });

  const id = uuidv4();
  users[id] = { id, username, email, balance: 0 };
  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Usuário registrado com sucesso!', user: users[id], token });
});

// Login
app.post('/api/login', (req, res) => {
  const { id } = req.body;
  const user = users[id];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login realizado com sucesso!', user, token });
});

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try { const payload = jwt.verify(token, JWT_SECRET); req.user = payload; next(); }
  catch (e) { return res.status(401).json({ error: 'Token inválido' }); }
}

// Consultar saldo
app.get('/api/balance', auth, (req, res) => {
  const user = users[req.user.id];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ balance: user.balance });
});

// Depositar
app.post('/api/deposit', auth, (req, res) => {
  const { amount } = req.body;
  const user = users[req.user.id];
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });
  user.balance += Number(amount);
  res.json({ message: 'Depósito realizado com sucesso!', balance: user.balance });
});

// Sessão de jogo PG Soft simulada
app.post('/api/game/session', auth, (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId é obrigatório' });
  const iframeUrl = `https://demo-agregator.example.com/launch?game=${encodeURIComponent(gameId)}&token=SIMULATED_TOKEN&user=${req.user.id}`;
  res.json({ iframeUrl, token: 'SIMULATED_TOKEN' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
