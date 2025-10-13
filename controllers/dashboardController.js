exports.showAlumno = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'alumno')
    return res.redirect('/login?role=alumno');

  res.render('dashboard-alumno', { name: req.session.user.name });
};

exports.showDocente = (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'docente' && req.session.user.role !== 'admin'))
    return res.redirect('/login?role=docente');

  res.render('dashboard-docente', { name: req.session.user.name });
};
exports.showAlumno = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'alumno')
    return res.redirect('/login?role=alumno');

  res.render('dashboard-alumno', { 
    name: req.session.user.name,
    rut: req.session.user.rut // ✅ agregamos rut
  });
};
