/* ==========================================================
   app.js
   Punto de entrada de la aplicación. Controla el flujo:
   - Al cargar el DOM, decide si mostrar el Wizard o el Dashboard
     según exista o no un perfil en localStorage.
   - Expone utilidades compartidas (toast) y el cambio de vista.
   - Maneja el botón de Reset / Reconfigurar.
   ========================================================== */

const App = (() => {

  function mostrarVista(vista) {
    document.getElementById('vista-wizard').classList.toggle('d-none', vista !== 'wizard');
    document.getElementById('vista-dashboard').classList.toggle('d-none', vista !== 'dashboard');
  }

  function irADashboard() {
    mostrarVista('dashboard');
    Dashboard.init();
  }

  function irAWizard() {
    mostrarVista('wizard');
    Wizard.resetearEstado();
  }

  function mostrarToast(mensaje, esError = false) {
    const toastEl = document.getElementById('toast-app');
    const body = document.getElementById('toast-app-body');
    body.textContent = mensaje;
    toastEl.classList.toggle('text-bg-danger', esError);
    toastEl.classList.toggle('text-bg-success', !esError);
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2800 });
    toast.show();
  }

  function initReset() {
    document.getElementById('btn-reset').addEventListener('click', () => {
      const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalReset'));
      modal.show();
    });

    document.getElementById('btn-confirmar-reset').addEventListener('click', () => {
      Storage.limpiar();
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalReset'));
      modal.hide();
      irAWizard();
      mostrarToast('Se reconfiguró la aplicación. Empecemos de nuevo.');
    });
  }

  /* ---------------- Flujo de control principal ---------------- */

  function init() {
    Wizard.init();
    initReset();

    // Control de flujo: si hay perfil guardado, abrir directo en el Dashboard.
    if (Storage.existePerfil()) {
      irADashboard();
    } else {
      mostrarVista('wizard');
    }
  }

  return { init, irADashboard, irAWizard, mostrarToast };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
