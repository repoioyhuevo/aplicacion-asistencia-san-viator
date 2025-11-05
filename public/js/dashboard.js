// public/js/Dashboard.js - VERSIÓN SIN BLOQUEOS
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
    
    setTimeout(() => {
      this.inicializarTodo();
    }, 100);
  }

  inicializarTodo() {
    try {
      this.configurarFlatpickr();
      this.cargarGrados();
      this.configurarEventos();
      this.cargarDatosIniciales();
    } catch (error) {
      console.error('❌ Error inicializando:', error);
    }
  }

  configurarFlatpickr() {
    try {
      console.log('📅 Configurando Flatpickr...');
      
      const opciones = {
        dateFormat: "Y-m-d",
        allowInput: false,
        clickOpens: true,
        locale: "es"
      };

      this.flatpickrInicio = flatpickr("#fechaInicio", {
        ...opciones,
        defaultDate: "2025-10-20"
      });

      this.flatpickrFin = flatpickr("#fechaFin", {
        ...opciones, 
        defaultDate: "2025-10-29"
      });

      console.log('✅ Flatpickr configurado');
      
    } catch (error) {
      console.error('❌ Error con Flatpickr:', error);
      this.usarInputsNativos();
    }
  }

  usarInputsNativos() {
    console.log('🔄 Usando inputs nativos...');
    const inicio = document.getElementById('fechaInicio');
    const fin = document.getElementById('fechaFin');
    
    if (inicio && fin) {
      inicio.type = 'date';
      fin.type = 'date';
      inicio.value = '2025-10-20';
      fin.value = '2025-10-29';
    }
  }

  async cargarGrados() {
    try {
      const response = await fetch('/api/asistencias/grados');
      const grados = await response.json();
      this.todosLosGrados = Array.isArray(grados) ? grados : [];
      this.actualizarFiltroGrados();
    } catch (error) {
      console.error('Error cargando grados:', error);
      this.cargarGradosPorDefecto();
    }
  }

  actualizarFiltroGrados() {
    const nivel = document.getElementById('nivel');
    const grado = document.getElementById('grado');
    
    if (!nivel || !grado) return;
    
    grado.innerHTML = '<option value="todos">Todos los grados</option>';
    
    const nivelValor = nivel.value;
    let gradosFiltrados = this.todosLosGrados;
    
    if (nivelValor && nivelValor !== 'todos') {
      const filtros = {
        'parvularia': g => g.includes('Prekínder') || g.includes('Kínder'),
        'basica': g => g.includes('Básico'),
        'media': g => g.includes('Medio')
      };
      
      if (filtros[nivelValor]) {
        gradosFiltrados = this.todosLosGrados.filter(filtros[nivelValor]);
      }
    }
    
    gradosFiltrados.forEach(g => {
      const option = document.createElement('option');
      option.value = g;
      option.textContent = g;
      grado.appendChild(option);
    });
  }

  cargarGradosPorDefecto() {
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
    document.querySelector('.btn-filtrar')?.addEventListener('click', () => {
      this.aplicarFiltros();
    });

    document.getElementById('nivel')?.addEventListener('change', () => {
      this.actualizarFiltroGrados();
      this.aplicarFiltros();
    });

    document.getElementById('grado')?.addEventListener('change', () => {
      this.aplicarFiltros();
    });
  }

  async aplicarFiltros() {
    console.log('🎯 Aplicando filtros...');
    
    const filtros = this.obtenerFiltros();
    
    if (!this.validarFiltros(filtros)) return;

    this.mostrarLoading(true);

    try {
      await Promise.all([
        this.cargarResumenDiario(filtros),
        this.cargarAlumnosCriticos(filtros),
        this.cargarGraficos(filtros)
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.mostrarLoading(false);
    }
  }

  obtenerFiltros() {
    let fechaInicio, fechaFin;
    
    if (this.flatpickrInicio && this.flatpickrFin) {
      fechaInicio = this.flatpickrInicio.input.value;
      fechaFin = this.flatpickrFin.input.value;
    } else {
      fechaInicio = document.getElementById('fechaInicio').value;
      fechaFin = document.getElementById('fechaFin').value;
    }

    return {
      fechaInicio,
      fechaFin,
      nivel: document.getElementById('nivel').value,
      grado: document.getElementById('grado').value,
      curso: 'todos'
    };
  }

  validarFiltros(filtros) {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      alert('Selecciona un rango de fechas válido');
      return false;
    }
    return true;
  }

  async cargarResumenDiario(filtros) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(`/api/asistencias/resumen?${params}`);
      const data = await response.json();

      if (data.success) {
        const tbody = document.querySelector('#tablaAsistencias tbody');
        if (tbody) tbody.innerHTML = data.tablaHTML;
      }
    } catch (error) {
      console.error('Error resumen:', error);
    }
  }

  async cargarAlumnosCriticos(filtros) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(`/api/asistencias/alumnos-criticos?${params}`);
      const data = await response.json();

      if (data.success) {
        this.actualizarTablaCriticos(data.alumnosCriticos || []);
      }
    } catch (error) {
      console.error('Error alumnos críticos:', error);
    }
  }

  actualizarTablaCriticos(alumnos) {
    const tbody = document.querySelector('#tablaCriticos tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!alumnos.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay alumnos críticos</td></tr>';
      return;
    }

    alumnos.forEach(alumno => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td><strong>${alumno.nombre_completo || 'N/A'}</strong></td>
        <td>${alumno.run || 'N/A'}</td>
        <td>${alumno.curso || 'N/A'}</td>
        <td>${alumno.asistencias || 0}</td>
        <td>${alumno.faltas || 0}</td>
        <td><strong style="color: red;">${alumno.porcentaje_asistencia || 0}%</strong></td>
      `;
      fila.style.backgroundColor = '#fff3cd';
      tbody.appendChild(fila);
    });
  }

  async cargarGraficos(filtros) {
    try {
      const params = new URLSearchParams(filtros);
      const response = await fetch(`/api/asistencias?${params}`);
      const data = await response.json();

      if (data.success) {
        this.actualizarGraficos(data.asistencias || []);
      }
    } catch (error) {
      console.error('Error gráficos:', error);
    }
  }

  actualizarGraficos(asistencias) {
    this.actualizarGraficoCircular(asistencias);
    this.actualizarGraficoLineas(asistencias);
  }

  actualizarGraficoCircular(asistencias) {
    const ctx = document.getElementById('graficoCircular');
    if (!ctx) return;

    const presentes = asistencias.filter(a => a.presente === 1).length;
    const ausentes = asistencias.filter(a => a.presente === 0).length;

    if (this.graficoCircular) this.graficoCircular.destroy();

    this.graficoCircular = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [`Presentes (${presentes})`, `Ausentes (${ausentes})`],
        datasets: [{
          data: [presentes, ausentes],
          backgroundColor: ['#4CAF50', '#F44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  actualizarGraficoLineas(asistencias) {
    const ctx = document.getElementById('graficoLineas');
    if (!ctx) {
        console.log('❌ No se encuentra el canvas para gráfico de líneas');
        return;
    }

    try {
        const datosPorDia = {};
        
        asistencias.forEach(registro => {
            if (registro.fecha) {
                if (!datosPorDia[registro.fecha]) {
                    datosPorDia[registro.fecha] = {
                        total: 0,
                        presentes: 0
                    };
                }
                datosPorDia[registro.fecha].total++;
                if (registro.presente === 1) {
                    datosPorDia[registro.fecha].presentes++;
                }
            }
        });

        const fechas = Object.keys(datosPorDia).sort((a, b) => new Date(a) - new Date(b));
        
        const porcentajes = fechas.map(fecha => {
            const dia = datosPorDia[fecha];
            return dia.total > 0 ? ((dia.presentes / dia.total) * 100).toFixed(1) : 0;
        });

        const fechasFormateadas = fechas.map(fecha => {
            try {
                const date = new Date(fecha);
                return date.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'short' 
                });
            } catch (error) {
                return fecha;
            }
        });

        if (this.graficoLineas) {
            this.graficoLineas.destroy();
        }

        const colores = {
            linea: '#FF6B35',
            relleno: 'rgba(255, 107, 53, 0.1)',
            punto: '#FF6B35',
            puntoBorde: '#FFFFFF',
            grid: 'rgba(0, 0, 0, 0.1)',
            texto: '#333333'
        };

        this.graficoLineas = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fechasFormateadas,
                datasets: [{
                    label: '📊 % de Asistencia',
                    data: porcentajes,
                    borderColor: colores.linea,
                    backgroundColor: colores.relleno,
                    borderWidth: 4,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: colores.punto,
                    pointBorderColor: colores.puntoBorde,
                    pointBorderWidth: 3,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: '#FF9D76',
                    pointHoverBorderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Asistencia por Día',
                        font: { 
                            size: 18, 
                            weight: 'bold',
                            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                        },
                        color: colores.texto,
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 14 },
                            color: colores.texto,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        borderColor: colores.linea,
                        borderWidth: 2,
                        callbacks: {
                            label: function(context) {
                                return `Asistencia: ${context.parsed.y}%`;
                            },
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const fechaOriginal = fechas[index];
                                try {
                                    const date = new Date(fechaOriginal);
                                    return date.toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    });
                                } catch (error) {
                                    return fechaOriginal;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        min: 0,
                        grid: {
                            color: colores.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: { size: 12 },
                            color: colores.texto,
                            stepSize: 10
                        },
                        title: {
                            display: true,
                            text: 'Porcentaje de Asistencia',
                            font: { size: 14, weight: 'bold' },
                            color: colores.texto
                        }
                    },
                    x: {
                        grid: {
                            color: colores.grid,
                            lineWidth: 1
                        },
                        ticks: {
                            font: { size: 11 },
                            color: colores.texto,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        title: {
                            display: true,
                            text: 'Fechas',
                            font: { size: 14, weight: 'bold' },
                            color: colores.texto
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            }
        });

        console.log('✅ Gráfico de líneas actualizado');

    } catch (error) {
        console.error('❌ Error creando gráfico de líneas:', error);
    }
  }

  mostrarLoading(mostrar) {
    const btn = document.querySelector('.btn-filtrar');
    if (btn) {
      btn.disabled = mostrar;
      btn.innerHTML = mostrar ? '🔄 Cargando...' : 'Filtrar';
    }
  }

  cargarDatosIniciales() {
    setTimeout(() => {
      this.aplicarFiltros();
    }, 1000);
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});