// modelo/ClienteModelo.js
const pool = require('./bd/Conexion.js');

const ClienteModelo = {
  crearCliente: async (doc, nombre, correo, telefono, contrasenaHash) => {
    const sql = `INSERT INTO clientes (documento, nombre, correo, telefono, contrasena) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [doc, nombre, correo, telefono, contrasenaHash]);
    return result;
  },

  buscaCorreo: async (correo) => {
    const [rows] = await pool.execute(`SELECT * FROM clientes WHERE correo = ?`, [correo]);
    return rows[0];
  },

  incrementarIntentos: async (correo) => {
    const sql = `UPDATE clientes SET intentos_fallidos = intentos_fallidos + 1 WHERE correo = ?`;
    const [result] = await pool.execute(sql, [correo]);
    return result;
  },

bloquearUsuario: async (correo, motivo) => {
    const sql = "UPDATE clientes SET estado = ? WHERE correo = ?";
    await pool.execute(sql, [motivo, correo]);
},

  reiniciarIntentos: async (correo) => {
    const sql = `UPDATE clientes SET intentos_fallidos = 0 WHERE correo = ?`;
    const [result] = await pool.execute(sql, [correo]);
    return result;
  }, 

  modificarPerfil: async (id, nombre, telefono) => {
    const sql = `UPDATE clientes SET nombre = ?, telefono = ? WHERE id = ?`;
    const [result] = await pool.execute(sql, [nombre, telefono, id]);
    return result;
  }, 

  guardarToken: async (documento, token, fechaExpiracion, tipo) => {
    const fechaExp = new Date(fechaExpiracion * 1000);
    const sql = 'INSERT INTO tokens (documento, token, fecha_expiracion, tipo) VALUES (?, ?, ?, ?)';
    await pool.execute(sql, [documento, token, fechaExp, tipo]);
  },

  buscarToken: async (token) => {
    const [rows] = await pool.execute('SELECT * FROM tokens WHERE token = ?', [token]);
    return rows[0]; 
  },

  revocarToken: async (token) => {
    const sql = "UPDATE tokens SET estado = 'revocado' WHERE token = ?";
    await pool.execute(sql, [token]);
  },

  buscarPerfilPorClienteId: async (clienteId) => {
    const [rows] = await pool.execute('SELECT * FROM perfil WHERE cliente_id = ?', [clienteId]);
    return rows[0];
  },

crearPerfil: async (clienteId, documento, direccion, fechaExp, p1, p2, p3, r1Hash, r2Hash, r3Hash) => {
    const sql = `
      INSERT INTO perfil 
      (cliente_id, documento, direccion, fechaexpedicion, pregunta1, pregunta2, pregunta3, respuesta1, respuesta2, respuesta3) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [resultado] = await pool.execute(sql, [clienteId, documento, direccion, fechaExp, p1, p2, p3, r1Hash, r2Hash, r3Hash]);
    return resultado;
},

buscarClientePorDocumento: async (documento) => {
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE documento = ?', [documento]);
    return rows[0];
},

  actualizarContrasena: async (id, nuevaContrasenaHash) => {
    // También reseteamos el estado y los intentos fallidos
    const sql = "UPDATE clientes SET contrasena = ?, intentos_fallidos = 0, estado = 'activo' WHERE id = ?";
    await pool.execute(sql, [nuevaContrasenaHash, id]);
  },

  buscarClientePorId: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ?', [id]);
    return rows[0];
  },

  incrementarIntentosPreguntas: async (documento) => {
    const sql = "UPDATE clientes SET intentos_preguntas_fallidos = intentos_preguntas_fallidos + 1 WHERE documento = ?";
    await pool.execute(sql, [documento]);
  },

  reiniciarIntentosPreguntas: async (documento) => {
    const sql = "UPDATE clientes SET intentos_preguntas_fallidos = 0 WHERE documento = ?";
    await pool.execute(sql, [documento]);
  },

  actualizarContrasena: async (id, nuevaContrasenaHash) => {
  }, 

  desactivarCuenta: async (id) => {
    const sql = "UPDATE clientes SET estado = 'inactiva' WHERE id = ?";
    await pool.execute(sql, [id]);
  },

  revocarTodosLosTokensPorDocumento: async (documento) => {
    const sql = "UPDATE tokens SET estado = 'revocado' WHERE documento = ? AND tipo = 'acceso' AND estado = 'activo'";
    await pool.execute(sql, [documento]);
  }

};

module.exports = ClienteModelo;