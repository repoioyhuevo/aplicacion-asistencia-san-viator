// controllers/adminController.js
const xlsx = require('xlsx');
const db = require('../models/db');
const fs = require('fs');
const path = require('path');

function normalizarTexto(texto) {
  if (!texto) return '';
  return texto.toString().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/º/g, "°")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function uploadExcelMultiHoja(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se subió ningún archivo" });
    }

    const filePath = req.file.path;

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, message: "Archivo no encontrado en el servidor" });
    }

    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (excelErr) {
      return res.status(500).json({ success: false, message: "Error al leer archivo Excel", error: excelErr.message });
    }

    let cursosRows;
    try {
      [cursosRows] = await db.query("SELECT id, nivel, letra, descripcion FROM cursos WHERE descripcion NOT LIKE '%Transición%'");
    } catch (dbCursosErr) {
      return res.status(500).json({ success: false, message: "Error al obtener cursos de la base de datos", error: dbCursosErr.message });
    }

    let totalInsertados = 0;
    let errores = [];

    for (const sheetName of workbook.SheetNames) {
      const nombreNormalizado = normalizarTexto(sheetName);

      // EXCLUIR HOJAS DE TRANSICIÓN
      if (nombreNormalizado.includes('transicion') || nombreNormalizado.includes('transición')) {
        console.log(`⏭️ Saltando hoja de transición: ${sheetName}`);
        continue;
      }

      const curso = cursosRows.find(
        c =>
          normalizarTexto(`${c.nivel} ${c.letra}`).includes(nombreNormalizado) ||
          normalizarTexto(c.descripcion).includes(nombreNormalizado)
      );

      if (!curso) {
        errores.push(`Curso no encontrado para hoja: ${sheetName}`);
        continue;
      }

      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      for (const alumno of sheetData) {
        const run = (alumno.RUN || alumno.Run || alumno.run || '').toString().trim();
        const apellido_paterno = (alumno['Apellido paterno'] || alumno.ApellidoPaterno || alumno.apellido_paterno || '').toString().trim();
        const apellido_materno = (alumno['Apellido materno'] || alumno.ApellidoMaterno || alumno.apellido_materno || '').toString().trim();
        const nombres = (alumno.Nombres || alumno.nombres || '').toString().trim();

        if (!run || !nombres) {
          errores.push(`Datos faltantes en hoja "${sheetName}"`);
          continue;
        }

        try {
          await db.query(
            `INSERT INTO estudiantes2 (run, apellido_paterno, apellido_materno, nombres, curso_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             apellido_paterno = VALUES(apellido_paterno),
             apellido_materno = VALUES(apellido_materno),
             nombres = VALUES(nombres),
             curso_id = VALUES(curso_id)`,
            [run, apellido_paterno, apellido_materno, nombres, curso.id]
          );
          totalInsertados++;
        } catch (dbErr) {
          errores.push(`Error DB alumno ${run}: ${dbErr.message}`);
        }
      }
    }

    if (errores.length) {
      return res.status(400).json({
        success: false,
        message: "Se encontraron errores durante la carga",
        errores,
        total: totalInsertados
      });
    }

    res.json({
      success: true,
      message: "Archivo procesado correctamente",
      total: totalInsertados
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error general al procesar el Excel",
      error: err.message
    });
  }
}

async function getCursos(req, res) {
  try {
    const [rows] = await db.query("SELECT id, nivel, letra, descripcion FROM cursos WHERE descripcion NOT LIKE '%Transición%'");
    res.json(rows);
  } catch (err) {
    res.status(500).json([]);
  }
}

module.exports = { uploadExcelMultiHoja, getCursos };