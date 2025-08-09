// vista/Cliente/ClienteRuta.js
const express = require('express');
const router = express.Router();
const ClienteControlador = require('../../controlador/Clientes/ClienteControlador.js');
const authMiddleware = require('../../middleware/authMiddleware.js');

// --- Rutas Públicas (no requieren token) ---
router.post('/cliente', ClienteControlador.crearCliente);
router.post('/login', ClienteControlador.validarCredencial);

// --- NUEVAS RUTAS DE RECUPERACIÓN INTERACTIVAS ---
// Inicia el proceso y devuelve la primera pregunta al azar
router.post('/recuperar/iniciar', ClienteControlador.iniciarRecuperacion);

// Valida la respuesta a una pregunta y avanza en el ciclo
router.post('/recuperar/validar-pregunta', ClienteControlador.validarRespuestaInteractiva);

// Ruta final para restablecer la contraseña con el resetToken
router.post('/recuperar/restablecer', ClienteControlador.restablecerContrasena);


// --- Rutas Protegidas (requieren token) ---
router.post('/perfil', authMiddleware, ClienteControlador.completarPerfil);
router.put('/perfil', authMiddleware, ClienteControlador.modificarPerfil);
router.get('/perfil/estado', authMiddleware, ClienteControlador.estadoPerfil);
router.delete('/perfil', authMiddleware, ClienteControlador.eliminarCuenta);
router.post('/cerrar-sesion', authMiddleware, ClienteControlador.cerrarSesion);

module.exports = router;