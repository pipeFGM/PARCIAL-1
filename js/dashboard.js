/* ==========================================================
   dashboard.js
   Lógica del Dashboard Financiero:
   - Cálculo y pintado de las tarjetas de resumen
   - Registro de gastos diarios (formulario rápido)
   - Listado dinámico de gastos con eliminación individual
   ========================================================== */

const Dashboard = (() => {

  function formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  function formatoFecha(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /* ---------------- Cálculos ---------------- */

  function calcularTotales(data) {
    const totalIngresos = (data.ingresos.principal || 0) + (data.ingresos.adicionales || 0);
    const totalGastosFijos = (data.gastosFijos || []).reduce((acc, g) => acc + g.montoReal, 0);
    const balance = totalIngresos - totalGastosFijos;
    const totalVariables = (data.gastosDiarios || []).reduce((acc, g) => acc + Number(g.monto), 0);
    return { totalIngresos, totalGastosFijos, balance, totalVariables };
  }

  /* ---------------- Render ---------------- */

  function renderResumen() {
    const data = Storage.cargar();
    if (!data) return;
    const { totalIngresos, totalGastosFijos, balance, totalVariables } = calcularTotales(data);

    document.getElementById('valor-ingresos-totales').textContent = formatoMoneda(totalIngresos);
    document.getElementById('valor-gastos-fijos').textContent = formatoMoneda(totalGastosFijos);
    document.getElementById('valor-gastos-variables').textContent = formatoMoneda(totalVariables);

    const balanceReal = balance - totalVariables;
    const elBalance = document.getElementById('valor-balance');
    elBalance.textContent = formatoMoneda(balanceReal);
    elBalance.classList.toggle('negativo', balanceReal < 0);

    renderConfigLateral(data, totalIngresos, totalGastosFijos);
  }

  function renderConfigLateral(data, totalIngresos, totalGastosFijos) {
    const cont = document.getElementById('resumen-config-fijos');
    cont.innerHTML = '';

    const liIngreso = document.createElement('li');
    liIngreso.innerHTML = `<span class="lc-nombre">Ingresos declarados</span><span class="lc-monto">${formatoMoneda(totalIngresos)}</span>`;
    cont.appendChild(liIngreso);

    (data.gastosFijos || []).forEach(g => {
      const li = document.createElement('li');
      const etiqueta = g.compartido ? ' (compartido)' : '';
      li.innerHTML = `<span class="lc-nombre">${g.nombre}${etiqueta}</span><span class="lc-monto">${formatoMoneda(g.montoReal)}</span>`;
      cont.appendChild(li);
    });

    if (!data.gastosFijos || data.gastosFijos.length === 0) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="lc-nombre">Sin gastos fijos registrados</span>`;
      cont.appendChild(li);
    }
  }

  function renderTablaGastos() {
    const data = Storage.cargar();
    const tbody = document.getElementById('tabla-gastos-diarios');
    const emptyMsg = document.getElementById('tabla-gastos-empty');
    tbody.innerHTML = '';

    const gastos = (data && data.gastosDiarios) ? [...data.gastosDiarios].reverse() : [];

    emptyMsg.classList.toggle('d-none', gastos.length > 0);

    gastos.forEach(g => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatoFecha(g.fecha)}</td>
        <td>${escaparHTML(g.concepto)}</td>
        <td><span class="badge-categoria badge-${g.categoria}">${g.categoria}</span></td>
        <td class="text-end fw-semibold">${formatoMoneda(g.monto)}</td>
        <td class="text-center">
          <button type="button" class="btn-eliminar-gasto" data-id="${g.id}" title="Eliminar gasto">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-eliminar-gasto').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.eliminarGastoDiario(btn.dataset.id);
        renderTodo();
        App.mostrarToast('Gasto eliminado.');
      });
    });
  }

  function escaparHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderTodo() {
    renderResumen();
    renderTablaGastos();
  }

  /* ---------------- Registro de gasto diario ---------------- */

  function agregarGasto(e) {
    e.preventDefault();
    const concepto = document.getElementById('gd-concepto').value.trim();
    const monto = Number(document.getElementById('gd-monto').value);
    const categoria = document.getElementById('gd-categoria').value;

    if (!concepto || !monto || monto <= 0) {
      App.mostrarToast('Completa concepto y un monto válido.', true);
      return;
    }

    const gasto = {
      id: 'gd-' + Date.now(),
      concepto,
      monto,
      categoria,
      fecha: new Date().toISOString()
    };

    Storage.agregarGastoDiario(gasto);
    document.getElementById('form-gasto-diario').reset();
    renderTodo();
    App.mostrarToast('Gasto agregado correctamente.');
  }

  function init() {
    document.getElementById('form-gasto-diario').addEventListener('submit', agregarGasto);
    renderTodo();
  }

  return { init, renderTodo };
})();
