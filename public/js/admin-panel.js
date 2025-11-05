// admin-panel.js - VERSIÓN COMPLETA CON FUNCIONALIDADES DE EDICIÓN
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Admin Panel iniciando...');
  
  const formUploadExcel = document.getElementById('uploadExcelForm');
  const modalAdmin = document.getElementById('adminModal');
  const abrirAdminPanel = document.getElementById('abrirAdminPanel');
  const cerrarAdminPanel = document.getElementById('cerrarAdminPanel');

  // Variables globales
  let cursos = [];
  let alumnoEditando = null;
  let docenteEditando = null;

  // Abrir/cerrar modal
  if (abrirAdminPanel) {
    abrirAdminPanel.addEventListener('click', function() {
      console.log('📂 Abriendo Panel Admin...');
      modalAdmin.style.display = 'block';
      cargarDatosIniciales();
    });
  }
  
  if (cerrarAdminPanel) {
    cerrarAdminPanel.addEventListener('click', function() {
      modalAdmin.style.display = 'none';
      limpiarFormularios();
    });
  }
  
  window.addEventListener('click', function(e) { 
    if (e.target == modalAdmin) {
      modalAdmin.style.display = 'none'; 
      limpiarFormularios();
    }
  });

  function limpiarFormularios() {
    alumnoEditando = null;
    docenteEditando = null;
    document.getElementById('formDocente').reset();
    document.getElementById('formAlumno').reset();
    document.getElementById('btnSubmitAlumno').textContent = 'Agregar Alumno';
    document.getElementById('tituloFormAlumno').textContent = 'Agregar Nuevo Alumno';
    document.getElementById('btnCancelarDocente').style.display = 'none';
    document.getElementById('tituloFormDocente').textContent = 'Agregar Nuevo Docente';
  }

  // Inicializar todo cuando el modal se abre
  function cargarDatosIniciales() {
    console.log('🔄 Cargando datos iniciales...');
    cargarCursos();
    configurarTabs();
    configurarEventos();
  }

  // ========== CONFIGURACIÓN BÁSICA ==========

  async function cargarCursos() {
    try {
      console.log('📚 Cargando cursos...');
      const response = await fetch('/admin/cursos');
      cursos = await response.json();
      console.log(`✅ Cursos cargados: ${cursos.length}`);
      actualizarSelectsCursos();
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  }

  // ✅ ACTUALIZAR SELECTS DE CURSOS
  function actualizarSelectsCursos() {
    console.log('🔄 Actualizando selects de cursos...');
    
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
      console.log(`✅ Select de cursos actualizado: ${cursos.length} cursos`);
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

    // Select de curso para formulario alumno
    const selectCursoAlumno = document.getElementById('alumnoCurso');
    if (selectCursoAlumno) {
      selectCursoAlumno.innerHTML = '<option value="">Seleccionar curso</option>';
      cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.descripcion;
        selectCursoAlumno.appendChild(option);
      });
    }
  }

  function configurarTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Remover active de todos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Agregar active al seleccionado
        this.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Cargar datos específicos de la pestaña
        cargarDatosTab(tabId);
      });
    });
  }

  function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    // Formulario docente
    document.getElementById('formDocente').addEventListener('submit', (e) => {
      e.preventDefault();
      if (docenteEditando) {
        actualizarDocente();
      } else {
        crearDocente();
      }
    });

    // Formulario alumno
    document.getElementById('formAlumno').addEventListener('submit', (e) => {
      e.preventDefault();
      if (alumnoEditando) {
        actualizarAlumno();
      } else {
        crearAlumno();
      }
    });

    // Formulario bloqueo
    document.getElementById('formBloqueo').addEventListener('submit', (e) => {
      e.preventDefault();
      crearBloqueo();
    });

    // Cancelar edición docente
    document.getElementById('btnCancelarDocente').addEventListener('click', function() {
      limpiarFormularioDocente();
    });

    // Tipo de bloqueo
    document.getElementById('bloqueoTipo').addEventListener('change', (e) => {
      const tipo = e.target.value;
      document.getElementById('bloqueoDiaSemana').style.display = 
        tipo === 'dia_semana' ? 'block' : 'none';
      document.getElementById('bloqueoFechaEspecifica').style.display = 
        tipo === 'fecha_especifica' ? 'block' : 'none';
    });

    // ✅ EVENTO SIMPLE PARA FILTRO DE CURSO
    const filtroCurso = document.getElementById('filtroCursoAlumno');
    if (filtroCurso) {
      filtroCurso.addEventListener('change', function() {
        console.log('🎓 Filtro de curso cambiado:', this.value);
        cargarAlumnos();
      });
    }

    // Botón filtrar
    const btnFiltrarAlumnos = document.getElementById('btnFiltrarAlumnos');
    if (btnFiltrarAlumnos) {
      btnFiltrarAlumnos.addEventListener('click', function() {
        cargarAlumnos();
      });
    }

    // Buscar con Enter
    const buscarAlumno = document.getElementById('buscarAlumno');
    if (buscarAlumno) {
      buscarAlumno.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') cargarAlumnos();
      });
    }

    // Nuevo alumno
    const btnNuevoAlumno = document.getElementById('btnNuevoAlumno');
    if (btnNuevoAlumno) {
      btnNuevoAlumno.addEventListener('click', function() {
        mostrarFormularioAlumno();
      });
    }

    // Cancelar edición alumno
    const btnCancelarAlumno = document.getElementById('btnCancelarAlumno');
    if (btnCancelarAlumno) {
      btnCancelarAlumno.addEventListener('click', function() {
        cerrarModalAlumno();
      });
    }
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

  // ========== SUBIDA DE EXCEL ==========

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

  async function actualizarDocente() {
    if (!docenteEditando) return;

    const formData = {
      nombre_usuario: document.getElementById('docenteUsuario').value,
      nombre_completo: document.getElementById('docenteNombre').value,
      correo: document.getElementById('docenteCorreo').value,
      activo: document.getElementById('docenteActivo').checked ? 1 : 0
    };

    const contraseña = document.getElementById('docentePassword').value;
    if (contraseña) {
      formData.contraseña = contraseña;
    }

    try {
      const response = await fetch(`/admin/docentes/${docenteEditando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Docente actualizado exitosamente');
        document.getElementById('formDocente').reset();
        docenteEditando = null;
        document.getElementById('btnCancelarDocente').style.display = 'none';
        document.getElementById('tituloFormDocente').textContent = 'Agregar Nuevo Docente';
        await cargarDocentes();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al actualizar docente');
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
    // Buscar docente por ID
    fetch(`/admin/docentes`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const docente = data.docentes.find(d => d.id_usuario == id);
          if (docente) {
            docenteEditando = id;
            document.getElementById('docenteUsuario').value = docente.nombre_usuario;
            document.getElementById('docenteNombre').value = docente.nombre_completo;
            document.getElementById('docenteCorreo').value = docente.correo || '';
            document.getElementById('docenteActivo').checked = docente.activo;
            document.getElementById('docentePassword').required = false;
            document.getElementById('btnCancelarDocente').style.display = 'inline-block';
            document.getElementById('tituloFormDocente').textContent = 'Editar Docente';
            
            // Cambiar a pestaña de docentes
            document.querySelector('[data-tab="docentes"]').click();
          }
        }
      })
      .catch(error => {
        console.error('Error cargando docente:', error);
        alert('Error al cargar datos del docente');
      });
  }

  function limpiarFormularioDocente() {
    docenteEditando = null;
    document.getElementById('formDocente').reset();
    document.getElementById('docentePassword').required = true;
    document.getElementById('btnCancelarDocente').style.display = 'none';
    document.getElementById('tituloFormDocente').textContent = 'Agregar Nuevo Docente';
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
    console.log('🎯 Cargando alumnos...');
    
    const filtroCurso = document.getElementById('filtroCursoAlumno').value;
    const buscar = document.getElementById('buscarAlumno').value;

    console.log(`🔍 Filtros: curso=${filtroCurso}, buscar=${buscar}`);

    const params = new URLSearchParams();
    
    if (filtroCurso && filtroCurso !== 'todos') {
        params.append('curso', filtroCurso);
    }
    
    if (buscar) {
        params.append('buscar', buscar);
    }

    try {
        mostrarLoadingAlumnos(true);
        const response = await fetch(`/admin/alumnos?${params}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Alumnos cargados: ${data.alumnos.length}`);
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
    // Mostrar modal de alumno
    document.getElementById('modalAlumno').style.display = 'block';
    limpiarFormularioAlumno();
  }

  function limpiarFormularioAlumno() {
    alumnoEditando = null;
    document.getElementById('formAlumno').reset();
    document.getElementById('btnSubmitAlumno').textContent = 'Agregar Alumno';
    document.getElementById('tituloFormAlumno').textContent = 'Agregar Nuevo Alumno';
    document.getElementById('alumnoActivo').checked = true;
  }

  async function crearAlumno() {
    const formData = {
      run: document.getElementById('alumnoRun').value,
      nombres: document.getElementById('alumnoNombres').value,
      apellido_paterno: document.getElementById('alumnoApellidoPaterno').value,
      apellido_materno: document.getElementById('alumnoApellidoMaterno').value,
      curso_id: document.getElementById('alumnoCurso').value
    };

    // Validación básica
    if (!formData.run || !formData.nombres || !formData.curso_id) {
      alert('❌ Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/admin/alumnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Alumno creado exitosamente');
        document.getElementById('modalAlumno').style.display = 'none';
        await cargarAlumnos();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al crear alumno');
      console.error(error);
    }
  }

  async function actualizarAlumno() {
    if (!alumnoEditando) return;

    const formData = {
      run: document.getElementById('alumnoRun').value,
      nombres: document.getElementById('alumnoNombres').value,
      apellido_paterno: document.getElementById('alumnoApellidoPaterno').value,
      apellido_materno: document.getElementById('alumnoApellidoMaterno').value,
      curso_id: document.getElementById('alumnoCurso').value,
      activo: document.getElementById('alumnoActivo').checked ? 1 : 0
    };

    try {
      const response = await fetch(`/admin/alumnos/${alumnoEditando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Alumno actualizado exitosamente');
        document.getElementById('modalAlumno').style.display = 'none';
        await cargarAlumnos();
      } else {
        alert('❌ Error: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error al actualizar alumno');
      console.error(error);
    }
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
    // Buscar alumno por ID
    fetch(`/admin/alumnos`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const alumno = data.alumnos.find(a => a.id == id);
          if (alumno) {
            alumnoEditando = id;
            document.getElementById('alumnoRun').value = alumno.run || '';
            document.getElementById('alumnoNombres').value = alumno.nombres || '';
            document.getElementById('alumnoApellidoPaterno').value = alumno.apellido_paterno || '';
            document.getElementById('alumnoApellidoMaterno').value = alumno.apellido_materno || '';
            document.getElementById('alumnoCurso').value = alumno.curso_id || '';
            document.getElementById('alumnoActivo').checked = alumno.activo;
            
            document.getElementById('btnSubmitAlumno').textContent = 'Actualizar Alumno';
            document.getElementById('tituloFormAlumno').textContent = 'Editar Alumno';
            
            // Mostrar modal
            document.getElementById('modalAlumno').style.display = 'block';
          }
        }
      })
      .catch(error => {
        console.error('Error cargando alumno:', error);
        alert('Error al cargar datos del alumno');
      });
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
      formData.fecha_especifica = null;
    } else {
      formData.fecha_especifica = document.getElementById('bloqueoFechaEspecifica').value;
      formData.dia_semana = null;
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

  // Cerrar modal alumno
  window.cerrarModalAlumno = function() {
    document.getElementById('modalAlumno').style.display = 'none';
    limpiarFormularioAlumno();
  };

  // Cerrar modal al hacer click fuera
  window.onclick = function(event) {
    const modalAlumno = document.getElementById('modalAlumno');
    if (event.target == modalAlumno) {
      modalAlumno.style.display = 'none';
      limpiarFormularioAlumno();
    }
  };

  console.log('✅ Admin Panel cargado completamente con funciones de edición');
});