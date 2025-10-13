// controllers/authController.js
const userModel = require('../models/userModel');

exports.showLogin = (req, res) => {
  const role = req.query.role || 'alumno';
  res.render('login', { role, error: null });
};

exports.login = async (req, res) => {
  try {
    // normalizar rol: aceptar "profesor" como alias
    const rawRole = (req.body.role || req.query.role || 'alumno').toString().trim();
    const role = rawRole === 'profesor' ? 'docente' : rawRole;

    // identificar el campo que venga (nombre_usuario para docentes, rut para alumnos)
    const identifier = (req.body.nombre_usuario || req.body.rut || '').toString().trim();
    const password = (req.body.contraseña || req.body.password || '').toString().trim();

    if (!identifier) {
      return res.render('login', { role, error: 'Ingrese usuario o RUT' });
    }

    // llamar al modelo
    const user = await userModel.findUser({ identifier, password }, role);

    if (!user) {
      console.log('Login fallido - usuario no encontrado o contraseña incorrecta', { role, identifier });
      return res.render('login', { role, error: 'Usuario o contraseña inválida' });
    }

    // Guardar sesión (usar nombre correcto según tabla)
    req.session.user = {
      id: user.id_usuario || user.id_estudiante,
      name: user.nombre || user.nombre_usuario,
      role: role
    };

    console.log('✅ Sesión iniciada:', req.session.user);

    if (role === 'alumno') return res.redirect('/dashboard-alumno');
    return res.redirect('/dashboard-docente');

  } catch (err) {
    console.error('Error en auth.login:', err);
    return res.status(500).render('login', { role: req.body.role || 'alumno', error: 'Error interno' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};
