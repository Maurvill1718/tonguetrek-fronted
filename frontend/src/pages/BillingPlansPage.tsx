import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

type Plan = {
  idPlan: number;
  nombre: string;
  descripcion?: string;
  beneficios?: string;
  precio: number;
  cursos: { idCurso: number; nombreCurso: string; descripcion?: string; duracion?: string }[];
};

export default function BillingPlansPage() {
  const { token } = useAuth();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await apiRequest<{ planes: Plan[] }>('/planes');
      if (res?.planes) setPlanes(res.planes);
      else setError('No se encontraron planes.');
      setLoading(false);
    })();
  }, []);

  async function apiRequest<T>(path: string): Promise<T | undefined> {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545/api'}${path}`);
      if (!res.ok) return undefined;
      return (await res.json()) as T;
    } catch (e) {
      setError('No se pudo conectar con el servidor.');
      return undefined;
    }
  }

  async function contratar(planId: number, precio: number, nombre: string) {
    const confirmar = window.confirm(`¿Estás seguro que deseas adquirir el ${nombre} por $${precio.toLocaleString('es-CO')}?`);
    if (!confirmar) return;
    if (!token) {
      alert('Debes iniciar sesión para comprar un plan.');
      navigate('/login');
      return;
    }
    try {
      setProcessingId(planId);
      const payload = { planId, metodo: 'otro', monto: precio };
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545/api'}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(body?.error || 'No se pudo registrar la compra.');
        return;
      }
      alert('Compra registrada. Tu factura fue generada automáticamente.');
      navigate('/facturas');
    } catch (e) {
      alert('No se pudo conectar con el servidor.');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <Typography>Cargando planes...</Typography>;
  if (error || planes.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Planes de Suscripción</Typography>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {error || 'No hay planes disponibles en este momento.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Planes de Suscripción</Typography>
      <Grid container spacing={2}>
        {planes.map((p) => (
          <Grid item xs={12} md={6} key={p.idPlan}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.nombre}</Typography>
                <Typography variant="h5" color="primary">${p.precio.toLocaleString('es-CO')}</Typography>
                {p.descripcion && <Typography sx={{ mt: 1 }}>{p.descripcion}</Typography>}
                {p.cursos?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Incluye cursos:</Typography>
                    <ul>
                      {p.cursos.map((c) => (
                        <li key={c.idCurso}><Typography variant="body2">{c.nombreCurso}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  disabled={processingId === p.idPlan}
                  onClick={() => contratar(p.idPlan, p.precio, p.nombre)}
                >
                  {processingId === p.idPlan ? 'Procesando...' : 'Contratar'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


