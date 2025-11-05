const db = require('../models/db');

exports.getAsistencias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    const filtros = [];
    const valores = [];

    let fechaInicioValida = fechaInicio;
    let fechaFinValida = fechaFin;

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      [fechaInicioValida, fechaFinValida] = [fechaFin, fechaInicio];
    }

    if (fechaInicioValida && fechaFinValida) {
      filtros.push("DATE(a.fecha) >= ? AND DATE(a.fecha) <= ?");
      valores.push(fechaInicioValida, fechaFinValida);
    } else {
      const fechaFinDefault = new Date();
      const fechaInicioDefault = new Date();
      fechaInicioDefault.setDate(fechaInicioDefault.getDate() - 30);
      
      const fechaInicioStr = fechaInicioDefault.toISOString().split('T')[0];
      const fechaFinStr = fechaFinDefault.toISOString().split('T')[0];
      
      filtros.push("DATE(a.fecha) >= ? AND DATE(a.fecha) <= ?");
      valores.push(fechaInicioStr, fechaFinStr);
    }

    // FILTRO PARA EXCLUIR NIVELES DE TRANSICIÓN
    filtros.push("c.descripcion NOT LIKE '%Transición%'");

    if (nivel && nivel !== '' && nivel !== 'todos') {
      const nivelMap = {
        'parvularia': ['Prekínder', 'Kínder'],
        'basica': ['1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'],
        'media': ['1° Medio', '2° Medio', '3° Medio', '4° Medio']
      };
      
      const nivelesPermitidos = nivelMap[nivel.toLowerCase()] || [nivel];
      
      if (nivelesPermitidos.length > 0) {
        const placeholders = nivelesPermitidos.map(() => 'c.descripcion LIKE ?').join(' OR ');
        filtros.push(`(${placeholders})`);
        nivelesPermitidos.forEach(nivelPermitido => {
          valores.push(`%${nivelPermitido}%`);
        });
      }
    }

    if (grado && grado !== '' && grado !== 'todos') {
      filtros.push("c.descripcion = ?");
      valores.push(grado);
    }
    
    if (curso && curso !== '' && curso !== 'todos') {
      filtros.push("c.letra = ?");
      valores.push(curso);
    }

    const whereClause = filtros.length ? 'WHERE ' + filtros.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT 
        a.id_asistencia,
        e.id AS id_estudiante,
        e.run,
        CONCAT(e.nombres,' ',e.apellido_paterno,' ',e.apellido_materno) AS nombre_completo,
        c.nivel,
        c.letra,
        c.descripcion AS curso,
        DATE(a.fecha) AS fecha,
        a.hora,
        a.tipo_registro,
        a.presente
      FROM asistencias a
      INNER JOIN estudiantes2 e ON a.id_estudiante = e.id
      INNER JOIN cursos c ON e.curso_id = c.id
      ${whereClause}
      ORDER BY a.fecha DESC, a.hora DESC
      LIMIT 5000
    `, valores);

    res.json({ 
      success: true, 
      asistencias: rows.map(r => ({ 
        ...r, 
        presente: Number(r.presente),
        nombre_completo: r.nombre_completo || `${r.nombres || ''} ${r.apellido_paterno || ''} ${r.apellido_materno || ''}`.trim()
      })),
      total: rows.length
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener asistencias: ' + err.message 
    });
  }
};

exports.getFechasAsistencia = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT DATE(fecha) AS fecha, COUNT(*) as total
       FROM asistencias a
       INNER JOIN estudiantes2 e ON a.id_estudiante = e.id
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE fecha <= CURDATE() AND c.descripcion NOT LIKE '%Transición%'
       GROUP BY DATE(fecha)
       ORDER BY fecha DESC 
       LIMIT 60`
    );
    
    const fechas = rows.map(r => ({
      fecha: r.fecha,
      total: r.total
    }));
    
    res.json(fechas.map(f => f.fecha));
  } catch (err) { 
    res.json([]); 
  }
};

exports.getCursosDisponibles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT nivel, letra, descripcion 
       FROM cursos 
       WHERE descripcion NOT LIKE '%Transición%'
       ORDER BY 
         CASE 
           WHEN nivel = 'Parvularia' THEN 1
           WHEN nivel = 'Básica' THEN 2
           WHEN nivel = 'Media' THEN 3
           ELSE 4
         END,
         letra`
    );
    
    const cursos = rows.map(r => ({ 
      nivel: r.nivel, 
      letra: r.letra, 
      descripcion: r.descripcion 
    }));
    
    res.json(cursos);
  } catch (err) { 
    res.json([]); 
  }
};

exports.getGradosDisponibles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT descripcion 
       FROM cursos 
       WHERE descripcion NOT LIKE '%Transición%'
       ORDER BY 
         CASE 
           WHEN descripcion LIKE 'Prek%' THEN 1
           WHEN descripcion LIKE 'K%' THEN 2
           WHEN descripcion LIKE '%Básico%' THEN 3
           WHEN descripcion LIKE '%Medio%' THEN 4
           ELSE 5
         END,
         descripcion`
    );
    
    const grados = rows.map(r => r.descripcion);
    
    // Filtrar para eliminar duplicados y asegurar consistencia
    const gradosUnicos = [...new Set(grados)].filter(grado => 
      grado && !grado.includes('Transición')
    );
    
    res.json(gradosUnicos);
  } catch (err) { 
    // Si hay error, devolver lista por defecto consistente
    const gradosPorDefecto = [
      'Prekínder A',
      'Prekínder B', 
      'Kinder A',
      'Kinder B',
      '1° Básico A',
      '1° Básico B',
      '2° Básico A',
      '2° Básico B',
      '3° Básico A',
      '3° Básico B',
      '4° Básico A',
      '4° Básico B',
      '5° Básico A',
      '5° Básico B',
      '6° Básico A',
      '6° Básico B',
      '7° Básico A',
      '7° Básico B',
      '8° Básico A'
    ];
    res.json(gradosPorDefecto);
  }
};

exports.getNivelesDisponibles = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT nivel FROM cursos WHERE descripcion NOT LIKE '%Transición%' ORDER BY nivel`
    );
    
    const niveles = rows.map(r => r.nivel);
    res.json(niveles);
  } catch (err) { 
    res.json([]); 
  }
};

exports.getResumenAsistencias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requieren fechaInicio y fechaFin' 
      });
    }

    let fechaInicioValida = fechaInicio;
    let fechaFinValida = fechaFin;

    if (fechaInicio > fechaFin) {
      [fechaInicioValida, fechaFinValida] = [fechaFin, fechaInicio];
    }

    const filtros = [];
    const valores = [fechaInicioValida, fechaFinValida];

    // FILTRO PARA EXCLUIR NIVELES DE TRANSICIÓN
    filtros.push("c.descripcion NOT LIKE '%Transición%'");

    if (nivel && nivel !== '' && nivel !== 'todos') {
      const nivelMap = {
        'parvularia': ['Prekínder', 'Kínder'],
        'basica': ['1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'],
        'media': ['1° Medio', '2° Medio', '3° Medio', '4° Medio']
      };
      
      const nivelesPermitidos = nivelMap[nivel.toLowerCase()] || [nivel];
      
      if (nivelesPermitidos.length > 0) {
        const placeholders = nivelesPermitidos.map(() => 'c.descripcion LIKE ?').join(' OR ');
        filtros.push(`(${placeholders})`);
        nivelesPermitidos.forEach(nivelPermitido => {
          valores.push(`%${nivelPermitido}%`);
        });
      }
    }

    if (grado && grado !== '' && grado !== 'todos') {
      filtros.push("c.descripcion = ?");
      valores.push(grado);
    }
    
    if (curso && curso !== '' && curso !== 'todos') {
      filtros.push("c.letra = ?");
      valores.push(curso);
    }

    const whereClause = filtros.length ? 'AND ' + filtros.join(' AND ') : '';

    // ✅ CONSULTA MEJORADA: Obtener total de estudiantes por día excluyendo bloqueos
    const [asistencias] = await db.query(`
      SELECT 
        DATE(a.fecha) AS fecha,
        COUNT(DISTINCT e.id) AS total_estudiantes,
        SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) AS asistencias,
        SUM(CASE WHEN a.presente = 0 THEN 1 ELSE 0 END) AS faltas
      FROM asistencias a
      INNER JOIN estudiantes2 e ON a.id_estudiante = e.id
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE DATE(a.fecha) >= ? AND DATE(a.fecha) <= ?
      ${whereClause}
      AND e.id NOT IN (
        -- ✅ EXCLUIR ESTUDIANTES DE CURSOS BLOQUEADOS ESE DÍA
        SELECT DISTINCT e2.id
        FROM estudiantes2 e2
        INNER JOIN cursos c2 ON e2.curso_id = c2.id
        INNER JOIN blogueos_asistencia b ON c2.id = b.curso_id
        WHERE b.activo = true
        AND (
          (b.dia_semana = DAYOFWEEK(a.fecha) - 1 AND b.fecha_especifica IS NULL) OR
          (b.fecha_especifica = DATE(a.fecha))
        )
      )
      GROUP BY DATE(a.fecha)
      ORDER BY fecha
    `, valores);

    let tablaHTML = '';
    
    if (asistencias.length === 0) {
      tablaHTML = `
        <tr>
          <td colspan="4" style="text-align:center; padding: 20px; color: #666;">
            📊 No hay datos de asistencia para el rango de fechas seleccionado
          </td>
        </tr>
      `;
    } else {
      asistencias.forEach(dia => {
        const asistenciasNum = parseInt(dia.asistencias) || 0;
        const faltasNum = parseInt(dia.faltas) || 0;
        const totalEstudiantes = parseInt(dia.total_estudiantes) || 0;
        const porcentaje = totalEstudiantes > 0 ? ((asistenciasNum / totalEstudiantes) * 100) : 0;
        
        const fecha = new Date(dia.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-CL');
        
        const filaStyle = porcentaje < 50 ? 'style="background-color: #ffebee;"' : '';
        
        tablaHTML += `
          <tr ${filaStyle}>
            <td>${fechaFormateada}</td>
            <td>${asistenciasNum.toLocaleString()}</td>
            <td>${faltasNum.toLocaleString()}</td>
            <td><strong>${Math.round(porcentaje * 10) / 10}%</strong></td>
          </tr>
        `;
      });
    }

    res.json({ 
      success: true, 
      tablaHTML: tablaHTML,
      totalDias: asistencias.length
    });

  } catch (err) {
    console.error('❌ Error en getResumenAsistencias:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar resumen: ' + err.message 
    });
  }
};

exports.getAlumnosCriticos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requieren fechaInicio y fechaFin' 
      });
    }

    const filtros = [];
    const valores = [fechaInicio, fechaFin];

    // FILTRO PARA EXCLUIR NIVELES DE TRANSICIÓN
    filtros.push("c.descripcion NOT LIKE '%Transición%'");

    if (nivel && nivel !== '' && nivel !== 'todos') {
      const nivelMap = {
        'parvularia': ['Prekínder', 'Kínder'],
        'basica': ['1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'],
        'media': ['1° Medio', '2° Medio', '3° Medio', '4° Medio']
      };
      
      const nivelesPermitidos = nivelMap[nivel.toLowerCase()] || [nivel];
      
      if (nivelesPermitidos.length > 0) {
        const placeholders = nivelesPermitidos.map(() => 'c.descripcion LIKE ?').join(' OR ');
        filtros.push(`(${placeholders})`);
        nivelesPermitidos.forEach(nivelPermitido => {
          valores.push(`%${nivelPermitido}%`);
        });
      }
    }

    if (grado && grado !== '' && grado !== 'todos') {
      filtros.push("c.descripcion = ?");
      valores.push(grado);
    }
    
    if (curso && curso !== '' && curso !== 'todos') {
      filtros.push("c.letra = ?");
      valores.push(curso);
    }

    const whereClause = filtros.length ? 'AND ' + filtros.join(' AND ') : '';

    const [alumnos] = await db.query(`
      SELECT 
        e.id,
        e.run,
        CONCAT(e.nombres, ' ', e.apellido_paterno, ' ', e.apellido_materno) AS nombre_completo,
        c.descripcion AS curso,
        COUNT(*) AS total_registros,
        SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) AS asistencias,
        SUM(CASE WHEN a.presente = 0 THEN 1 ELSE 0 END) AS faltas,
        CASE 
          WHEN COUNT(*) > 0 THEN 
            ROUND((SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1)
          ELSE 0 
        END AS porcentaje_asistencia
      FROM estudiantes2 e
      INNER JOIN asistencias a ON e.id = a.id_estudiante
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE DATE(a.fecha) >= ? AND DATE(a.fecha) <= ?
      ${whereClause}
      AND e.id NOT IN (
        -- ✅ EXCLUIR ESTUDIANTES DE CURSOS BLOQUEADOS
        SELECT DISTINCT e2.id
        FROM estudiantes2 e2
        INNER JOIN cursos c2 ON e2.curso_id = c2.id
        INNER JOIN blogueos_asistencia b ON c2.id = b.curso_id
        WHERE b.activo = true
        AND (
          (b.dia_semana = DAYOFWEEK(a.fecha) - 1 AND b.fecha_especifica IS NULL) OR
          (b.fecha_especifica = DATE(a.fecha))
        )
      )
      GROUP BY e.id, e.run, e.nombres, e.apellido_paterno, e.apellido_materno, c.descripcion
      HAVING porcentaje_asistencia < 50 AND total_registros >= 3
      ORDER BY porcentaje_asistencia ASC
      LIMIT 100
    `, valores);

    const alumnosFormateados = alumnos.map(alumno => ({
      id: alumno.id,
      run: alumno.run,
      nombre_completo: alumno.nombre_completo,
      curso: alumno.curso,
      asistencias: parseInt(alumno.asistencias) || 0,
      faltas: parseInt(alumno.faltas) || 0,
      total_registros: parseInt(alumno.total_registros) || 0,
      porcentaje_asistencia: parseFloat(alumno.porcentaje_asistencia) || 0
    }));

    res.json({ 
      success: true, 
      alumnosCriticos: alumnosFormateados,
      total: alumnosFormateados.length
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener alumnos críticos: ' + err.message 
    });
  }
};

// ✅ NUEVA FUNCIÓN: Obtener bloqueos del día
exports.getBloqueosDelDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    
    if (!fecha) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere parámetro fecha' 
      });
    }

    console.log(`🔍 Buscando bloqueos para fecha: ${fecha}`);
    
    // Obtener el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    
    console.log(`📅 Día de la semana: ${diaSemana} (0=Dom, 1=Lun, ..., 6=Sab)`);

    const [bloqueos] = await db.query(`
      SELECT 
        b.id,
        c.descripcion as curso_nombre,
        c.nivel,
        c.letra,
        b.motivo,
        b.dia_semana,
        b.fecha_especifica
      FROM blogueos_asistencia b
      INNER JOIN cursos c ON b.curso_id = c.id
      WHERE b.activo = true
      AND (
        (b.dia_semana = ? AND b.fecha_especifica IS NULL) OR
        (b.fecha_especifica = ?)
      )
      ORDER BY c.nivel, c.letra
    `, [diaSemana, fecha]);

    console.log(`📊 Bloqueos encontrados: ${bloqueos.length} para ${fecha}`);
    
    res.json({ 
      success: true, 
      bloqueos: bloqueos,
      total: bloqueos.length
    });

  } catch (err) {
    console.error('❌ Error en getBloqueosDelDia:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener bloqueos: ' + err.message 
    });
  }
};