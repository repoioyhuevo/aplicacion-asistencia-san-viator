// controllers/alumnoController.js
const bwipjs = require('bwip-js');

exports.dashboardAlumno = async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'alumno') {
    return res.redirect('/login?role=alumno');
  }

  const alumno = req.session.user;

  try {
    const rutParaBarcode = alumno.rut.replace(/[\.\-]/g, '');
    
    console.log('🔧 Generando código de barras para RUT:', rutParaBarcode);
    
    // Configuración optimizada para código de barras
    const pngBuffer = await new Promise((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'code128',       // Tipo de código de barras
        text: rutParaBarcode,  // Texto a codificar
        scale: 3,              // Tamaño
        height: 15,            // Altura del código
        includetext: true,     // Mostrar texto abajo
        textxalign: 'center',  // Centrar texto
        textsize: 13,          // Tamaño del texto
        background: 'FFFFFF',  // Fondo blanco
        paddingwidth: 10,      // Espacio horizontal
        paddingheight: 5,      // Espacio vertical
      }, (err, png) => {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      });
    });

    console.log('✅ Código de barras generado correctamente, tamaño:', pngBuffer.length, 'bytes');
    
    const barcodeDataURL = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    
    res.render('dashboard-alumno', { 
      name: alumno.name, 
      rut: alumno.rut, 
      barcodeDataURL 
    });
    
  } catch (err) {
    console.error('❌ Error generando código de barras:', err);
    
    // En caso de error, mostrar dashboard sin código de barras
    res.render('dashboard-alumno', { 
      name: alumno.name, 
      rut: alumno.rut, 
      barcodeDataURL: null 
    });
  }
};