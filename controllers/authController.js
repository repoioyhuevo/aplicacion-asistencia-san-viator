// controllers/authController.js
const userModel = require('../models/userModel');

exports.showLogin = (req, res) => {
  const role = req.query.role || 'alumno';
  res.render('login', { role, error: null });
};

exports.login = async (req, res) => {
  try {
    const { role } = req.body;
    let identifier, password;

    if (role === 'alumno') {
      identifier = req.body.rut;
      password = req.body.rut;
    } else {
      identifier = req.body.nombre_usuario;
      password = req.body.contraseña;
    }

    console.log('🔐 Intento de login:', { identifier, role });

    // ✅ CORREGIDO: Pasar parámetros separados, no objeto
    const user = await userModel.findUser(identifier, role);

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.render('login', { 
        role, 
        error: 'Usuario o contraseña inválida' 
      });
    }

    // Verificar contraseña (para docente)
    if (role !== 'alumno') {
      // Si usas encriptación:
      // const bcrypt = require('bcryptjs');
      // const isPasswordValid = await bcrypt.compare(password, user.password);
      
      // Si NO usas encriptación (contraseña en texto plano):
      const isPasswordValid = password === user.password;
      
      if (!isPasswordValid) {
        console.log('❌ Contraseña incorrecta');
        return res.render('login', { 
          role, 
          error: 'Usuario o contraseña inválida' 
        });
      }
    }

    // Configurar sesión según el rol
    if (role === 'alumno') {
      req.session.user = {
        id: user.id,
        name: user.nombre_completo,
        rut: user.run,
        role: 'alumno'
      };
    } else {
      req.session.user = {
        id: user.id,
        name: user.nombre_completo || user.nombre_usuario,
        role: user.rol || 'docente'
      };
    }

    console.log(`✅ Login exitoso para: ${identifier}, rol: ${role}`);

    // Redirigir según el rol
    if (role === 'alumno') {
      return res.redirect('/dashboard-alumno');
    } else {
      return res.redirect('/dashboard-docente');
    }

  } catch (error) {
    console.error('❌ Error en authController.login:', error);
    res.render('login', { 
      role: req.body.role || 'alumno', 
      error: 'Error interno del servidor' 
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login?role=alumno');
  });
};