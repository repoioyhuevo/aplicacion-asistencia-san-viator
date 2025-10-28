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

    const user = await userModel.findUser({ identifier, password }, role);

    if (!user) {
      return res.render('login', { 
        role, 
        error: 'Usuario o contraseña inválida' 
      });
    }

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

    if (role === 'alumno') {
      return res.redirect('/dashboard-alumno');
    } else {
      return res.redirect('/dashboard-docente');
    }

  } catch (error) {
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