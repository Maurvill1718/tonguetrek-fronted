import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export default function ResetPasswordPage() {
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('reset_token');
    if (!token) { navigate('/recuperar'); return; }
    setResetToken(token);
  }, [navigate]);

  if (!resetToken) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setMsg(null);
    const res = await api.resetPassword(resetToken, nuevaContrasena);
    if (res.error) { setError(typeof res.error === 'string' ? res.error : 'Error'); return; }
    setMsg(res.data?.mensaje ?? 'Contraseña actualizada');
    sessionStorage.removeItem('reset_token');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Restablecer contraseña</Typography>
      <Card>
        <CardContent>
          <Stack component="form" gap={2} onSubmit={onSubmit}>
            <TextField type="password" label="Nueva contraseña" value={nuevaContrasena} onChange={e=>setNuevaContrasena(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained">Guardar</Button>
            {msg && <Typography color="success.main">{msg}</Typography>}
            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}


