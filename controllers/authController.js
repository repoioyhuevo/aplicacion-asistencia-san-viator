// controllers/authController.js - VERSIÓN CORREGIDA PARA DOCENTE Y ADMIN
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

    let user;
    if (role === 'alumno') {
      user = await userModel.findUser(identifier, role);
    } else {
      // Para docente O admin, buscar por nombre_usuario
      user = await userModel.findUserByUsername(identifier);
    }

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.render('login', { 
        role, 
        error: 'Usuario o contraseña inválida' 
      });
    }

    // Verificar contraseña (para docente/admin)
    if (role !== 'alumno') {
      // Usar la columna correcta: contraseña
      const isPasswordValid = password === user.contraseña;
      
      if (!isPasswordValid) {
        console.log('❌ Contraseña incorrecta');
        return res.render('login', { 
          role, 
          error: 'Usuario o contraseña inválida' 
        });
      }

      // ✅ VERIFICACIÓN CORREGIDA: Permitir tanto docente como admin
      // Si el usuario intenta login como "docente" pero es "admin", PERMITIR
      // Si el usuario intenta login como "admin" pero es "docente", PERMITIR
      // Ambos roles pueden acceder
      if (!(user.rol === 'docente' || user.rol === 'admin')) {
        console.log(`❌ Rol no autorizado: usuario es ${user.rol}`);
        return res.render('login', { 
          role, 
          error: 'Acceso no autorizado para este rol' 
        });
      }
    }

    // Configurar sesión
    if (role === 'alumno') {
      req.session.user = {
        id: user.id,
        name: user.nombre_completo,
        rut: user.run,
        role: 'alumno'
      };
    } else {
      req.session.user = {
        id: user.id_usuario,
        username: user.nombre_usuario,
        name: user.nombre_completo,
        role: user.rol // Mantener el rol REAL del usuario (docente o admin)
      };
    }

    console.log(`✅ Login exitoso para: ${identifier}, rol real: ${user.rol}`);

    // Redirigir según el rol REAL del usuario
    if (role === 'alumno') {
      return res.redirect('/dashboard-alumno');
    } else if (user.rol === 'docente') {
      return res.redirect('/dashboard-docente');
    } else if (user.rol === 'admin') {
      return res.redirect('/dashboard-docente'); // o la ruta que uses para admin
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