const db = require('../models/db');

exports.getEstudiantes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM estudiantes2');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
};

exports.getAsistencias = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM asistencias');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
};