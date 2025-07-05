// Ruta del archivo: controlador/Clientes/ClienteControlador.js 

const modelo = require('../../modelo/ClienteModelo.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { enviarCorreo } = require('../../servicios/servicioCorreo.js');

const MAX_ATTEMPTS = 3;

class ClienteControlador {
static generarTokenDeRecuperacion(cliente, preguntaActualIndex, preguntasRestantes) {
  const payload = { 
    id: cliente.id, 
    documento: cliente.documento,
    purpose: 'recovery-session',
    preguntaActualIndex: preguntaActualIndex,
    preguntasRestantes: preguntasRestantes // Array con los índices de las preguntas que quedan
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10m' }); // Damos 10 min para todo el proceso
}

  static async crearCliente(req, res) {
    console.log('--- INICIO: Petición para crear cliente recibida ---');
    try {
      console.log('[Paso 1] Extrayendo datos del body...');
      const { t1: doc, t2: nombre, t3: correo, t4: telefono, t5: contrasena } = req.body;
      console.log(`[OK] Datos extraídos para el documento: ${doc}`);

      console.log('[Paso 2] Realizando validaciones...');
      const errores = [];
      // Validación de existencia
      if (!doc) errores.push('El campo t1 (documento) es obligatorio.');
      if (!nombre) errores.push('El campo t2 (nombre) es obligatorio.');
      if (!correo) errores.push('El campo t3 (correo) es obligatorio.');
      if (!contrasena) errores.push('El campo t5 (contraseña) es obligatorio.');
      
      // Validación de la cédula (documento)
      if (doc && (doc.length < 8 || doc.length > 12)) {
          errores.push('El documento (t1) debe tener entre 8 y 12 dígitos.');
      }
      // Validación del teléfono
      if (telefono && telefono.length !== 10) {
          errores.push('El teléfono (t4) debe tener exactamente 10 dígitos.');
      }
      // Validación del formato del correo
      if (correo && !correo.includes('@')) {
          errores.push('El correo (t3) no es un formato válido.');
      }
      // Validación de la contraseña (mínimo una mayúscula y un número)
      if (contrasena && (!/[A-Z]/.test(contrasena) || !/[0-9]/.test(contrasena))) {
          errores.push('La contraseña (t5) debe contener al menos una letra mayúscula y un número.');
      }

      if (errores.length > 0) {
        console.log('❌ ERROR: Faltan campos o el formato es incorrecto.', errores);
        return res.status(400).json({ errores });
      }
      console.log('[OK] Validaciones pasadas.');

      console.log('[Paso 3] Encriptando contraseña...');
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      console.log('[OK] Contraseña encriptada.');

      console.log('[Paso 4] Llamando al modelo para guardar en la base de datos...');
      const resultado = await modelo.crearCliente(doc, nombre, correo, telefono, hashedPassword);
      console.log('[OK] Modelo respondió. ID insertado:', resultado.insertId);

      console.log('[Paso 5] Preparando correo de bienvenida...');
      const asunto = '¡Bienvenido a TongueTrek! 🚀 Tu aventura con el inglés comienza ahora';
      const cuerpoHtml = 
        `Hola ${nombre},<br><br>
        ¡Gracias por registrarte en <b>TongueTrek</b>! 🎓<br>
        Estamos emocionados de acompañarte en este viaje para dominar el inglés de forma práctica, divertida y a tu ritmo.<br><br>
        🔑 Ya puedes iniciar sesión con tu correo y empezar a explorar nuestras lecciones, actividades y recursos diseñados para ayudarte a avanzar paso a paso.<br><br>
        <b>📌 ¿Qué puedes hacer ahora?</b><br>
        - Acceder a tu perfil y completar tu información.<br>
        - Consultar nuestro contenido de aprendizaje.<br>
        - Recibir soporte si tienes dudas.<br><br>
        Si en algún momento necesitas ayuda, puedes escribirnos directamente.<br>
        ¡Bienvenido a la comunidad TongueTrek! 🌍<br><br>
        —<br>
        <b>Equipo TongueTrek</b><br>
        Academia virtual para aprender inglés`;
      await enviarCorreo(correo, asunto, cuerpoHtml);
      console.log(`[OK] Correo de bienvenida enviado a ${correo}`);

      console.log('[Paso 6] Enviando respuesta de éxito al cliente...');
      return res.status(201).json({
        mensaje: 'Cliente creado con éxito. Se ha enviado un correo de bienvenida.',
        id: resultado.insertId
      });

    } catch (error) {
      console.log('--- ❌ ERROR CATASTRÓFICO CAPTURADO ---');
      console.error(error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El documento o correo ya existen.' });
      }
      return res.status(500).json({ error: 'Error inesperado del servidor: ' + error.message });
    }
  }

  /**
   * Valida credenciales del cliente e iniciar sesión.
   * Incluye control de intentos fallidos, bloqueo de cuenta y notificación por correo.
   */
  static async validarCredencial(req, res) {
    try {
      const { t1: correo, t2: contrasena } = req.body;

      if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Los campos t1 (correo) y t2 (contraseña) son obligatorios.' });
      }

      const usuario = await modelo.buscaCorreo(correo);

      // Verificación 1: Si el usuario no existe o su cuenta fue eliminada ('inactiva'),
      // se devuelve un error genérico para no dar pistas.
      if (!usuario || usuario.estado === 'inactiva') {
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }

      // Verificación 2: Si la cuenta está bloqueada (por cualquier motivo), se informa.
      if (usuario.estado.startsWith('bloqueado')) {
        return res.status(403).json({ error: 'Cuenta bloqueada. Contacte a soporte o recupere su contraseña.' });
      }

      const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

      // Verificación 3: Si la contraseña es incorrecta.
      if (!coincide) {
        await modelo.incrementarIntentos(correo);
        // Volvemos a buscar al usuario para tener el conteo de intentos actualizado. ¡Buena lógica!
        const usuarioActualizado = await modelo.buscaCorreo(correo);
        const intentosRestantes = MAX_ATTEMPTS - usuarioActualizado.intentos_fallidos;

        if (intentosRestantes <= 0) {
          // Bloqueamos la cuenta y especificamos el motivo.
          await modelo.bloquearUsuario(correo, 'bloqueado_login');
          
          // Enviamos el correo de notificación de bloqueo. ¡Excelente adición!
          const asunto = 'Alerta de Seguridad: Tu cuenta en TongueTrek ha sido bloqueada';
          const cuerpoHtml = 
            `Hola ${usuarioActualizado.nombre},<br><br>
            Te informamos que tu cuenta ha sido bloqueada temporalmente debido a 3 intentos fallidos de inicio de sesión.<br><br>
            Si no reconoces esta actividad, te recomendamos iniciar el proceso de recuperación de cuenta o contactar a soporte inmediatamente.<br><br>
            Saludos,<br>
            <b>Equipo TongueTrek</b>`;
          await enviarCorreo(correo, asunto, cuerpoHtml);

          return res.status(403).json({ error: 'Credenciales incorrectas. Su cuenta ha sido bloqueada.' });
        }

        return res.status(401).json({
          error: `Credenciales incorrectas. Te quedan ${intentosRestantes} intento(s).`
        });
      }

      await modelo.reiniciarIntentos(correo);

      // Se genera el token de acceso.
      const payload = { id: usuario.id, correo: usuario.correo, documento: usuario.documento };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Se guarda el token en la base de datos como tipo 'acceso'.
      const decodedToken = jwt.decode(token);
      await modelo.guardarToken(usuario.documento, token, decodedToken.exp, 'acceso');

      // Se prepara la respuesta final sin la contraseña.
      const { contrasena: pass, ...usuarioSinPass } = usuario;
      return res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        usuario: usuarioSinPass,
        token
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
  }

  static async modificarPerfil(req, res) {
    try {
      const idUsuario = req.usuario.id;
      const { t2: nombre, t4: telefono } = req.body;

      if (!nombre || !telefono) {
        return res.status(400).json({ error: 'Los campos t2 (nombre) y t4 (teléfono) son requeridos.' });
      }

      await modelo.modificarPerfil(idUsuario, nombre, telefono);

      const correoUsuario = req.usuario.correo;
      const asunto = 'Tu perfil en TongueTrek ha sido actualizado 🔔';
      const cuerpoHtml = 
        `Hola ${nombre},<br><br>
        Te informamos que los datos de tu perfil en TongueTrek han sido actualizados recientemente.<br><br>
        Si no reconoces esta actividad, por favor contacta a soporte inmediatamente.<br><br>
        Saludos,<br>
        <b>Equipo TongueTrek</b>`;
      await enviarCorreo(correoUsuario, asunto, cuerpoHtml);

      return res.status(200).json({ mensaje: 'Perfil actualizado correctamente.' });

    } catch (error) {
      return res.status(500).json({ error: 'Error al actualizar el perfil.' });
    }
  }

  static async cerrarSesion(req, res) {
    try {
      const tokenARevocar = req.token;
      await modelo.revocarToken(tokenARevocar);
      return res.status(200).json({ mensaje: 'Sesión cerrada y token revocado exitosamente.' });
    } catch (error) {
      return res.status(500).json({ error: 'Error al cerrar la sesión.' });
    }
  }

  static async completarPerfil(req, res) {
    try {
      const { id: idUsuario, documento } = req.usuario;

      const perfilExistente = await modelo.buscarPerfilPorClienteId(idUsuario);
      if (perfilExistente) {
        return res.status(409).json({ error: 'Este usuario ya ha completado su perfil.' });
      }

      const {
        direccion,
        fechaexpedicion, 
        pregunta1, respuesta1,
        pregunta2, respuesta2,
        pregunta3, respuesta3
      } = req.body;

      if (!direccion || !fechaexpedicion || !pregunta1 || !respuesta1 || !pregunta2 || !respuesta2 || !pregunta3 || !respuesta3) {
        return res.status(400).json({ error: 'La dirección, fecha de expedición y las 3 preguntas/respuestas son requeridas.' });
      }

      const saltRounds = 10;
      const [hash1, hash2, hash3] = await Promise.all([
        bcrypt.hash(respuesta1, saltRounds),
        bcrypt.hash(respuesta2, saltRounds),
        bcrypt.hash(respuesta3, saltRounds)
      ]);

      await modelo.crearPerfil(
        idUsuario,
        documento,
        direccion,
        fechaexpedicion, 
        pregunta1,
        pregunta2,
        pregunta3,
        hash1,
        hash2,
        hash3
      );

      return res.status(201).json({ mensaje: 'Perfil completado y guardado exitosamente.' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al guardar el perfil.' });
    }
  }

static async iniciarRecuperacion(req, res) {
    try {
        const { documento } = req.body;
        if (!documento) return res.status(400).json({ error: 'El documento es requerido.' });

        const cliente = await modelo.buscarClientePorDocumento(documento);
        if (!cliente || cliente.estado.startsWith('bloqueado') || cliente.estado === 'inactiva') {
            return res.status(404).json({ error: 'Usuario no encontrado, bloqueado o inactivo.' });
        }

        const perfil = await modelo.buscarPerfilPorClienteId(cliente.id);
        if (!perfil || !perfil.pregunta1) {
            return res.status(404).json({ error: 'El usuario no ha configurado sus preguntas de seguridad.' });
        }

        // --- LÓGICA DE CORREO AÑADIDA ---
        const asunto = 'Se ha iniciado un proceso de recuperación de cuenta';
        const cuerpoHtml = `Hola ${cliente.nombre},<br><br>Hemos recibido una solicitud para recuperar el acceso a tu cuenta. Para continuar, por favor responde a la pregunta de seguridad que se te presentará en la aplicación.<br><br>Si no has sido tú, por favor contacta a soporte.`;
        await enviarCorreo(cliente.correo, asunto, cuerpoHtml);
        // --- FIN DE LA LÓGICA DE CORREO ---

        let indicesDisponibles = [1, 2, 3];
        let indiceAzar = Math.floor(Math.random() * indicesDisponibles.length);
        let preguntaIndex = indicesDisponibles.splice(indiceAzar, 1)[0];
        
const sessionToken = ClienteControlador.generarTokenDeRecuperacion(cliente, preguntaIndex, indicesDisponibles);

        return res.status(200).json({
            mensaje: "Por favor, responde a la siguiente pregunta.",
            pregunta: perfil[`pregunta${preguntaIndex}`],
            sessionToken: sessionToken
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error del servidor al iniciar la recuperación.' });
    }
}

static async validarRespuestaInteractiva(req, res) {
    try {
      const { sessionToken, respuesta, fechaexpedicion } = req.body;
      if (!sessionToken || !respuesta || !fechaexpedicion) {
        return res.status(400).json({ error: 'El token de sesión, la respuesta y la fecha son requeridos.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'recovery-session') throw new Error();
      } catch (error) {
        return res.status(401).json({ error: 'Token de sesión inválido o expirado. Vuelve a iniciar el proceso.' });
      }

      const { id: clienteId, documento, preguntaActualIndex, preguntasRestantes } = decoded;
      
      const [perfil, cliente] = await Promise.all([
        modelo.buscarPerfilPorClienteId(clienteId),
        modelo.buscarClientePorId(clienteId)
      ]);

      if (!perfil || !cliente) return res.status(404).json({ error: 'Usuario no encontrado.' });
      if (cliente.estado.startsWith('bloqueado')) return res.status(403).json({ error: 'La cuenta ha sido bloqueada.' });

      const fechaExpedicionBD = new Date(perfil.fechaexpedicion).toISOString().split('T')[0];
      const fechaCorrecta = (fechaexpedicion === fechaExpedicionBD);
      
      const respuestaCorrectaHash = perfil[`respuesta${preguntaActualIndex}`];
      const respuestaValida = await bcrypt.compare(respuesta, respuestaCorrectaHash);

      if (fechaCorrecta && respuestaValida) {
        // --- Lógica de Éxito (esta parte ya estaba bien) ---
        if (preguntasRestantes.length === 0) {
          await modelo.reiniciarIntentosPreguntas(documento);
          const payloadFinal = { id: clienteId, purpose: 'password-reset' };
          const resetToken = jwt.sign(payloadFinal, process.env.JWT_SECRET, { expiresIn: '5m' });
          await modelo.guardarToken(documento, resetToken, jwt.decode(resetToken).exp, 'reseteo');
          // Aquí iría el correo de éxito si lo necesitaras
          return res.status(200).json({
            mensaje: '¡Correcto! Todas las validaciones son correctas. Usa el siguiente token para restablecer tu contraseña.',
            resetToken: resetToken
          });
        } else {
          let indiceAzar = Math.floor(Math.random() * preguntasRestantes.length);
          let siguientePreguntaIndex = preguntasRestantes.splice(indiceAzar, 1)[0];
          const nextSessionToken = this.generarTokenDeRecuperacion(cliente, siguientePreguntaIndex, preguntasRestantes);
          return res.status(200).json({
            mensaje: '¡Respuesta correcta! Aquí tienes la siguiente pregunta.',
            pregunta: perfil[`pregunta${siguientePreguntaIndex}`],
            sessionToken: nextSessionToken
          });
        }
      } else {
        // --- INICIO DEL BLOQUE DE FALLO CON DEPURACIÓN ---
        console.log('[FALLO] La respuesta o la fecha son incorrectas.');
        await modelo.incrementarIntentosPreguntas(documento);
        
        const usuarioActualizado = await modelo.buscarClientePorId(clienteId);
        const intentosRestantes = MAX_ATTEMPTS - usuarioActualizado.intentos_preguntas_fallidos;
        console.log(`[INFO] Intentos restantes para el usuario: ${intentosRestantes}`);

        if (intentosRestantes <= 0) {
            console.log('[BLOQUEO] Límite de intentos alcanzado. Procediendo a bloquear la cuenta...');
            await modelo.bloquearUsuario(cliente.correo, 'bloqueado_preguntas');
            console.log(`[OK] Cuenta de ${cliente.correo} marcada como 'bloqueado_preguntas' en la BD.`);
            
            console.log('[EMAIL] Preparando correo de notificación de bloqueo...');
            const asuntoBloqueo = 'Alerta de Seguridad: Cuenta Bloqueada por Intentos de Recuperación';
            const cuerpoHtmlBloqueo = `Hola ${cliente.nombre},<br><br>Te informamos que tu cuenta ha sido bloqueada debido a 3 intentos fallidos al responder las preguntas de seguridad. Para proteger tu información, el acceso ha sido restringido. Por favor, contacta a soporte para recibir ayuda.<br><br>Saludos,<br><b>Equipo TongueTrek</b>`;
            
            await enviarCorreo(cliente.correo, asuntoBloqueo, cuerpoHtmlBloqueo);
            console.log(`[OK] Correo de bloqueo enviado a ${cliente.correo}.`);

            return res.status(403).json({ error: 'Respuesta incorrecta. Has agotado tus intentos y tu cuenta ha sido bloqueada.' });
        }
        
        // --- FIN DEL BLOQUE DE DEPURACIÓN ---
        return res.status(401).json({ error: `Respuesta o fecha incorrecta. Te quedan ${intentosRestantes} intento(s). El proceso de recuperación se reiniciará.` });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error del servidor al validar la respuesta.' });
    }
  }

  static async restablecerContrasena(req, res) {
    try {
      const { resetToken, nuevaContrasena } = req.body;
      if (!resetToken || !nuevaContrasena) {
        return res.status(400).json({ error: 'El token de reseteo y la nueva contraseña son requeridos.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido o expirado. Por favor, solicita tus preguntas de nuevo.' });
      }

      if (decoded.purpose !== 'password-reset') {
        return res.status(401).json({ error: 'Token no válido para esta operación.' });
      }

      const usuario = await modelo.buscarClientePorId(decoded.id);
      if (!usuario) {
        return res.status(404).json({ error: 'El usuario asociado a este token ya no existe.' });
      }

      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      await modelo.actualizarContrasena(decoded.id, hashedPassword);

      const asunto = 'Confirmación de cambio de contraseña en TongueTrek 🔒';
      const cuerpoHtml = 
        `Hola ${usuario.nombre},<br><br>
        Te confirmamos que tu contraseña ha sido actualizada exitosamente.<br><br>
        Si no realizaste este cambio, por favor contacta a soporte de inmediato.<br><br>
        Saludos,<br>
        <b>Equipo TongueTrek</b>`;
      await enviarCorreo(usuario.correo, asunto, cuerpoHtml);

      return res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });

    } catch (error) {
      return res.status(500).json({ error: 'Error del servidor.' });
    }
  }

  static async eliminarCuenta(req, res) {
    try {
      // Obtenemos los datos del usuario desde el token verificado por el middleware
      const { id, correo, nombre, documento } = req.usuario;

      // 1. Marcamos la cuenta del cliente como 'inactiva' en la tabla clientes
      await modelo.desactivarCuenta(id);
      console.log(`[OK] Cuenta del usuario ${id} marcada como inactiva.`);

      // 2. Por seguridad, revocamos TODOS los tokens de acceso activos que pueda tener.
      await modelo.revocarTodosLosTokensPorDocumento(documento);
      console.log(`[OK] Todos los tokens de acceso del documento ${documento} han sido revocados.`);

      // 3. Enviamos un correo de confirmación de que la cuenta fue eliminada.
      const asunto = 'Confirmación de eliminación de cuenta en TongueTrek';
      const cuerpoHtml = `
          Hola ${nombre},<br><br>
          Te confirmamos que tu cuenta en TongueTrek asociada al correo <b>${correo}</b> ha sido eliminada permanentemente.<br><br>
          Lamentamos verte partir. Si esto fue un error, por favor, contacta a soporte.<br><br>
          Saludos,<br>
          <b>Equipo TongueTrek</b>
      `;
      await enviarCorreo(correo, asunto, cuerpoHtml);
      console.log(`[OK] Correo de eliminación enviado a ${correo}.`);

      return res.status(200).json({ mensaje: 'Tu cuenta ha sido eliminada exitosamente. Se ha enviado un correo de confirmación.' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al procesar la eliminación de la cuenta.' });
    }
  }

}

module.exports = ClienteControlador;