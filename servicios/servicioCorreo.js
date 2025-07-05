// servicios/servicioCorreo.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// 1. Configurar el "transporter" (el cartero)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Usamos el servidor SMTP de Gmail
    port: 465,
    secure: true, // true para el puerto 465, false para otros
    auth: {
        user: process.env.EMAIL_USER, // Tu correo desde .env
        pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación desde .env
    },
});

// 2. Verificar que el cartero esté listo para trabajar
transporter.verify().then(() => {
    console.log('✅ Servicio de correo listo para enviar emails.');
}).catch(error => {
    console.error('❌ Error con el servicio de correo:', error);
});

/**
 * Función para enviar un correo electrónico.
 * @param {string} to - El destinatario del correo.
 * @param {string} subject - El asunto del correo.
 * @param {string} html - El cuerpo del correo en formato HTML.
 */
const enviarCorreo = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"TongueTrek" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html,
        });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        // Aquí podríamos implementar la lógica de reintentos más adelante.
    }
};

module.exports = { enviarCorreo };