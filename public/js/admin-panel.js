// admin-panel.js - VERSIÓN COMPLETA ACTUALIZADA
document.addEventListener('DOMContentLoaded', () => {
  const formUploadExcel = document.getElementById('uploadExcelForm');
  const modalAdmin = document.getElementById('adminModal');
  const abrirAdminPanel = document.getElementById('abrirAdminPanel');
  const cerrarAdminPanel = document.getElementById('cerrarAdminPanel');

  // Variables globales
  let cursos = [];

  // Abrir/cerrar modal
  if (abrirAdminPanel) abrirAdminPanel.addEventListener('click', () => {
    modalAdmin.style.display = 'block';
    cargarDatosIniciales();
  });
  
  if (cerrarAdminPanel) cerrarAdminPanel.addEventListener('click', () => modalAdmin.style.display = 'none');
  
  window.addEventListener('click', (e) => { 
    if (e.target == modalAdmin) modalAdmin.style.display = 'none'; 
  });

  // Inicializar todo cuando el modal se abre
  function cargarDatosIniciales() {
    cargarCursos();
    configurarTabs();
    configurarEventos();
  }

  // ========== CONFIGURACIÓN BÁSICA ==========

  async function cargarCursos() {
    try {
      const response = await fetch('/admin/cursos');
      cursos = await response.json();
      actualizarSelectsCursos();
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  }

  function actualizarSelectsCursos() {
    // Select de filtro de alumnos
    const selectFiltro = document.getElementById('filtroCursoAlumno');
    if (selectFiltro) {
      selectFiltro.innerHTML = '<option value="todos">Todos los cursos</option>';
      cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.descripcion;
        selectFiltro.appendChild(option);
      });
    }

    // Select de bloqueos
    const selectBloqueo = document.getElementById('bloqueoCurso');
    if (selectBloqueo) {
      selectBloqueo.innerHTML = '<option value="">Seleccionar curso</option>';
      cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.descripcion;
        selectBloqueo.appendChild(option);
      });
    }
  }

  function configurarTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Remover active de todos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Agregar active al seleccionado
        button.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos específicos de la pestaña
        cargarDatosTab(tabId);
      });
    });
  }

  function configurarEventos() {
    // Formulario docente
    document.getElementById('formDocente')?.addEventListener('submit', (e) => {
      e.preventDefault();
      crearDocente();
    });

    // Formulario bloqueo
    document.getElementById('formBloqueo')?.addEventListener('submit', (e) => {
      e.preventDefault();
      crearBloqueo();
    });

    // Tipo de bloqueo
    document.getElementById('bloqueoTipo')?.addEventListener('change', (e) => {
      const tipo = e.target.value;
      document.getElementById('bloqueoDiaSemana').style.display = 
        tipo === 'dia_semana' ? 'block' : 'none';
      document.getElementById('bloqueoFechaEspecifica').style.display = 
        tipo === 'fecha_especifica' ? 'block' : 'none';
    });

    // Filtros alumnos
    document.getElementById('btnFiltrarAlumnos')?.addEventListener('click', () => {
      cargarAlumnos();
    });

    document.getElementById('buscarAlumno')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') cargarAlumnos();
    });

    // Nuevo alumno
    document.getElementById('btnNuevoAlumno')?.addEventListener('click', () => {
      mostrarFormularioAlumno();
    });
  }

  async function cargarDatosTab(tabId) {
    switch(tabId) {
      case 'docentes':
        await cargarDocentes();
        break;
      case 'alumnos':
        await cargarAlumnos();
        break;
      case 'bloqueos':
        await cargarBloqueos();
        break;
    }
  }

  // ========== SUBIDA DE EXCEL (FUNCIÓN EXISTENTE) ==========

  if (formUploadExcel) {
    formUploadExcel.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(formUploadExcel);

      try {
        console.log("📤 Enviando archivo al servidor...");
        const res = await fetch('/admin/uploadExcelMulti', { method: 'POST', body: formData });

        if (!res.ok) {
          console.error("❌ Error HTTP:", res.status, res.statusText);
          alert(`❌ Error HTTP: ${res.status} ${res.statusText}`);
          return;
        }

        const data = await res.json();
        console.log("📄 Respuesta del servidor:", data);

        if (data.success) {
          alert(`✅ ${data.message}\nTotal alumnos procesados: ${data.total || 0}`);
        } else {
          const errores = data.errores ? data.errores.join('\n') : 'No hay detalles';
          alert(`❌ ${data.message}\nErrores:\n${errores}\nTotal procesados: ${data.total || 0}`);
        }

        formUploadExcel.reset();

      } catch (err) {
        console.error("💥 Error al subir archivo:", err);
        alert('❌ Error al subir archivo. Revisa la consola para más detalles.');
      }
    });
  }

  // ========== GESTIÓN DE DOCENTES ==========

  async function cargarDocentes() {
    try {
      mostrarLoadingDocentes(true);
      const response = await fetch('/admin/docentes');
      const data = await response.json();
      
      if (data.success) {
        mostrarDocentes(data.docentes);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error cargando docentes:', error);
      document.getElementById('tbodyDocentes').innerHTML = 
        '<tr><td colspan="5" style="text-align:center; color: red;">Error cargando docentes</td></tr>';
    } finally {
      mostrarLoadingDocentes(false);
    }
  }

  function mostrarDocentes(docentes) {
    const tbody = document.getElementById('tbodyDocentes');
    if (!tbody) return;

    if (docentes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay docentes registrados</td></tr>';
      return;
    }

    tbody.innerHTML = docentes.map(docente => `
      <tr>
        <td>${docente.nombre_usuario}</td>
        <td>${docente.nombre_completo}</td>
        <td>${docente.correo || 'No especificado'}</td>
        <td>
          <span class="${docente.activo ? 'estado-activo' : 'estado-inactivo'}">
            ${docente.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn-admin-small btn-warning" onclick="editarDocente(${docente.id_usuario})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-admin-small btn-danger" onclick="eliminarDocente(${docente.id_usuario})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function crearDocente() {
    const formData = {
      nombre_usuario: document.getElementById('docenteUsuario').value,
      contraseña: document.getElementById('docentePassword').value,
      nombre_completo: document.getElementById('docenteNombre').value,
      correo: document.getElementById('docenteCorreo').value
    };

    // Validación básica
    if (!formData.nombre_usuario || !formData.contraseña || !formData.nombre_completo) {
      alert('❌ Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/admin/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Docente creado exitosamente');
        document.getElementById('formDocente').reset();
        await cargarDocentes();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al crear docente');
      console.error(error);
    }
  }

  async function eliminarDocente(id) {
    if (!confirm('¿Estás seguro de eliminar este docente? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/admin/docentes/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Docente eliminado exitosamente');
        await cargarDocentes();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al eliminar docente');
      console.error(error);
    }
  }

  function editarDocente(id) {
    alert(`Funcionalidad de edición para docente ID: ${id} - Por implementar`);
    // Aquí puedes implementar un modal de edición similar al de creación
  }

  function mostrarLoadingDocentes(mostrar) {
    const tbody = document.getElementById('tbodyDocentes');
    if (!tbody) return;
    
    if (mostrar) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando docentes...</td></tr>';
    }
  }

  // ========== GESTIÓN DE ALUMNOS ==========

  async function cargarAlumnos() {
    const params = new URLSearchParams({
      curso: document.getElementById('filtroCursoAlumno').value,
      nivel: document.getElementById('filtroNivelAlumno').value,
      buscar: document.getElementById('buscarAlumno').value
    });

    try {
      mostrarLoadingAlumnos(true);
      const response = await fetch(`/admin/alumnos?${params}`);
      const data = await response.json();
      
      if (data.success) {
        mostrarAlumnos(data.alumnos);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      document.getElementById('tbodyAlumnos').innerHTML = 
        '<tr><td colspan="5" style="text-align:center; color: red;">Error cargando alumnos</td></tr>';
    } finally {
      mostrarLoadingAlumnos(false);
    }
  }

  function mostrarAlumnos(alumnos) {
    const tbody = document.getElementById('tbodyAlumnos');
    if (!tbody) return;

    if (alumnos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron alumnos</td></tr>';
      return;
    }

    tbody.innerHTML = alumnos.map(alumno => `
      <tr>
        <td>${alumno.run || 'N/A'}</td>
        <td>${alumno.nombres || ''} ${alumno.apellido_paterno || ''} ${alumno.apellido_materno || ''}</td>
        <td>${alumno.curso || 'N/A'}</td>
        <td>
          <span class="${alumno.activo ? 'estado-activo' : 'estado-inactivo'}">
            ${alumno.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <button class="btn-admin-small btn-warning" onclick="editarAlumno(${alumno.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-admin-small btn-danger" onclick="eliminarAlumno(${alumno.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function mostrarFormularioAlumno() {
    alert('Funcionalidad para crear nuevo alumno - Por implementar');
    // Puedes implementar un modal similar al de docentes
  }

  async function eliminarAlumno(id) {
    if (!confirm('¿Estás seguro de eliminar este alumno? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`/admin/alumnos/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Alumno eliminado exitosamente');
        await cargarAlumnos();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al eliminar alumno');
      console.error(error);
    }
  }

  function editarAlumno(id) {
    alert(`Funcionalidad de edición para alumno ID: ${id} - Por implementar`);
  }

  function mostrarLoadingAlumnos(mostrar) {
    const tbody = document.getElementById('tbodyAlumnos');
    if (!tbody) return;
    
    if (mostrar) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Buscando alumnos...</td></tr>';
    }
  }

  // ========== GESTIÓN DE BLOQUEOS ==========

  async function cargarBloqueos() {
    try {
      mostrarLoadingBloqueos(true);
      const response = await fetch('/admin/bloqueos');
      const data = await response.json();
      
      if (data.success) {
        mostrarBloqueos(data.bloqueos);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error cargando bloqueos:', error);
      document.getElementById('tbodyBloqueos').innerHTML = 
        '<tr><td colspan="5" style="text-align:center; color: red;">Error cargando bloqueos</td></tr>';
    } finally {
      mostrarLoadingBloqueos(false);
    }
  }

  function mostrarBloqueos(bloqueos) {
    const tbody = document.getElementById('tbodyBloqueos');
    if (!tbody) return;

    if (bloqueos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay bloqueos activos</td></tr>';
      return;
    }

    tbody.innerHTML = bloqueos.map(bloqueo => {
      const tipo = bloqueo.fecha_especifica ? 'Fecha específica' : 'Día de semana';
      const valor = bloqueo.fecha_especifica 
        ? new Date(bloqueo.fecha_especifica).toLocaleDateString('es-CL')
        : obtenerNombreDia(bloqueo.dia_semana);
      
      return `
        <tr>
          <td>${bloqueo.curso_nombre || 'N/A'}</td>
          <td>${tipo}</td>
          <td>${valor}</td>
          <td>${bloqueo.motivo || 'Sin motivo'}</td>
          <td>
            <button class="btn-admin-small btn-danger" onclick="eliminarBloqueo(${bloqueo.id})">
              <i class="fas fa-times"></i> Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function obtenerNombreDia(diaSemana) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[diaSemana] || 'Desconocido';
  }

  async function crearBloqueo() {
    const tipo = document.getElementById('bloqueoTipo').value;
    const formData = {
      curso_id: document.getElementById('bloqueoCurso').value,
      motivo: document.getElementById('bloqueoMotivo').value
    };

    // Validación
    if (!formData.curso_id) {
      alert('❌ Por favor selecciona un curso');
      return;
    }

    if (tipo === 'dia_semana') {
      formData.dia_semana = document.getElementById('bloqueoDiaSemana').value;
    } else {
      formData.fecha_especifica = document.getElementById('bloqueoFechaEspecifica').value;
      if (!formData.fecha_especifica) {
        alert('❌ Por favor selecciona una fecha');
        return;
      }
    }

    try {
      const response = await fetch('/admin/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Bloqueo creado exitosamente');
        document.getElementById('formBloqueo').reset();
        await cargarBloqueos();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al crear bloqueo');
      console.error(error);
    }
  }

  async function eliminarBloqueo(id) {
    if (!confirm('¿Estás seguro de eliminar este bloqueo?')) return;

    try {
      const response = await fetch(`/admin/bloqueos/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Bloqueo eliminado exitosamente');
        await cargarBloqueos();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al eliminar bloqueo');
      console.error(error);
    }
  }

  function mostrarLoadingBloqueos(mostrar) {
    const tbody = document.getElementById('tbodyBloqueos');
    if (!tbody) return;
    
    if (mostrar) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando bloqueos...</td></tr>';
    }
  }

  // ========== FUNCIONES GLOBALES PARA HTML ==========

  // Hacer funciones disponibles globalmente para los onclick en HTML
  window.editarDocente = editarDocente;
  window.eliminarDocente = eliminarDocente;
  window.editarAlumno = editarAlumno;
  window.eliminarAlumno = eliminarAlumno;
  window.eliminarBloqueo = eliminarBloqueo;

  console.log('✅ Admin Panel cargado completamente');
});