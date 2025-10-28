// models/userModel.js
const db = require('./db');

exports.findUser = async ({ identifier, password }, role) => {
  try {
    console.log(`🔍 Buscando usuario: ${identifier}, rol: ${role}`);

    if (role === 'alumno') {
      // Buscar en estudiantes2
      const [rows] = await db.query(
        `SELECT * FROM estudiantes2 
         WHERE REPLACE(REPLACE(run, ".", ""), "-", "") = REPLACE(REPLACE(?, ".", ""), "-", "")
         LIMIT 1`,
        [identifier]
      );
      
      console.log(`📊 Resultados encontrados para alumno: ${rows.length}`);
      
      if (rows.length > 0) {
        const alumno = rows[0];
        console.log('✅ Alumno encontrado:', alumno);
        return {
          id: alumno.id,
          nombres: alumno.nombres,
          apellido_paterno: alumno.apellido_paterno,
          apellido_materno: alumno.apellido_materno,
          run: alumno.run,
          nombre_completo: `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno}`.trim()
        };
      }
    } else {
      // CORRECCIÓN: Buscar en usuarios_docentes (la tabla correcta)
      const [rows] = await db.query(
        `SELECT * FROM usuarios_docentes 
         WHERE nombre_usuario = ? AND contraseña = ?
         LIMIT 1`,
        [identifier, password]
      );
      
      console.log(`📊 Resultados encontrados para ${role}: ${rows.length}`);
      
      if (rows.length > 0) {
        const usuario = rows[0];
        console.log('✅ Usuario encontrado:', usuario);
        return {
          id: usuario.id_usuario,
          nombre_usuario: usuario.nombre_usuario,
          nombre_completo: usuario.nombre_completo,
          rol: usuario.rol
        };
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error en userModel.findUser:', error);
    throw error;
  }
};