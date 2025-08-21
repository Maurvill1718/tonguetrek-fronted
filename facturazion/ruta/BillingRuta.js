// facturazion/ruta/BillingRuta.js
const express = require('express');
const router = express.Router();
const BillingControlador = require('../controlador/BillingControlador.js');
const authMiddleware = require('../../middleware/authMiddleware.js');

// Planes: público
router.get('/planes', BillingControlador.listarPlanes);

// Flujo de pagos simulado y facturas
router.post('/pagos', authMiddleware, BillingControlador.crearPago);
router.get('/pagos', authMiddleware, BillingControlador.listarPagos);
router.get('/facturas', authMiddleware, BillingControlador.listarFacturas);
router.get('/facturas/:id', authMiddleware, BillingControlador.obtenerFactura);

module.exports = router;


