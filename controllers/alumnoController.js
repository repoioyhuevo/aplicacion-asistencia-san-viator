const QRCode = require('qrcode');

exports.dashboardAlumno = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'alumno') {
    return res.redirect('/login?role=alumno');
  }

  const alumno = req.session.user;

  try {
    const qrData = `RUT:${alumno.rut}|Nombre:${alumno.name}`;
    const qrCode = await QRCode.toDataURL(qrData);
    res.render('dashboard-alumno', { name: alumno.name, rut: alumno.rut, qrCode });
  } catch (err) {
    console.error(err);
    res.send("Error generando QR");
  }
};
