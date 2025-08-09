import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await api.login(correo, contrasena);
    setLoading(false);
    if (res.error || !res.data) {
      setError(typeof res.error === 'string' ? res.error : 'Error de autenticación');
      return;
    }
    login(res.data.token, res.data.usuario);
    navigate('/perfil');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Iniciar sesión</Typography>
      <Card>
        <CardContent>
          <Stack component="form" gap={2} onSubmit={onSubmit}>
            <TextField label="Correo" type="email" value={correo} onChange={e=>setCorreo(e.target.value)} required fullWidth />
            <TextField label="Contraseña" type="password" value={contrasena} onChange={e=>setContrasena(e.target.value)} required fullWidth />
            {error && <Typography color="error">{error}</Typography>}
            <Button disabled={loading} type="submit" variant="contained">{loading ? 'Enviando...' : 'Entrar'}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}


