/* ==========================================================
   wizard.js
   Lógica del formulario de Caracterización Inicial:
   - Navegación por pasos
   - Filas dinámicas de gastos fijos (con lógica de compartido)
   - Cálculo del valor real a pagar por cada gasto fijo
   - Resumen de confirmación
   - Guardado final en localStorage vía Storage
   ========================================================== */

const Wizard = (() => {

  let gastosFijos = []; // [{id, nombre, monto, compartido, tipoDivision, porcentaje, personas, montoReal}]
  let contadorId = 0;

  function nuevoId() {
    contadorId += 1;
    return 'gf-' + Date.now() + '-' + contadorId;
  }

  function formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  /* ---------------- Navegación entre pasos ---------------- */

  function irAPaso(numero) {
    document.querySelectorAll('.wizard-panel').forEach(panel => {
      panel.classList.toggle('d-none', panel.dataset.panel !== String(numero));
    });
    document.querySelectorAll('.step-item').forEach(item => {
      const paso = Number(item.dataset.step);
      item.classList.toggle('active', paso === numero);
      item.classList.toggle('done', paso < numero);
    });
    if (numero === 3) {
      renderizarResumen();
    }
  }

  function validarPaso1() {
    const input = document.getElementById('ingreso-principal');
    const valor = Number(input.value);
    if (!valor || valor <= 0) {
      input.classList.add('is-invalid');
      return false;
    }
    input.classList.remove('is-invalid');
    return true;
  }

  function validarPaso2() {
    // Cada fila de gasto fijo debe tener nombre y monto válidos.
    let valido = true;
    document.querySelectorAll('.gasto-fijo-item').forEach(item => {
      const nombre = item.querySelector('.gf-nombre');
      const monto = item.querySelector('.gf-monto');
      if (!nombre.value.trim()) { nombre.classList.add('is-invalid'); valido = false; }
      else nombre.classList.remove('is-invalid');
      if (!monto.value || Number(monto.value) <= 0) { monto.classList.add('is-invalid'); valido = false; }
      else monto.classList.remove('is-invalid');
    });
    return valido;
  }

  /* ---------------- Filas dinámicas de gastos fijos ---------------- */

  function actualizarVacioGastosFijos() {
    const empty = document.getElementById('gastos-fijos-empty');
    const lista = document.getElementById('lista-gastos-fijos');
    empty.classList.toggle('d-none', lista.children.length > 0);
  }

  function calcularValorReal(monto, compartido, tipoDivision, porcentaje, personas) {
    const m = Number(monto) || 0;
    if (!compartido) return m;
    if (tipoDivision === 'porcentaje') {
      const p = Number(porcentaje) || 0;
      return m * (p / 100);
    }
    // división por número de personas
    const n = Number(personas) || 1;
    return m / n;
  }

  function agregarFilaGastoFijo() {
    const tpl = document.getElementById('tpl-gasto-fijo');
    const clone = tpl.content.cloneNode(true);
    const item = clone.querySelector('.gasto-fijo-item');
    const id = nuevoId();
    item.dataset.id = id;

    const elNombre = item.querySelector('.gf-nombre');
    const elMonto = item.querySelector('.gf-monto');
    const elCompartido = item.querySelector('.gf-compartido');
    const elOpciones = item.querySelector('.gf-compartido-opciones');
    const elTipoDivision = item.querySelector('.gf-tipo-division');
    const elCampoPorcentaje = item.querySelector('.gf-campo-porcentaje');
    const elCampoPersonas = item.querySelector('.gf-campo-personas');
    const elPorcentaje = item.querySelector('.gf-porcentaje');
    const elPersonas = item.querySelector('.gf-personas');
    const elValorReal = item.querySelector('.gf-valor-real-monto');
    const elEliminar = item.querySelector('.gf-eliminar');

    function sync() {
      const nombre = elNombre.value.trim();
      const monto = elMonto.value;
      const compartido = elCompartido.checked;
      const tipoDivision = elTipoDivision.value;
      const porcentaje = elPorcentaje.value;
      const personas = elPersonas.value;
      const montoReal = calcularValorReal(monto, compartido, tipoDivision, porcentaje, personas);

      elValorReal.textContent = formatoMoneda(montoReal);

      const idx = gastosFijos.findIndex(g => g.id === id);
      const datos = { id, nombre, monto: Number(monto) || 0, compartido, tipoDivision, porcentaje: Number(porcentaje) || 0, personas: Number(personas) || 1, montoReal };
      if (idx >= 0) gastosFijos[idx] = datos;
      else gastosFijos.push(datos);
    }

    elCompartido.addEventListener('change', () => {
      elOpciones.classList.toggle('d-none', !elCompartido.checked);
      sync();
    });

    elTipoDivision.addEventListener('change', () => {
      const esPorcentaje = elTipoDivision.value === 'porcentaje';
      elCampoPorcentaje.classList.toggle('d-none', !esPorcentaje);
      elCampoPersonas.classList.toggle('d-none', esPorcentaje);
      sync();
    });

    [elNombre, elMonto, elPorcentaje, elPersonas].forEach(el => {
      el.addEventListener('input', sync);
    });

    elEliminar.addEventListener('click', () => {
      gastosFijos = gastosFijos.filter(g => g.id !== id);
      item.remove();
      actualizarVacioGastosFijos();
    });

    document.getElementById('lista-gastos-fijos').appendChild(clone);
    sync();
    actualizarVacioGastosFijos();
  }

  /* ---------------- Resumen de confirmación ---------------- */

  function renderizarResumen() {
    const principal = Number(document.getElementById('ingreso-principal').value) || 0;
    const adicionales = Number(document.getElementById('ingresos-adicionales').value) || 0;
    const totalIngresos = principal + adicionales;
    const totalGastosFijosReal = gastosFijos.reduce((acc, g) => acc + g.montoReal, 0);
    const saldoBase = totalIngresos - totalGastosFijosReal;

    const cont = document.getElementById('resumen-wizard');
    cont.innerHTML = '';

    const filas = [
      { label: 'Ingreso principal', valor: principal },
      { label: 'Ingresos adicionales', valor: adicionales },
      { label: `Gastos fijos (${gastosFijos.length} registrados, valor real)`, valor: totalGastosFijosReal }
    ];

    filas.forEach(f => {
      const div = document.createElement('div');
      div.className = 'resumen-linea';
      div.innerHTML = `<span class="label">${f.label}</span><span class="valor">${formatoMoneda(f.valor)}</span>`;
      cont.appendChild(div);
    });

    if (gastosFijos.length > 0) {
      const detalle = document.createElement('div');
      detalle.className = 'resumen-sub';
      detalle.innerHTML = gastosFijos.map(g => {
        const etiqueta = g.compartido
          ? (g.tipoDivision === 'porcentaje' ? ` · compartido (${g.porcentaje}% tuyo)` : ` · compartido entre ${g.personas}`)
          : '';
        return `${g.nombre || 'Sin nombre'}: ${formatoMoneda(g.montoReal)}${etiqueta}`;
      }).join('<br>');
      cont.appendChild(detalle);
    }

    const total = document.createElement('div');
    total.className = 'resumen-linea total';
    total.innerHTML = `<span class="label">Saldo disponible base (Ahorro estimado)</span><span class="valor">${formatoMoneda(saldoBase)}</span>`;
    cont.appendChild(total);
  }

  /* ---------------- Guardado final ---------------- */

  function guardarConfiguracion() {
    const principal = Number(document.getElementById('ingreso-principal').value) || 0;
    const adicionales = Number(document.getElementById('ingresos-adicionales').value) || 0;

    const data = {
      ingresos: { principal, adicionales },
      gastosFijos: gastosFijos,
      gastosDiarios: [],
      fechaCreacion: new Date().toISOString()
    };

    return Storage.guardar(data);
  }

  function resetearEstado() {
    gastosFijos = [];
    contadorId = 0;
    document.getElementById('lista-gastos-fijos').innerHTML = '';
    document.getElementById('form-wizard').reset();
    actualizarVacioGastosFijos();
    irAPaso(1);
  }

  /* ---------------- Inicialización de eventos ---------------- */

  function init() {
    document.querySelectorAll('.btn-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const actual = btn.closest('.wizard-panel').dataset.panel;
        if (actual === '1' && !validarPaso1()) return;
        if (actual === '2' && !validarPaso2()) return;
        irAPaso(Number(btn.dataset.next));
      });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
      btn.addEventListener('click', () => irAPaso(Number(btn.dataset.prev)));
    });

    document.getElementById('btn-agregar-gasto-fijo').addEventListener('click', agregarFilaGastoFijo);

    document.getElementById('form-wizard').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validarPaso1() || !validarPaso2()) return;
      const ok = guardarConfiguracion();
      if (ok) {
        App.mostrarToast('Configuración guardada. ¡Bienvenido a tu panel!');
        App.irADashboard();
      } else {
        App.mostrarToast('No se pudo guardar la configuración.', true);
      }
    });

    // Al menos una fila de gasto fijo visible por defecto para orientar al usuario.
    agregarFilaGastoFijo();
    actualizarVacioGastosFijos();
    irAPaso(1);
  }

  return { init, resetearEstado, irAPaso };
})();
