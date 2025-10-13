document.addEventListener('DOMContentLoaded', async () => {
  Chart.register(ChartDataLabels);

  const nivelSelect = document.getElementById("nivel");
  const gradoSelect = document.getElementById("grado");
  const cursoSelect = document.getElementById("curso");
  const fechaInicioInput = document.getElementById("fechaInicio");
  const fechaFinInput = document.getElementById("fechaFin");
  const btnFiltrar = document.querySelector('.btn-filtrar');

  let fechasDisponibles = [];

  // Obtener fechas válidas del backend
  try {
    const res = await fetch('/api/fechas-asistencia');
    fechasDisponibles = await res.json();
  } catch (err) {
    console.error("Error al obtener fechas de asistencia:", err);
  }

  const fechaConAsistencia = (date) => {
    const f = date.toISOString().split('T')[0];
    return fechasDisponibles.includes(f);
  };

  // Calendarios Flatpickr
  const opcionesFlatpickr = {
    dateFormat: "Y-m-d",
    disable: [
      date => {
        const d = date.getDay();
        return d === 0 || d === 6 || !fechaConAsistencia(date);
      }
    ],
    locale: "es"
  };

  flatpickr(fechaInicioInput, opcionesFlatpickr);
  flatpickr(fechaFinInput, opcionesFlatpickr);

  // Selects dinámicos
  function actualizarGrados() {
    const nivel = nivelSelect.value;
    gradoSelect.innerHTML = '<option value="todos">Todos</option>';
    cursoSelect.innerHTML = '<option value="todos">Todos</option>';

    if (nivel === "parvularia") {
      ["Prekínder", "Kínder"].forEach(g => gradoSelect.innerHTML += `<option>${g}</option>`);
    } else if (nivel === "basica") {
      for (let i = 1; i <= 8; i++) gradoSelect.innerHTML += `<option>${i}° Básico</option>`;
    } else if (nivel === "media") {
      for (let i = 1; i <= 4; i++) gradoSelect.innerHTML += `<option>${i}° Medio</option>`;
    }
  }

  function actualizarCursos() {
    const grado = gradoSelect.value;
    cursoSelect.innerHTML = '<option value="todos">Todos</option>';
    if (grado !== "todos") {
      ["A", "B"].forEach(c => cursoSelect.innerHTML += `<option>${grado} ${c}</option>`);
    }
  }

  nivelSelect.addEventListener('change', actualizarGrados);
  gradoSelect.addEventListener('change', actualizarCursos);

  // === GRÁFICO CIRCULAR ===
  const graficoCircular = new Chart(document.getElementById("graficoCircular"), {
    type: "doughnut",
    data: {
      labels: ["Asistencias", "Faltas"],
      datasets: [{
        data: [0, 0],
        backgroundColor: ["#2ECC71", "#E74C3C"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 14 } }
        }
      }
    }
  });

  // === GRÁFICO DE LÍNEAS ===
  const graficoLineas = new Chart(document.getElementById("graficoLineas"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "% Asistencia",
        data: [],
        borderColor: "#27ae60",
        backgroundColor: "rgba(39,174,96,0.2)",
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: "#27ae60",
        pointBorderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 10 }
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            title: ctx => `Fecha: ${ctx[0].label}`,
            label: ctx => `Asistencia: ${ctx.formattedValue}%`
          }
        },
        datalabels: {
          anchor: "end",
          align: "top",
          formatter: value => `${value.toFixed(1)}%`,
          font: { weight: "bold", size: 11 }
        }
      }
    }
  });

  // === Cargar datos ===
  async function cargarDatos() {
    if (!fechaInicioInput.value || !fechaFinInput.value) {
      alert("Selecciona ambas fechas.");
      return;
    }

    const params = new URLSearchParams({
      fechaInicio: fechaInicioInput.value,
      fechaFin: fechaFinInput.value,
      nivel: nivelSelect.value,
      grado: gradoSelect.value,
      curso: cursoSelect.value
    });

    const res = await fetch(`/api/asistencias?${params}`);
    const data = await res.json();
    if (!data.length) {
      alert("No hay asistencias en ese rango.");
      return;
    }

    const dataFiltrada = data.filter(a => {
      const d = new Date(a.fecha);
      return d.getDay() >= 1 && d.getDay() <= 5;
    });

    let totalA = 0, totalF = 0;
    const fechasUnicas = [...new Set(dataFiltrada.map(a => a.fecha))].sort();
    const porcentajes = fechasUnicas.map(f => {
      const registros = dataFiltrada.filter(a => a.fecha === f);
      const asist = registros.filter(r => r.presente === 1).length;
      const falt = registros.filter(r => r.presente === 0).length;
      totalA += asist;
      totalF += falt;
      return (asist / (asist + falt)) * 100 || 0;
    });

    // Actualizar gráficos
    graficoCircular.data.datasets[0].data = [totalA, totalF];
    graficoCircular.update();

    graficoLineas.data.labels = fechasUnicas.map(f => new Date(f).toLocaleDateString('es-CL'));
    graficoLineas.data.datasets[0].data = porcentajes;
    graficoLineas.update();

    actualizarTablaResumen(dataFiltrada);
    actualizarTablaCriticos(dataFiltrada);
  }

  function actualizarTablaResumen(data) {
    const tbody = document.querySelector("#tablaAsistencias tbody");
    tbody.innerHTML = "";
    const fechas = [...new Set(data.map(a => a.fecha))].sort();

    fechas.forEach(f => {
      const registros = data.filter(a => a.fecha === f);
      const asist = registros.filter(r => r.presente === 1).length;
      const falt = registros.filter(r => r.presente === 0).length;
      const porcentaje = (asist / (asist + falt)) * 100 || 0;

      tbody.innerHTML += `
        <tr>
          <td>${new Date(f).toLocaleDateString('es-CL')}</td>
          <td>${asist}</td>
          <td>${falt}</td>
          <td class="porcentaje">${porcentaje.toFixed(1)}%</td>
        </tr>`;
    });
  }

  function actualizarTablaCriticos(data) {
    const tbody = document.querySelector("#tablaCriticos tbody");
    tbody.innerHTML = "";

    const resumen = {};
    data.forEach(a => {
      if (!resumen[a.id_estudiante]) resumen[a.id_estudiante] = { nombre: a.nombre, rut: a.rut, curso: a.nombre_curso, a: 0, f: 0 };
      if (a.presente) resumen[a.id_estudiante].a++;
      else resumen[a.id_estudiante].f++;
    });

    const criticos = Object.values(resumen)
      .map(r => ({ ...r, p: (r.a / (r.a + r.f)) * 100 }))
      .filter(r => r.p < 50)
      .sort((a, b) => a.p - b.p);

    if (!criticos.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay alumnos críticos</td></tr>`;
      return;
    }

    criticos.forEach(r => {
      const clase = r.p < 30 ? "critico" : "medio";
      tbody.innerHTML += `<tr>
        <td>${r.nombre}</td><td>${r.rut}</td><td>${r.curso}</td>
        <td>${r.a}</td><td>${r.f}</td><td class="${clase}">${r.p.toFixed(1)}%</td>
      </tr>`;
    });
  }

  btnFiltrar.addEventListener("click", cargarDatos);
});
