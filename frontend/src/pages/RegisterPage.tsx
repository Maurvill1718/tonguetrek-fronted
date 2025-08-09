import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';

export default function RegisterPage() {
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  const [t4, setT4] = useState('');
  const [t5, setT5] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    const res = await api.register(t1, t2, t3, t4, t5);
    if (res.error) setErr(Array.isArray(res.error) ? res.error.join(', ') : res.error);
    else setMsg(res.data?.mensaje ?? 'Registrado');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Registro</Typography>
      <Card>
        <CardContent>
          <Stack component="form" gap={2} onSubmit={onSubmit}>
            <TextField label="Documento (t1)" value={t1} onChange={e=>setT1(e.target.value)} required fullWidth />
            <TextField label="Nombre (t2)" value={t2} onChange={e=>setT2(e.target.value)} required fullWidth />
            <TextField label="Correo (t3)" type="email" value={t3} onChange={e=>setT3(e.target.value)} required fullWidth />
            <TextField label="Teléfono (t4)" value={t4} onChange={e=>setT4(e.target.value)} fullWidth />
            <TextField label="Contraseña (t5)" type="password" value={t5} onChange={e=>setT5(e.target.value)} required fullWidth />
            <Button type="submit" variant="contained">Crear</Button>
            {msg && <Typography color="success.main">{msg}</Typography>}
            {err && <Typography color="error">{err}</Typography>}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}


