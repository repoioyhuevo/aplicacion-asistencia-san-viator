document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Obtener datos
    const res = await fetch('/api/asistencias');
    const data = await res.json();

    // 🔹 FILTRAR POR SEMANA DEL 10 DE MARZO 2025
    const semanaInicio = new Date('2025-03-09'); // Lunes de la semana
    const semanaFin = new Date('2025-03-15');   // Domingo de la semana

    const dataSemana = data.filter(a => {
      const fecha = new Date(a.fecha);
      return fecha >= semanaInicio && fecha <= semanaFin;
    });

    // --- TABLA 1: Alumnos críticos (≤50%) ---
    const criticos = dataSemana.filter(a => {
      const total = (a.asistencias ?? 0) + (a.faltas ?? 0);
      const porcentaje = total > 0 ? (a.asistencias / total) * 100 : 0;
      return porcentaje <= 50;
    });

    const tbodyCriticos = document.querySelector('#criticos tbody');
    tbodyCriticos.innerHTML = criticos.map(a => {
      const total = (a.asistencias ?? 0) + (a.faltas ?? 0);
      const porcentaje = total > 0 ? (a.asistencias / total) * 100 : 0;
      const fechaFormateada = new Date(a.fecha).toLocaleDateString('es-CL');

      return `
        <tr>
          <td>${a.rut}</td>
          <td>${a.nombre}</td>
          <td>${a.curso}</td>
          <td>${fechaFormateada}</td>
          <td>${total}</td>
          <td>${a.asistencias}</td>
          <td>${a.faltas}</td>
          <td>${porcentaje.toFixed(1)}%</td>
        </tr>
      `;
    }).join('');

    // --- TABLA 2: Estadísticas por curso ---
    const cursos = {};
    dataSemana.forEach(a => {
      if (!cursos[a.curso]) cursos[a.curso] = { asistencias: 0, total: 0 };
      cursos[a.curso].asistencias += (a.asistencias ?? 0);
      cursos[a.curso].total += (a.asistencias ?? 0) + (a.faltas ?? 0);
    });

    const tbodyCursos = document.querySelector('#cursos tbody');
    tbodyCursos.innerHTML = Object.entries(cursos).map(([curso, info]) => {
      const porcentaje = info.total > 0 ? (info.asistencias / info.total) * 100 : 0;
      return `
        <tr>
          <td>${curso}</td>
          <td>${porcentaje.toFixed(1)}%</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
});
