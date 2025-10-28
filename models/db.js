// models/db.js
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'sql100.infinityfree.com',      // ← CAMBIA esto
  user: 'if0_40275564',                 // ← CAMBIA esto  
  password: 'SkogLCij1ASmzI',           // ← CAMBIA esto
  database: 'if0_40275564_asistencia_sanviator', // ← CAMBIA esto
  port: 3306,                           // ← Opcional (pero recomendado)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;