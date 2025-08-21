// facturazion/modelo/BillingModelo.js
const pool = require('../../modelo/bd/Conexion.js');

const BillingModelo = {
  // Planes y cursos
  obtenerPlanesActivosConCursos: async () => {
    const sql = `
      SELECT p.idPlan, p.nombre AS plan_nombre, p.descripcion, p.beneficios, p.precio, p.estado,
             c.idCurso, c.nombreCurso AS curso_nombre, c.descripcion AS curso_descripcion, c.duracion
      FROM planes p
      LEFT JOIN planes_cursos pc ON pc.idPlan = p.idPlan
      LEFT JOIN cursos c ON c.idCurso = pc.idCurso
      WHERE p.estado = 'activo'
      ORDER BY p.precio ASC, p.idPlan ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  // Pagos (simulados)
  crearPago: async ({ clienteId, planId, metodo, referencia, monto, moneda = 'COP', estado = 'pagado' }) => {
    const sql = `
      INSERT INTO pagos (cliente_id, plan_id, metodo, referencia, monto, moneda, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [clienteId, planId, metodo, referencia || null, monto, moneda, estado]);
    return result;
  },

  actualizarPlanActualDeCliente: async (clienteId, planId) => {
    try {
      const sql = 'UPDATE clientes SET plan_id_actual = ? WHERE id = ?';
      await pool.execute(sql, [planId, clienteId]);
    } catch (e) {
      // Si la columna no existe aún, ignorar para no romper el flujo de compra
      if (e && (e.code === 'ER_BAD_FIELD_ERROR' || (e.errno === 1054))) {
        return;
      }
      throw e;
    }
  },

  obtenerPagoPorId: async (idPago) => {
    const [rows] = await pool.execute('SELECT * FROM pagos WHERE idPago = ?', [idPago]);
    return rows[0];
  },

  obtenerPagosPorCliente: async (clienteId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM pagos WHERE cliente_id = ? ORDER BY fecha_pago DESC, idPago DESC',
      [clienteId]
    );
    return rows;
  },

  // Facturas
  obtenerFacturasPorCliente: async (clienteId) => {
    const [rows] = await pool.execute(
      'SELECT * FROM facturas WHERE cliente_id = ? ORDER BY fecha DESC, idFactura DESC',
      [clienteId]
    );
    return rows;
  },

  obtenerFacturaConDetalle: async (idFactura, clienteId) => {
    const sql = `
      SELECT 
        f.idFactura, f.fecha, f.periodo, f.total, f.estado, f.cliente_id,
        d.idDetalle, d.plan_id, d.descripcion, d.cantidad, d.precio_unitario, d.subtotal,
        p.nombre AS plan_nombre
      FROM facturas f
      JOIN detalles_factura d ON d.idFactura = f.idFactura
      JOIN planes p ON p.idPlan = d.plan_id
      WHERE f.idFactura = ? AND f.cliente_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [idFactura, clienteId]);
    return rows[0];
  }
};

module.exports = BillingModelo;


