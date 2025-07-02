// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const modelo = require('../modelo/ClienteModelo'); // Importamos el modelo para consultar la BD

const authMiddleware = async (req, res, next) => { // La función ahora es async
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Formato de token inválido.' });
    }

    try {
        // 1. Verificación Rápida (firma y expiración)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Verificación en Base de Datos (¡El paso nuevo y clave!)
        const tokenEnDB = await modelo.buscarToken(token);
        
        // Si el token no existe en la BD o si su estado es 'revocado', lo rechazamos.
        if (!tokenEnDB || tokenEnDB.estado === 'revocado') {
            return res.status(401).json({ error: 'Token inválido o revocado.' });
        }
        
        // Si todo está bien, guardamos los datos y el token en 'req' y continuamos.
        req.usuario = decoded; 
        req.token = token; // Guardamos el token para que 'cerrarSesión' pueda usarlo
        
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido.' });
    }
};

module.exports = authMiddleware;