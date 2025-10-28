const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'mysql-zpkv.railway.internal',
  user: 'root',
  password: 'dJwFUFLOhIHftsbbrsvkPkrctjYhWbAH',
  database: 'railway',
  port: 3306
});

connection.connect((error) => {
  if (error) throw error;
  console.log('Conectado a la BD en Railway!');
});