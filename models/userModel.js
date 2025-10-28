// models/userModel.js (versión expandida)
const db = require('./db');

exports.findUser = async (identifier, rol) => {
  try {
    console.log(`🔍 Buscando usuario: ${identifier}, rol: ${rol}`);
    
    if (typeof db.query !== 'function') {
      console.error('❌ db.query no es una función');
      throw new Error('Conexión a BD no inicializada');
    }
    
    let query, params;
    
    if (rol === 'alumno') {
      // Buscar alumno por RUT
      query = 'SELECT id, run, CONCAT(nombres, " ", apellido_paterno, " ", apellido_materno) as nombre_completo FROM estudiantes2 WHERE run = ?';
      params = [identifier];
    } else {
      // Buscar docente por username
      query = 'SELECT * FROM usuarios_docentes WHERE username = ? AND rol = ?';
      params = [identifier, rol];
    }
    
    const [rows] = await db.query(query, params);
    
    if (rows.length > 0) {
      console.log(`✅ Usuario encontrado: ${identifier}`);
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