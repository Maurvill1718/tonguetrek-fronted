// controlador/Billing/BillingControlador.js
const BillingModelo = require('../../modelo/BillingModelo.js');

class BillingControlador {
  static async listarPlanes(req, res) {
    try {
      const rows = await BillingModelo.obtenerPlanesActivosConCursos();
      // Agrupar cursos por plan
      const mapa = new Map();
      for (const r of rows) {
        if (!mapa.has(r.idPlan)) {
          mapa.set(r.idPlan, {
            idPlan: r.idPlan,
            nombre: r.plan_nombre,
            descripcion: r.descripcion,
            beneficios: r.beneficios,
            precio: r.precio,
            cursos: []
          });
        }
        if (r.idCurso) {
          mapa.get(r.idPlan).cursos.push({
            idCurso: r.idCurso,
            nombreCurso: r.curso_nombre,
            descripcion: r.curso_descripcion,
            duracion: r.duracion
          });
        }
      }
      return res.status(200).json({ planes: Array.from(mapa.values()) });
    } catch (error) {
      return res.status(500).json({ error: 'Error al listar planes' });
    }
  }

  static async crearPago(req, res) {
    try {
      const clienteId = req.usuario.id;
      const { planId, metodo, referencia, monto, moneda } = req.body || {};
      if (!planId || !metodo || !monto) {
        return res.status(400).json({ error: 'planId, metodo y monto son obligatorios' });
      }
      const resultado = await BillingModelo.crearPago({ clienteId, planId, metodo, referencia, monto, moneda });
      const pago = await BillingModelo.obtenerPagoPorId(resultado.insertId);
      return res.status(201).json({ mensaje: 'Pago registrado', pago });
    } catch (error) {
      return res.status(500).json({ error: 'Error al registrar el pago' });
    }
  }

  static async listarPagos(req, res) {
    try {
      const clienteId = req.usuario.id;
      const pagos = await BillingModelo.obtenerPagosPorCliente(clienteId);
      return res.status(200).json({ pagos });
    } catch (error) {
      return res.status(500).json({ error: 'Error al listar pagos' });
    }
  }

  static async listarFacturas(req, res) {
    try {
      const clienteId = req.usuario.id;
      const facturas = await BillingModelo.obtenerFacturasPorCliente(clienteId);
      return res.status(200).json({ facturas });
    } catch (error) {
      return res.status(500).json({ error: 'Error al listar facturas' });
    }
  }

  static async obtenerFactura(req, res) {
    try {
      const clienteId = req.usuario.id;
      const { id } = req.params;
      const factura = await BillingModelo.obtenerFacturaConDetalle(id, clienteId);
      if (!factura) return res.status(404).json({ error: 'Factura no encontrada' });
      return res.status(200).json({ factura });
    } catch (error) {
      return res.status(500).json({ error: 'Error al obtener la factura' });
    }
  }
}

module.exports = BillingControlador;


