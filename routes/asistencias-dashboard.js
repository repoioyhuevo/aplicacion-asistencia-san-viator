// routes/asistencias-dashboard.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // conexión MySQL

router.get("/asistencias-dashboard", async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Debes enviar fechaInicio y fechaFin" });
    }

    // Base query (solo lunes a viernes)
    let query = `
      SELECT 
        a.fecha,
        SUM(a.presente = 1) AS asistencias,
        SUM(a.presente = 0) AS faltas
      FROM asistencias a
      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      WHERE a.fecha BETWEEN ? AND ?
      AND DAYOFWEEK(a.fecha) BETWEEN 2 AND 6  -- Lunes (2) a Viernes (6)
    `;

    const params = [fechaInicio, fechaFin];

    // Filtros dinámicos
    if (nivel && nivel !== "todos") {
      query += " AND e.nivel = ?";
      params.push(nivel);
    }

    if (grado && grado !== "todos") {
      query += " AND e.grado = ?";
      params.push(grado);
    }

    if (curso && curso !== "todos") {
      query += " AND e.curso = ?";
      params.push(curso);
    }

    query += " GROUP BY a.fecha ORDER BY a.fecha ASC";

    const [rows] = await pool.query(query, params);
    res.json(rows);

  } catch (err) {
    console.error("Error en /api/asistencias-dashboard:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
