// modelo/bd/Conexion.js
const { createPool } = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config(); // Carga las variables de entorno del archivo .env

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tonguetrek',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Error al conectar con la base de datos:', error);
    });

module.exports = pool; // Cambiado a module.exports