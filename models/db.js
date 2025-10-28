const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'yamabiko.proxy.rlwy.net',
  port: 31158,
  user: 'root',
  password: 'VBvoeLjziICKqyLUTGzqjtuNlsBZhtDg',
  database: 'railway',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar conexión al iniciar
db.getConnection()
  .then(connection => {
    console.log('✅ Conectado a Railway MySQL!');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Error de conexión:', error);
  });

module.exports = db;