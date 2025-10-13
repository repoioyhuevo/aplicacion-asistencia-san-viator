    // models/userModel.js
    const db = require('./db');
    const bcrypt = require('bcryptjs');

    exports.findUser = async ({ identifier, password }, role) => {
      try {
        if (role === 'alumno') {
          // Buscar por RUT (ignorando puntos y guion)
          const [rows] = await db.query(
            `SELECT * FROM estudiantes 
            WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = REPLACE(REPLACE(?, ".", ""), "-", "")
            LIMIT 1`,
            [identifier]
          );
          return rows.length ? rows[0] : null;
        }

        // docente / admin
        const [rows] = await db.query(
          `SELECT * FROM usuarios_docentes WHERE nombre_usuario = ? LIMIT 1`,
          [identifier]
        );
        if (rows.length === 0) return null;

        const user = rows[0];
        const passwordDB = user['contraseña']; // usar bracket notation por la ñ

        if (!passwordDB) return null;

        // 1) comparar en texto plano (por compatibilidad con filas antiguas)
        if (password === passwordDB) return user;

        // 2) comparar bcrypt (si la contraseña en DB es un hash bcrypt)
        try {
          const match = await bcrypt.compare(password, passwordDB);
          if (match) return user;
        } catch (err) {
          // bcrypt.compare puede fallar si el hash no es bcrypt — lo ignoramos
          console.warn('bcrypt.compare falló (no es bcrypt?):', err.message);
        }

        return null;
      } catch (err) {
        console.error('Error en userModel.findUser:', err);
        return null;
      }
    };
