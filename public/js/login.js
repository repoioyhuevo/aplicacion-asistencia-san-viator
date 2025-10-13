const userModel = require('../models/userModel');

exports.showLogin = (req, res) => {
  const role = req.query.role || 'alumno';
  res.render('login', { role, error: null });
};

exports.login = async (req, res) => {
  const { role } = req.body;
  const credentials = req.body;

  const user = await userModel.findUser(credentials, role);

  if (!user) {
    console.log('❌ Usuario o contraseña inválida');
    return res.render('login', { role, error: 'Usuario o contraseña inválida' });
  }

  // Guardamos en sesión
  req.session.user = {
    id: user.id_usuario || user.id_estudiante || user.id,
    name: user.nombre || user.nombre_usuario,
    role: role
  };

  console.log('✅ Sesión iniciada:', req.session.user);

  // Redirigir al dashboard correspondiente
  if (role === 'alumno') {
    return res.redirect('/dashboard-alumno');
  } else {
    return res.redirect('/dashboard-docente');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
