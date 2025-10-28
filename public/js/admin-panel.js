// admin-panel.js
document.addEventListener('DOMContentLoaded', () => {
  const formUploadExcel = document.getElementById('uploadExcelForm');
  const modalAdmin = document.getElementById('adminModal');
  const abrirAdminPanel = document.getElementById('abrirAdminPanel');
  const cerrarAdminPanel = document.getElementById('cerrarAdminPanel');

  // Abrir/cerrar modal
  if (abrirAdminPanel) abrirAdminPanel.addEventListener('click', () => modalAdmin.style.display = 'block');
  if (cerrarAdminPanel) cerrarAdminPanel.addEventListener('click', () => modalAdmin.style.display = 'none');
  window.addEventListener('click', (e) => { if (e.target == modalAdmin) modalAdmin.style.display = 'none'; });

  if (!formUploadExcel) return;

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
        alert(`✅ ${data.message}\nTotal alumnos insertados: ${data.total || 0}`);
      } else {
        const errores = data.errores ? data.errores.join('\n') : 'No hay detalles';
        alert(`❌ ${data.message}\nErrores:\n${errores}\nTotal insertados: ${data.total || 0}`);
      }

      formUploadExcel.reset();
      modalAdmin.style.display = 'none';

    } catch (err) {
      console.error("💥 Error al subir archivo:", err);
      alert('❌ Error al subir archivo. Revisa la consola para más detalles.');
    }
  });
});
