# TCC Server

Backend Node.js com cadastro, login e progresso em PostgreSQL.

## Render

Root Directory: tcc-site/server
Build Command: npm install
Start Command: npm start

Crie um PostgreSQL e configure DATABASE_URL no Web Service com a Internal Database URL. Se o provedor exigir TLS, configure DATABASE_SSL=true. Configure JWT_SECRET com um segredo aleatório longo.

O PostgreSQL gratuito do Render expira após 30 dias. Para persistência contínua, escolha um plano que não expire ou outro provedor PostgreSQL.