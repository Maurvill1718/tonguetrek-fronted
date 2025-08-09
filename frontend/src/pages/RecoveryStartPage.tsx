import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export default function RecoveryStartPage() {
  const [documento, setDocumento] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    const res = await api.recoveryStart(documento);
    setLoading(false);
    if (res.error || !res.data) { setError(typeof res.error === 'string' ? res.error : 'Error'); return; }
    sessionStorage.setItem('recovery_session', JSON.stringify(res.data));
    navigate('/recuperar/pregunta');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Recuperar cuenta</Typography>
      <Card>
        <CardContent>
          <Stack component="form" gap={2} onSubmit={onSubmit}>
            <TextField label="Documento" value={documento} onChange={e=>setDocumento(e.target.value)} required fullWidth />
            <Button disabled={loading} type="submit" variant="contained">{loading ? 'Enviando...' : 'Continuar'}</Button>
            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}


