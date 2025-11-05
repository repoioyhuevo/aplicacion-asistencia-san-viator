// controllers/dailyAttendanceController.js - VERSIÓN CORREGIDA
const db = require('../models/db');
const https = require('https');
const { verificarBloqueo } = require('./adminController'); // ✅ Importar función corregida

// Cache para almacenar feriados (para no hacer muchas llamadas a la API)
let feriadosCache = new Map();

// Función para obtener feriados de Chile desde API pública
async function obtenerFeriadosChile(año) {
  // Si ya tenemos los feriados en cache, los retornamos
  if (feriadosCache.has(año)) {
    return feriadosCache.get(año);
  }

  return new Promise((resolve, reject) => {
    const url = `https://apis.digital.gob.cl/fl/feriados/${año}`;
    
    console.log(`🔗 Solicitando feriados para ${año} desde: ${url}`);
    
    const req = https.get(url, (response) => {
      let data = '';

      // Verificar el status code
      if (response.statusCode !== 200) {
        console.log(`⚠️ API de feriados respondió con status: ${response.statusCode}`);
        resolve(obtenerFeriadosPorDefecto(año));
        return;
      }

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          // Verificar que la respuesta no esté vacía
          if (!data || data.trim() === '') {
            console.log('⚠️ Respuesta de feriados vacía, usando lista por defecto');
            resolve(obtenerFeriadosPorDefecto(año));
            return;
          }
          
          const feriados = JSON.parse(data);
          
          // Verificar que sea un array
          if (!Array.isArray(feriados)) {
            console.log('⚠️ Respuesta de feriados no es un array válido');
            resolve(obtenerFeriadosPorDefecto(año));
            return;
          }
          
          const fechasFeriados = feriados.map(feriado => feriado.fecha);
          
          // Guardar en cache
          feriadosCache.set(año, fechasFeriados);
          console.log(`📅 Obtenidos ${fechasFeriados.length} feriados para ${año}`);
          resolve(fechasFeriados);
        } catch (error) {
          console.error('❌ Error parseando feriados, usando lista por defecto:', error.message);
          console.log('📦 Respuesta recibida:', data.substring(0, 200)); // Log parcial para debug
          resolve(obtenerFeriadosPorDefecto(año));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error obteniendo feriados, usando lista por defecto:', error.message);
      resolve(obtenerFeriadosPorDefecto(año));
    });

    // Timeout después de 10 segundos
    req.setTimeout(10000, () => {
      console.log('⏰ Timeout obteniendo feriados, usando lista por defecto');
      req.destroy();
      resolve(obtenerFeriadosPorDefecto(año));
    });
  });
}

// Lista de feriados por defecto (por si falla la API)
function obtenerFeriadosPorDefecto(año) {
  console.log(`📋 Usando lista de feriados por defecto para ${año}`);
  
  const feriadosFijos = [
    `${año}-01-01`, // Año Nuevo
    `${año}-05-01`, // Día del Trabajo
    `${año}-05-21`, // Día de las Glorias Navales
    `${año}-06-20`, // Día Nacional de los Pueblos Indígenas
    `${año}-07-16`, // Virgen del Carmen
    `${año}-08-15`, // Asunción de la Virgen
    `${año}-09-18`, // Independencia Nacional
    `${año}-09-19`, // Día de las Glorias del Ejército
    `${año}-10-12`, // Encuentro de Dos Mundos
    `${año}-10-31`, // Día de las Iglesias Evangélicas y Protestantes
    `${año}-11-01`, // Día de Todos los Santos
    `${año}-12-08`, // Inmaculada Concepción
    `${año}-12-25`, // Navidad
  ];

  // Calcular feriados móviles (aproximado)
  const pascua = calcularPascua(año);
  const feriadosMoviles = [
    sumarDias(pascua, -2), // Viernes Santo
    sumarDias(pascua, -1), // Sábado Santo
    sumarDias(pascua, 26), // Ascensión del Señor
    sumarDias(pascua, 60), // Corpus Christi
    sumarDias(new Date(año, 5, 20), 1), // San Pedro y San Pablo (primer lunes después del 29 de junio)
  ];

  const todosFeriados = [...feriadosFijos, ...feriadosMoviles];
  feriadosCache.set(año, todosFeriados);
  
  console.log(`✅ Lista por defecto generada con ${todosFeriados.length} feriados`);
  return todosFeriados;
}

// Función para calcular Domingo de Pascua (Algoritmo de Gauss)
function calcularPascua(año) {
  const a = año % 19;
  const b = Math.floor(año / 100);
  const c = año % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(año, mes, dia);
}

// Función para sumar días a una fecha
function sumarDias(fecha, dias) {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado.toISOString().split('T')[0];
}

// Función para verificar si es día hábil (Lunes a Viernes y no feriado)
async function esDiaHabil(fecha = new Date()) {
  const diaSemana = fecha.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  const fechaStr = fecha.toISOString().split('T')[0];
  const año = fecha.getFullYear();

  // No es hábil si es fin de semana
  if (diaSemana === 0 || diaSemana === 6) {
    console.log(`📅 ${fechaStr} es fin de semana, omitiendo...`);
    return false;
  }

  try {
    // Obtener feriados del año
    const feriados = await obtenerFeriadosChile(año);

    // No es hábil si es feriado
    if (feriados.includes(fechaStr)) {
      console.log(`🎄 ${fechaStr} es feriado, omitiendo...`);
      return false;
    }

    console.log(`✅ ${fechaStr} es día hábil (Lunes a Viernes y no feriado)`);
    return true;
  } catch (error) {
    console.error('❌ Error verificando feriados, asumiendo día hábil:', error.message);
    return true; // Por defecto asumir que es hábil si hay error
  }
}

// ✅ FUNCIÓN CORREGIDA: Registrar faltas automáticas diarias
exports.registrarFaltasAutomaticas = async () => {
  try {
    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0];

    // Verificar si es día hábil
    const esHabil = await esDiaHabil(hoy);
    if (!esHabil) {
      console.log(`⏭️ ${fechaStr} no es día hábil, no se registran faltas automáticas`);
      return;
    }

    console.log(`🔄 Iniciando registro automático de faltas para: ${fechaStr}`);
    
    // Verificar si ya se ejecutó hoy (solo registros automáticos)
    const [verificacion] = await db.query(
      `SELECT COUNT(*) as count FROM asistencias 
       WHERE DATE(fecha) = ? AND tipo_registro = 'falta_automatica'`,
      [fechaStr]
    );
    
    if (verificacion[0].count > 0) {
      console.log('✅ Ya se registraron faltas automáticas hoy, omitiendo...');
      return;
    }
    
    // Obtener todos los estudiantes EXCLUYENDO TRANSICIÓN
    const [estudiantes] = await db.query(
      `SELECT e.id, e.run, e.nombres, e.apellido_paterno, e.curso_id
       FROM estudiantes2 e
       INNER JOIN cursos c ON e.curso_id = c.id
       WHERE c.descripcion NOT LIKE '%Transición%'
       AND e.activo = 1`
    );
    
    if (estudiantes.length === 0) {
      console.log('⚠️ No hay estudiantes activos para registrar faltas');
      return;
    }
    
    console.log(`📝 Procesando ${estudiantes.length} estudiantes...`);
    
    let registrosExitosos = 0;
    let registrosConError = 0;
    let registrosBloqueados = 0;

    // Registrar faltas automáticas
    for (const estudiante of estudiantes) {
      try {
        // ✅ VERIFICAR SI EL CURSO ESTÁ BLOQUEADO PARA HOY
        const estaBloqueado = await verificarBloqueo(estudiante.curso_id, fechaStr);
        
        if (estaBloqueado) {
          console.log(`⏭️ Curso ${estudiante.curso_id} bloqueado hoy, omitiendo estudiante ${estudiante.run}`);
          registrosBloqueados++;
          continue; // Saltar este estudiante
        }

        await db.query(
          `INSERT INTO asistencias 
           (id_estudiante, fecha, hora, tipo_registro, presente) 
           VALUES (?, ?, '06:00:00', 'falta_automatica', 0)`,
          [estudiante.id, fechaStr]
        );
        registrosExitosos++;
      } catch (error) {
        // Si es error de duplicado, ignorar (ya fue registrado)
        if (error.code === 'ER_DUP_ENTRY') {
          registrosExitosos++;
        } else {
          console.error(`❌ Error registrando falta automática para ${estudiante.run}:`, error.message);
          registrosConError++;
        }
      }
    }
    
    console.log(`✅ ${registrosExitosos} faltas automáticas registradas para ${fechaStr}`);
    console.log(`⏭️ ${registrosBloqueados} estudiantes omitidos por bloqueos`);
    if (registrosConError > 0) {
      console.log(`⚠️ ${registrosConError} registros con error`);
    }
    
  } catch (error) {
    console.error('❌ Error en registro automático de faltas:', error);
  }
};

// Programar tarea diaria a las 6:00 AM
exports.iniciarProgramadorDiario = () => {
  try {
    const cron = require('node-cron');
    
    // Ejecutar todos los días a las 6:00 AM
    cron.schedule('0 6 * * *', () => {
      console.log('⏰ Ejecutando tarea programada: registro de faltas automáticas');
      exports.registrarFaltasAutomaticas();
    });
    
    // También ejecutar al iniciar el servidor (para el día actual)
    setTimeout(() => {
      console.log('🚀 Verificando registro automático al iniciar servidor...');
      exports.registrarFaltasAutomaticas();
    }, 10000); // Esperar 10 segundos después de iniciar
    
    console.log('✅ Programador diario de faltas iniciado (6:00 AM todos los días)');
    console.log('📅 Sistema configurado para: Lunes a Viernes (excluyendo feriados)');
    console.log('🎯 Estudiantes: Solo Prekínder a 4° Medio (excluyendo transición)');
    console.log('🚫 Bloqueos: Activados - Se respetarán los cursos bloqueados');
    
  } catch (error) {
    console.log('❌ node-cron no instalado. Para activar el programador automático:');
    console.log('   Ejecuta: npm install node-cron');
  }
};

// Función para forzar ejecución manual (para testing)
exports.ejecutarAhora = async () => {
  console.log('🔧 Ejecutando registro manual...');
  await exports.registrarFaltasAutomaticas();
};

// Función para verificar feriados (para testing)
exports.verificarFeriados = async (año = new Date().getFullYear()) => {
  try {
    const feriados = await obtenerFeriadosChile(año);
    console.log(`📅 Feriados ${año}:`, feriados);
    return feriados;
  } catch (error) {
    console.error('Error verificando feriados:', error);
  }
};