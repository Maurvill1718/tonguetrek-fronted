import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

type RecoverySession = { mensaje: string; pregunta: string; sessionToken: string };

export default function RecoveryQuestionPage() {
  const [session, setSession] = useState<RecoverySession | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [fechaexpedicion, setFechaexpedicion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = sessionStorage.getItem('recovery_session');
    if (!raw) { navigate('/recuperar'); return; }
    setSession(JSON.parse(raw));
  }, [navigate]);

  if (!session) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await api.recoveryValidate(session.sessionToken, respuesta, fechaexpedicion);
    setLoading(false);
    if (!res.data || 'error' in res.data) {
      // Falló: puede traer nueva pregunta y nuevo sessionToken
      const pregunta = (res.data as any)?.pregunta;
      const sessionToken = (res.data as any)?.sessionToken;
      if (pregunta && sessionToken) {
        const next: RecoverySession = { mensaje: 'Nueva pregunta', pregunta, sessionToken };
        sessionStorage.setItem('recovery_session', JSON.stringify(next));
        setSession(next);
        setRespuesta('');
        setError(typeof res.error === 'string' ? res.error : 'Respuesta incorrecta');
      } else {
        setError(typeof res.error === 'string' ? res.error : 'Error');
      }
      return;
    }
    // Éxito: tenemos resetToken
    const resetToken = (res.data as any).resetToken as string;
    sessionStorage.setItem('reset_token', resetToken);
    navigate('/recuperar/reset');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Pregunta de seguridad</Typography>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>{session.pregunta}</Typography>
          <Stack component="form" gap={2} onSubmit={onSubmit}>
            <TextField label="Respuesta" value={respuesta} onChange={e=>setRespuesta(e.target.value)} required fullWidth />
            <TextField label="Fecha expedición (YYYY-MM-DD)" value={fechaexpedicion} onChange={e=>setFechaexpedicion(e.target.value)} required fullWidth />
            <Button disabled={loading} type="submit" variant="contained">{loading ? 'Validando...' : 'Validar'}</Button>
            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}


