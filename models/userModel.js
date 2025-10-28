// models/userModel.js - VERSIÓN CORREGIDA
const db = require('./db');

// Función para alumnos
exports.findUser = async (identifier, rol) => {
  try {
    console.log(`🔍 Buscando usuario: ${identifier}, rol: ${rol}`);
    
    let query, params;
    
    if (rol === 'alumno') {
      // Buscar alumno por RUT
      query = 'SELECT id, run, CONCAT(nombres, " ", apellido_paterno, " ", apellido_materno) as nombre_completo FROM estudiantes2 WHERE run = ?';
      params = [identifier];
    } else {
      // Buscar docente/admin por nombre_usuario Y rol específico
      query = 'SELECT * FROM usuarios_docentes WHERE nombre_usuario = ? AND rol = ?';
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

// Función para buscar usuario por nombre_usuario (sin filtrar por rol)
exports.findUserByUsername = async (identifier) => {
  try {
    console.log(`🔍 Buscando usuario por nombre_usuario: ${identifier}`);
    
    const [rows] = await db.query(
      'SELECT * FROM usuarios_docentes WHERE nombre_usuario = ?',
      [identifier]
    );
    
    if (rows.length > 0) {
      console.log(`✅ Usuario encontrado: ${identifier}, rol: ${rows[0].rol}`);
      return rows[0];
    } else {
      console.log('❌ Usuario no encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Error en userModel.findUserByUsername:', error.message);
    throw error;
  }
};