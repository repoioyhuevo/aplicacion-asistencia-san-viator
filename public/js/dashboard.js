// public/js/Dashboard.js
class Dashboard {
  constructor() {
    this.graficoCircular = null;
    this.graficoLineas = null;
    this.flatpickrInicio = null;
    this.flatpickrFin = null;
    this.todosLosGrados = [];
    this.init();
  }

  init() {
    console.log('🚀 Inicializando Dashboard...');
    this.configurarFiltros();
    this.cargarDatosIniciales();
    this.configurarEventos();
  }

  configurarFiltros() {
    try {
      // Verificar si Flatpickr está disponible
      if (typeof flatpickr === 'undefined') {
        console.warn('⚠️ Flatpickr no está disponible, usando inputs nativos');
        this.usarInputsNativos();
        return;
      }

      // Configurar Flatpickr para fechas - CONFIGURACIÓN CORREGIDA
      this.flatpickrInicio = flatpickr("#fechaInicio", {
        locale: "es",
        dateFormat: "Y-m-d",
        defaultDate: new Date().toISOString().split('T')[0],
        allowInput: true,
        clickOpens: true,
        static: true,
        monthSelectorType: 'static',
        onChange: (selectedDates, dateStr) => {
          console.log('📅 Fecha inicio cambiada:', dateStr);
        }
      });

      this.flatpickrFin = flatpickr("#fechaFin", {
        locale: "es",
        dateFormat: "Y-m-d", 
        defaultDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        allowInput: true,
        clickOpens: true,
        static: true,
        monthSelectorType: 'static',
        onChange: (selectedDates, dateStr) => {
          console.log('📅 Fecha fin cambiada:', dateStr);
        }
      });

      console.log('✅ Flatpickr configurado correctamente');
    } catch (error) {
      console.error('❌ Error configurando Flatpickr:', error);
      this.usarInputsNativos();
    }

    this.cargarGrados();
  }

  usarInputsNativos() {
    // Fallback a inputs de fecha nativos
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio && fechaFin) {
      fechaInicio.type = 'date';
      fechaFin.type = 'date';
      
      // Establecer fechas por defecto
      const hoy = new Date();
      const enUnaSemana = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      fechaInicio.value = hoy.toISOString().split('T')[0];
      fechaFin.value = enUnaSemana.toISOString().split('T')[0];
      
      console.log('✅ Usando inputs de fecha nativos');
    }
  }

  validarYRangoFechas(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) {
      return { fechaInicio: null, fechaFin: null, valido: false };
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (inicio > fin) {
      console.log('🔄 Fechas invertidas, corrigiendo...');
      return { 
        fechaInicio: fechaFin, 
        fechaFin: fechaInicio, 
        valido: true 
      };
    }

    return { 
      fechaInicio: fechaInicio, 
      fechaFin: fechaFin, 
      valido: true 
    };
  }

  async cargarGrados() {
    try {
      console.log('📚 Cargando grados desde API...');
      const response = await fetch('/api/asistencias/grados');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const grados = await response.json();
      
      // Guardar todos los grados para filtrado posterior
      this.todosLosGrados = Array.isArray(grados) ? grados : [];
      
      this.actualizarFiltroGrados();
      console.log('✅ Grados cargados:', this.todosLosGrados.length);
    } catch (error) {
      console.error('❌ Error cargando grados:', error);
      // Cargar grados por defecto si falla la API
      this.cargarGradosPorDefecto();
    }
  }

  actualizarFiltroGrados() {
    const nivelSeleccionado = document.getElementById('nivel');
    const selectGrado = document.getElementById('grado');
    
    if (!nivelSeleccionado || !selectGrado) {
      console.error('❌ Elementos del DOM no encontrados');
      return;
    }
    
    // Limpiar select
    selectGrado.innerHTML = '<option value="todos">Todos los grados</option>';
    
    // Filtrar grados según el nivel seleccionado
    let gradosFiltrados = this.todosLosGrados;
    const nivel = nivelSeleccionado.value;
    
    if (nivel && nivel !== 'todos') {
      const filtrosNivel = {
        'parvularia': (grado) => grado.includes('Prekínder') || grado.includes('Kínder'),
        'basica': (grado) => grado.includes('Básico'),
        'media': (grado) => grado.includes('Medio')
      };
      
      const filtro = filtrosNivel[nivel];
      if (filtro) {
        gradosFiltrados = this.todosLosGrados.filter(filtro);
      }
    }
    
    // Agregar opciones filtradas
    gradosFiltrados.forEach(grado => {
      if (grado && grado !== 'Todos') {
        const option = document.createElement('option');
        option.value = grado;
        option.textContent = grado;
        selectGrado.appendChild(option);
      }
    });
    
    console.log(`✅ Grados filtrados para nivel ${nivel}:`, gradosFiltrados.length);
  }

  cargarGradosPorDefecto() {
    console.log('📚 Cargando grados por defecto...');
    this.todosLosGrados = [
      'Prekínder A', 'Prekínder B', 'Kínder A', 'Kínder B',
      '1° Básico A', '1° Básico B', '2° Básico A', '2° Básico B',
      '3° Básico A', '3° Básico B', '4° Básico A', '4° Básico B',
      '5° Básico A', '5° Básico B', '6° Básico A', '6° Básico B',
      '7° Básico A', '7° Básico B', '8° Básico A',
      '1° Medio A', '1° Medio B', '2° Medio A', '2° Medio B',
      '3° Medio A', '3° Medio B', '4° Medio A', '4° Medio B'
    ];
    
    this.actualizarFiltroGrados();
  }

  configurarEventos() {
    const btnFiltrar = document.querySelector('.btn-filtrar');
    if (btnFiltrar) {
      btnFiltrar.addEventListener('click', () => {
        this.aplicarFiltros();
      });
    }

    const nivelSelect = document.getElementById('nivel');
    const gradoSelect = document.getElementById('grado');
    
    // Cuando cambia el nivel, actualizar grados
    if (nivelSelect) {
      nivelSelect.addEventListener('change', () => {
        this.actualizarFiltroGrados();
        this.aplicarFiltros();
      });
    }
    
    // Cuando cambia el grado, aplicar filtros
    if (gradoSelect) {
      gradoSelect.addEventListener('change', () => {
        this.aplicarFiltros();
      });
    }
  }

  async aplicarFiltros() {
    console.log('🎯 Aplicando filtros...');
    
    const fechaInicioElem = document.getElementById('fechaInicio');
    const fechaFinElem = document.getElementById('fechaFin');
    const nivelElem = document.getElementById('nivel');
    const gradoElem = document.getElementById('grado');
    
    if (!fechaInicioElem || !fechaFinElem || !nivelElem || !gradoElem) {
      console.error('❌ Elementos de filtro no encontrados');
      return;
    }
    
    let fechaInicio = fechaInicioElem.value;
    let fechaFin = fechaFinElem.value;

    console.log('📅 Fechas seleccionadas:', { fechaInicio, fechaFin });

    const fechasValidadas = this.validarYRangoFechas(fechaInicio, fechaFin);
    
    if (!fechasValidadas.valido) {
      alert('Por favor selecciona un rango de fechas válido');
      return;
    }

    const filtros = {
      fechaInicio: fechasValidadas.fechaInicio,
      fechaFin: fechasValidadas.fechaFin,
      nivel: nivelElem.value,
      grado: gradoElem.value,
      curso: 'todos'
    };

    console.log('📋 Filtros aplicados:', filtros);

    this.mostrarLoading(true);

    try {
      await Promise.all([
        this.cargarResumenDiario(filtros),
        this.cargarAlumnosCriticos(filtros),
        this.cargarGraficos(filtros)
      ]);
    } catch (error) {
      console.error('❌ Error aplicando filtros:', error);
      this.mostrarError('Error al cargar los datos: ' + error.message);
    } finally {
      this.mostrarLoading(false);
    }
  }

  async cargarResumenDiario(filtros) {
    try {
      console.log('📊 Cargando resumen diario...');
      
      const params = new URLSearchParams();
      params.append('fechaInicio', filtros.fechaInicio);
      params.append('fechaFin', filtros.fechaFin);
      params.append('nivel', filtros.nivel);
      params.append('grado', filtros.grado);
      params.append('curso', filtros.curso);
      params.append('_t', Date.now());

      const response = await fetch(`/api/asistencias/resumen?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();

      console.log('📦 Respuesta del backend:', data);

      if (data.success) {
        const tbody = document.querySelector('#tablaAsistencias tbody');
        if (tbody) {
          tbody.innerHTML = data.tablaHTML || '<tr><td colspan="4">No hay datos disponibles</td></tr>';
          console.log('✅ Tabla actualizada');
        }
      } else {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error cargando resumen:', error);
      const tbody = document.querySelector('#tablaAsistencias tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error al cargar resumen</td></tr>';
      }
    }
  }

  async cargarAlumnosCriticos(filtros) {
    try {
      console.log('⚠️ Cargando alumnos críticos...');
      
      const params = new URLSearchParams();
      params.append('fechaInicio', filtros.fechaInicio);
      params.append('fechaFin', filtros.fechaFin);
      params.append('nivel', filtros.nivel);
      params.append('grado', filtros.grado);
      params.append('curso', filtros.curso);
      params.append('_t', Date.now());

      const response = await fetch(`/api/asistencias/alumnos-criticos?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        console.log('✅ Alumnos críticos recibidos:', data.alumnosCriticos?.length || 0);
        this.actualizarTablaCriticos(data.alumnosCriticos || []);
      } else {
        throw new Error(data.message || 'Error desconocido en la respuesta');
      }
    } catch (error) {
      console.error('❌ Error cargando alumnos críticos:', error);
      const tbody = document.querySelector('#tablaCriticos tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar alumnos críticos</td></tr>';
      }
    }
  }

  actualizarTablaCriticos(alumnos) {
    const tbody = document.querySelector('#tablaCriticos tbody');
    if (!tbody) {
      console.error('❌ No se encontró la tabla de alumnos críticos');
      return;
    }

    tbody.innerHTML = '';

    if (!alumnos || alumnos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 20px; color: #666;">
            🎉 ¡Excelente! No hay alumnos críticos (todos tienen más del 50% de asistencia)
          </td>
        </tr>
      `;
      return;
    }

    alumnos.forEach(alumno => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><strong>${alumno.nombre_completo || 'Nombre no disponible'}</strong></td>
        <td>${alumno.run || 'N/A'}</td>
        <td>${alumno.curso || 'Curso no asignado'}</td>
        <td>${alumno.asistencias || 0}</td>
        <td>${alumno.faltas || 0}</td>
        <td><strong style="color: red; font-size: 16px;">${alumno.porcentaje_asistencia || 0}%</strong></td>
      `;
      
      fila.style.backgroundColor = '#fff3cd';
      fila.style.borderLeft = '4px solid #dc3545';
      
      tbody.appendChild(fila);
    });

    const filaResumen = document.createElement('tr');
    filaResumen.innerHTML = `
      <td colspan="6" style="text-align: center; background-color: #f8f9fa; font-weight: bold; padding: 10px;">
        📊 Total de alumnos críticos: <span style="color: red;">${alumnos.length}</span>
      </td>
    `;
    tbody.appendChild(filaResumen);

    console.log('✅ Tabla de alumnos críticos actualizada con', alumnos.length, 'alumnos');
  }

  async cargarGraficos(filtros) {
    try {
      console.log('📈 Cargando gráficos...');
      
      const params = new URLSearchParams();
      params.append('fechaInicio', filtros.fechaInicio);
      params.append('fechaFin', filtros.fechaFin);
      params.append('nivel', filtros.nivel);
      params.append('grado', filtros.grado);
      params.append('curso', filtros.curso);
      params.append('_t', Date.now());

      const response = await fetch(`/api/asistencias?${params}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        this.actualizarGraficos(data.asistencias || []);
        console.log('✅ Gráficos cargados correctamente');
      } else {
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('❌ Error cargando gráficos:', error);
      // No mostrar error para gráficos, son opcionales
    }
  }

  actualizarGraficos(asistencias) {
    this.actualizarGraficoCircular(asistencias);
    this.actualizarGraficoLineas(asistencias);
  }

  actualizarGraficoCircular(asistencias) {
    const ctx = document.getElementById('graficoCircular');
    if (!ctx) {
      console.error('❌ No se encontró el canvas para el gráfico circular');
      return;
    }

    const totalAsistencias = asistencias.filter(a => a.presente === 1).length;
    const totalFaltas = asistencias.filter(a => a.presente === 0).length;
    const total = totalAsistencias + totalFaltas;

    if (this.graficoCircular) {
      this.graficoCircular.destroy();
    }

    this.graficoCircular = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [`Asistencias (${totalAsistencias})`, `Faltas (${totalFaltas})`],
        datasets: [{
          data: [totalAsistencias, totalFaltas],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderColor: ['#388E3C', '#D32F2F'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  actualizarGraficoLineas(asistencias) {
    const ctx = document.getElementById('graficoLineas');
    if (!ctx) {
      console.error('❌ No se encontró el canvas para el gráfico de líneas');
      return;
    }

    const datosPorFecha = {};
    asistencias.forEach(a => {
      const fecha = a.fecha;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { asistencias: 0, faltas: 0 };
      }
      if (a.presente === 1) {
        datosPorFecha[fecha].asistencias++;
      } else {
        datosPorFecha[fecha].faltas++;
      }
    });

    const fechas = Object.keys(datosPorFecha).sort();
    const datosAsistencias = fechas.map(f => datosPorFecha[f].asistencias);
    const datosFaltas = fechas.map(f => datosPorFecha[f].faltas);

    if (this.graficoLineas) {
      this.graficoLineas.destroy();
    }

    this.graficoLineas = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas.map(f => this.formatearFechaCorta(f)),
        datasets: [
          {
            label: 'Asistencias',
            data: datosAsistencias,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Faltas',
            data: datosFaltas,
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  formatearFechaCorta(fechaStr) {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    } catch (error) {
      return fechaStr;
    }
  }

  mostrarLoading(mostrar) {
    const btnFiltrar = document.querySelector('.btn-filtrar');
    if (btnFiltrar) {
      if (mostrar) {
        btnFiltrar.innerHTML = '🔄 Filtrando...';
        btnFiltrar.disabled = true;
      } else {
        btnFiltrar.innerHTML = 'Filtrar';
        btnFiltrar.disabled = false;
      }
    }
  }

  mostrarError(mensaje) {
    // Puedes implementar un sistema de notificaciones más elegante
    console.error('❌ Error:', mensaje);
    alert(mensaje);
  }

  cargarDatosIniciales() {
    // Esperar a que la página se cargue completamente
    setTimeout(() => {
      this.aplicarFiltros();
    }, 1500);
  }
}

// Inicializar cuando se carga el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
  });
} else {
  // DOM ya está listo
  new Dashboard();
}