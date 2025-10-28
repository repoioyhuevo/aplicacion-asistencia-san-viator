const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'metro.proxy.rlwy.net',
  user: 'root',
  password: 'qdXolISyQKPsirNDaExgbNhboFnowhOW',
  database: 'railway',
  port: 13787
});

module.exports = db;
