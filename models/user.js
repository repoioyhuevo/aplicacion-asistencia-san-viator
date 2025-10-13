const db = require('./db');

exports.findByRut = async (rut, role) => {
  try {
    // Limpiar RUT de puntos y guión
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');

    let query;
    if (role === 'alumno') {
      query = 'SELECT * FROM estudiantes WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? LIMIT 1';
    } else if (role === 'docente') {
      query = `
        SELECT d.*, u.contraseña 
        FROM docentes d
        JOIN usuarios_docentes u ON d.id_usuario = u.id_usuario
        WHERE REPLACE(REPLACE(d.rut, ".", ""), "-", "") = ? 
        LIMIT 1`;
    } else {
      return null;
    }

    const [rows] = await db.query(query, [rutLimpio]);
    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error('Error en findByRut:', err);
    return null;
  }
};
