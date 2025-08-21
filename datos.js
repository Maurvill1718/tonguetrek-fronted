// datos.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rutaCliente = require('./vista/Cliente/ClienteRuta.js'); // Usando la ruta que ya corregimos
const rutaBilling = require('./facturazion/ruta/BillingRuta.js');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4545;


// --- ORDEN CORRECTO Y COMPLETO DE MIDDLEWARE ---

// 1. Habilitar CORS para permitir peticiones de otros orígenes
app.use(cors());

// 2. HABILITAR EL LECTOR DE JSON (para 'raw' en Postman)
// Esta es la línea más importante para nosotros.
app.use(express.json());

// 3. HABILITAR EL LECTOR DE FORMULARIOS (para 'x-www-form-urlencoded')
// Añadimos este para que el servidor sea más robusto.
app.use(express.urlencoded({ extended: true }));


// 4. REGISTRAR LAS RUTAS (DESPUÉS de los lectores)
// Como los "traductores" ya están listos, las rutas recibirán los datos correctamente.
app.use('/api', rutaCliente);
app.use('/api', rutaBilling);


// Iniciar el servidor
app.listen(PORT, () => {
    // Limpiamos la consola antes de iniciar para ver los mensajes claramente
    console.clear(); 
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log("✅ Servidor listo para recibir peticiones JSON.");
});