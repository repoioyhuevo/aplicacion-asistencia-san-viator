// models/userModel.js
const db = require('./db');

exports.findUser = async (username, rol) => {
  try {
    console.log(`🔍 Buscando usuario: ${username}, rol: ${rol}`);
    
    // VERIFICAR que db tenga el método query
    if (typeof db.query !== 'function') {
      console.error('❌ db.query no es una función. db:', typeof db);
      throw new Error('Conexión a BD no inicializada correctamente');
    }
    
    const [rows] = await db.query(
      'SELECT * FROM usuarios_docentes WHERE username = ? AND rol = ?',
      [username, rol]
    );
    
    if (rows.length > 0) {
      console.log(`✅ Usuario encontrado: ${username}`);
      return rows[0];
    } else {
      console.log('❌ Usuario no encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error en userModel.findUser:', error.message);
    throw error;
  }
};  