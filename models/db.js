const mysql = require('mysql2/promise');

async function connectDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'yamabiko.proxy.rlwy.net',
      port: 31158,
      user: 'root',
      password: 'VBvoeLjziICKqyLUTGzqjtuNlsBZhtDg',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('✅ Conectado a Railway MySQL!');
    
    // Probar conexión
    const [rows] = await connection.execute('SELECT NOW() as current_time');
    console.log('Hora del servidor:', rows[0].current_time);
    
    return connection;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

connectDB();