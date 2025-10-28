// controllers/dashboardController.js
const db = require('../models/db');

exports.showDocente = async (req, res) => {
  try {
    if (!req.session.user || (req.session.user.role !== 'docente' && req.session.user.role !== 'admin')) {
      return res.redirect('/login?role=docente');
    }

    const user = req.session.user;

    const [cursos] = await db.query(
      `SELECT DISTINCT nivel, letra, descripcion FROM cursos 
       WHERE descripcion NOT LIKE '%Transición%'
       ORDER BY nivel, letra`
    );

    res.render("dashboard-docente", {
      user,
      niveles: [
        { nivel: "Parvularia" },
        { nivel: "Básica" },
        { nivel: "Media" }
      ],
      grados: [],
      cursos: cursos || []
    });
  } catch (err) {
    res.status(500).send("Error al cargar el dashboard del docente.");
  }
};