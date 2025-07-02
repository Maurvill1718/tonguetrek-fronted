// vista/Cliente/ClienteRuta.js
const express = require('express');
const router = express.Router();
const ClienteControlador = require('../../controlador/Clientes/ClienteControlador.js');
const authMiddleware = require('../../middleware/authMiddleware.js');

// --- Rutas Públicas (no requieren token) ---

router.post('/recuperar/restablecer', ClienteControlador.restablecerContrasena);
router.post('/recuperar/validar', ClienteControlador.validarRespuestas);
router.post('/cliente', ClienteControlador.crearCliente);
router.post('/login', ClienteControlador.validarCredencial);
router.get('/recuperar/preguntas/:documento', ClienteControlador.obtenerPreguntas);

// --- Rutas Protegidas (requieren token) ---
// ✅ NUEVA RUTA: completar perfil por primera vez
router.post('/perfil', authMiddleware, ClienteControlador.completarPerfil);

// ✅ RUTA EXISTENTE: modificar perfil ya creado
router.put('/perfil', authMiddleware, ClienteControlador.modificarPerfil);

// ✅ RUTA EXISTENTE: cerrar sesión
router.post('/cerrar-sesion', authMiddleware, ClienteControlador.cerrarSesion);

module.exports = router;
