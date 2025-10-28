const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

exports.dashboardAlumno = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'alumno') {
    return res.redirect('/login?role=alumno');
  }

  const alumno = req.session.user;

  try {
    const rutParaBarcode = alumno.rut.replace(/[\.\-]/g, '');
    
    const canvas = createCanvas(450, 180);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    JsBarcode(canvas, rutParaBarcode, {
      format: "CODE39",
      width: 3,
      height: 120,
      displayValue: true,
      text: alumno.rut,
      fontSize: 18,
      margin: 20,
      background: "#ffffff",
      lineColor: "#000000"
    });
    
    const barcodeDataURL = canvas.toDataURL('image/png');
    
    res.render('dashboard-alumno', { 
      name: alumno.name, 
      rut: alumno.rut, 
      barcodeDataURL 
    });
    
  } catch (err) {
    res.status(500).send("Error generando código de barras");
  }
};