/* ==========================================================
   storage.js
   Módulo responsable EXCLUSIVAMENTE de leer y escribir en
   localStorage. Ningún otro archivo debe llamar a
   localStorage directamente: todos pasan por aquí.
   ========================================================== */

const Storage = (() => {
  const STORAGE_KEY = 'misFinanzas.perfil';

  /**
   * Estructura de datos guardada:
   * {
   *   ingresos: { principal: number, adicionales: number },
   *   gastosFijos: [
   *     { id, nombre, monto, compartido, tipoDivision, porcentaje, personas, montoReal }
   *   ],
   *   gastosDiarios: [
   *     { id, concepto, monto, categoria, fecha }
   *   ],
   *   fechaCreacion: string (ISO)
   * }
   */

  function guardar(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      return false;
    }
  }

  function cargar() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error al parsear datos de localStorage:', err);
      return null;
    }
  }

  function existePerfil() {
    const data = cargar();
    return !!(data && data.ingresos);
  }

  function limpiar() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function agregarGastoDiario(gasto) {
    const data = cargar();
    if (!data) return false;
    data.gastosDiarios = data.gastosDiarios || [];
    data.gastosDiarios.push(gasto);
    return guardar(data);
  }

  function eliminarGastoDiario(id) {
    const data = cargar();
    if (!data) return false;
    data.gastosDiarios = (data.gastosDiarios || []).filter(g => g.id !== id);
    return guardar(data);
  }

  return {
    guardar,
    cargar,
    existePerfil,
    limpiar,
    agregarGastoDiario,
    eliminarGastoDiario
  };
})();
