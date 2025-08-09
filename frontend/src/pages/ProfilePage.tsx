import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Box, Button, Card, CardContent, Divider, Grid, Stack, TextField, Typography,
} from '@mui/material';

export default function ProfilePage() {
  const { user, token, logout, updateUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Estado para configurar preguntas de seguridad
  const [secMsg, setSecMsg] = useState<string | null>(null);
  const [secErr, setSecErr] = useState<string | null>(null);
  const [secLoading, setSecLoading] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [security, setSecurity] = useState({
    direccion: '',
    fechaexpedicion: '',
    pregunta1: '', respuesta1: '',
    pregunta2: '', respuesta2: '',
    pregunta3: '', respuesta3: '',
  });

  if (!token || !user) return null;

  // Consultar si el perfil ya está completo para ocultar el formulario
  const [perfilCompleto, setPerfilCompleto] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await api.getProfileState(token);
      if (!mounted) return;
      setPerfilCompleto(res.data?.perfilCompleto ?? false);
      setShowSecurity(!(res.data?.perfilCompleto ?? false));
    })();
    return () => { mounted = false; };
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null); setSaveLoading(true);
    const res = await api.updateProfile(token, nombre, telefono);
    setSaveLoading(false);
    if (res.error) setErr(typeof res.error === 'string' ? res.error : 'Error');
    else {
      setMsg(res.data?.mensaje ?? 'Actualizado');
      updateUser({ nombre, telefono });
    }
  };

  const cerrar = async () => {
    await api.logout(token);
    logout();
  };

  // Eliminar cuenta
  const [delConfirm, setDelConfirm] = useState('');
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [delErr, setDelErr] = useState<string | null>(null);
  const [delLoading, setDelLoading] = useState(false);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Perfil</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Información de cuenta</Typography>
              <Typography variant="body1">Documento: {user.documento}</Typography>
              <Typography variant="body1">Correo: {user.correo}</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack component="form" gap={2} onSubmit={onSubmit}>
                <TextField label="Nombre" value={nombre} onChange={e=>setNombre(e.target.value)} required fullWidth />
                <TextField label="Teléfono" value={telefono ?? ''} onChange={e=>setTelefono(e.target.value)} fullWidth />
                <Stack direction="row" gap={2}>
                  <Button disabled={saveLoading} type="submit" variant="contained">{saveLoading ? 'Guardando...' : 'Guardar'}</Button>
                  <Button variant="outlined" color="inherit" onClick={cerrar}>Cerrar sesión</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">Preguntas de seguridad</Typography>
                <Button size="small" onClick={() => setShowSecurity(s => !s)}>{showSecurity ? 'Ocultar' : (perfilCompleto ? 'Editar' : 'Configurar')}</Button>
              </Stack>
              {showSecurity && (
                <Stack component="form" gap={2} onSubmit={async (e) => {
                  e.preventDefault();
                  setSecMsg(null); setSecErr(null); setSecLoading(true);
                  const res = await api.completeProfile(token, { ...security, contrasena: prompt('Por seguridad, ingresa tu contraseña actual para guardar cambios:') || '' });
                  setSecLoading(false);
                  if (res.error) { setSecErr(typeof res.error === 'string' ? res.error : 'Error'); return; }
                  setSecMsg(res.data?.mensaje ?? 'Perfil de seguridad configurado');
                  setPerfilCompleto(true);
                }}>
                  <TextField label="Dirección" value={security.direccion} onChange={e=>setSecurity(v=>({ ...v, direccion: e.target.value }))} required fullWidth />
                  <TextField label="Fecha expedición (YYYY-MM-DD)" value={security.fechaexpedicion} onChange={e=>setSecurity(v=>({ ...v, fechaexpedicion: e.target.value }))} required fullWidth />
                  <TextField label="Pregunta 1" value={security.pregunta1} onChange={e=>setSecurity(v=>({ ...v, pregunta1: e.target.value }))} required fullWidth />
                  <TextField label="Respuesta 1" value={security.respuesta1} onChange={e=>setSecurity(v=>({ ...v, respuesta1: e.target.value }))} required fullWidth />
                  <TextField label="Pregunta 2" value={security.pregunta2} onChange={e=>setSecurity(v=>({ ...v, pregunta2: e.target.value }))} required fullWidth />
                  <TextField label="Respuesta 2" value={security.respuesta2} onChange={e=>setSecurity(v=>({ ...v, respuesta2: e.target.value }))} required fullWidth />
                  <TextField label="Pregunta 3" value={security.pregunta3} onChange={e=>setSecurity(v=>({ ...v, pregunta3: e.target.value }))} required fullWidth />
                  <TextField label="Respuesta 3" value={security.respuesta3} onChange={e=>setSecurity(v=>({ ...v, respuesta3: e.target.value }))} required fullWidth />
                  <Button disabled={secLoading} type="submit" variant="contained">{secLoading ? 'Guardando...' : 'Guardar preguntas'}</Button>
                </Stack>
              )}
              {secMsg && <Typography color="success.main">{secMsg}</Typography>}
              {secErr && <Typography color="error">{secErr}</Typography>}
              {perfilCompleto && !showSecurity && <Typography color="text.secondary" mt={1}>Ya configuraste tus preguntas de seguridad.</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Eliminar cuenta</Typography>
              <Typography variant="body2" color="error" gutterBottom>
                Esta acción es irreversible. Se cerrarán todas tus sesiones y tu cuenta quedará inactiva.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} component="form" onSubmit={async (e) => {
                e.preventDefault();
                setDelMsg(null); setDelErr(null);
                // Redirige a un paso de verificación de contraseña
                const contrasena = prompt('Para eliminar la cuenta, ingresa tu contraseña. Si no la recuerdas, cancela para validar con preguntas.');
                setDelLoading(true);
                let res;
                if (contrasena) {
                  res = await api.deleteAccount(token, { contrasena });
                } else {
                  alert('Vamos a iniciar validación por preguntas. Responde correctamente una pregunta.');
                  // Iniciar flujo de preguntas con el documento del usuario
                  // Nota: el backend requiere documento para iniciar. Si lo tuviéramos en el token, lo usaríamos aquí.
                  // En este demo, pedimos al usuario su documento.
                  const documento = prompt('Ingresa tu documento para iniciar la validación por preguntas:');
                  if (!documento) { setDelLoading(false); setDelErr('Proceso cancelado.'); return; }
                  const start = await api.recoveryStart(documento);
                  if (start.error || !start.data) { setDelLoading(false); setDelErr(typeof start.error === 'string' ? start.error : 'No se pudo iniciar la validación'); return; }
                  const respuesta = prompt(`Pregunta: ${start.data.pregunta}\nRespuesta:`) || '';
                  const fecha = prompt('Fecha de expedición (YYYY-MM-DD)') || '';
                  const validar = await api.recoveryValidate(start.data.sessionToken, respuesta, fecha);
                  if (validar.error || !validar.data || (validar.data as any).resetToken) {
                    // Para eliminar cuenta no usamos resetToken; validemos nuevamente con sessionToken si nos devolvieron otra pregunta
                  }
                  // Si todavía no validó, tal vez devolvió nueva pregunta
                  if ((validar.data as any)?.sessionToken && (validar.data as any)?.pregunta) {
                    const respuesta2 = prompt(`Pregunta: ${(validar.data as any).pregunta}\nRespuesta:`) || '';
                    const validar2 = await api.recoveryValidate((validar.data as any).sessionToken, respuesta2, fecha);
                    if (validar2.error) { setDelLoading(false); setDelErr(typeof validar2.error === 'string' ? validar2.error : 'Validación fallida'); return; }
                    // Si pasó, usamos la última sessionToken y respuesta para eliminar
                    res = await api.deleteAccount(token, { viaPreguntas: true, sessionToken: (validar.data as any).sessionToken, respuesta: respuesta2, fechaexpedicion: fecha });
                  } else if (!validar.error) {
                    // Usar la primera respuesta si fue válida (no tenemos sessionToken siguiente, usamos el original)
                    res = await api.deleteAccount(token, { viaPreguntas: true, sessionToken: start.data.sessionToken, respuesta, fechaexpedicion: fecha });
                  } else {
                    setDelLoading(false); setDelErr(typeof validar.error === 'string' ? validar.error : 'Validación fallida'); return;
                  }
                }
                setDelLoading(false);
                if (res.error) { setDelErr(typeof res.error === 'string' ? res.error : 'Error'); return; }
                setDelMsg(res.data?.mensaje ?? 'Cuenta eliminada');
                await cerrar();
              }}>
                <Button disabled={delLoading} type="submit" color="error" variant="contained">{delLoading ? 'Procesando...' : 'Eliminar cuenta'}</Button>
              </Stack>
              {delMsg && <Typography color="success.main">{delMsg}</Typography>}
              {delErr && <Typography color="error">{delErr}</Typography>}
              <Typography variant="caption" color="text.secondary">Para eliminar por seguridad te pediremos tu contraseña, o podrás validar con tus preguntas.</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


