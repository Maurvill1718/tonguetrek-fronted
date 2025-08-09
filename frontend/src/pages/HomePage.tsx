import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Card, CardContent, Grid, Stack, Typography, Snackbar, Alert } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const greetingName = useMemo(() => {
    return user?.nombre || user?.correo || 'explorador';
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const key = `welcome_shown_${user?.id ?? 'anon'}`;
    if (!sessionStorage.getItem(key)) {
      setWelcomeOpen(true);
      sessionStorage.setItem(key, '1');
    }
  }, [isAuthenticated, user?.id]);

  return (
    <Box>
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
          p: { xs: 4, md: 6 },
          mb: 4,
          textAlign: 'center',
        }}
      >
        {isAuthenticated ? (
          <>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Hola, {greetingName}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              Nos alegra verte de vuelta. Continúa tu progreso en TongueTrek.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Aprende inglés con TongueTrek
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
              Lecciones prácticas, progreso real y soporte cuando lo necesitas.
            </Typography>
          </>
        )}
        {!isAuthenticated ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2}>
            <Button component={RouterLink} to="/registro" variant="contained" color="secondary" size="large">
              Comenzar ahora
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" color="inherit" size="large">
              Ya tengo cuenta
            </Button>
          </Stack>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2}>
            <Button component={RouterLink} to="/perfil" variant="contained" color="secondary" size="large">
              Ir a mi perfil
            </Button>
            <Button component={RouterLink} to="/recuperar" variant="outlined" color="inherit" size="large">
              Recuperar cuenta
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Contenido interactivo</Typography>
              <Typography variant="body2" color="text.secondary">
                Actividades y retos para entrenar listening, speaking y vocabulario.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Progreso medible</Typography>
              <Typography variant="body2" color="text.secondary">
                Metas semanales, historial y recordatorios para mantener el hábito.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Soporte amable</Typography>
              <Typography variant="body2" color="text.secondary">
                Acompañamiento cuando te trabas. Nunca estudias solo.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isAuthenticated && (
        <Typography variant="body2" color="text.secondary" mt={4}>
          Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}. Continúa desde tu perfil cuando quieras.
        </Typography>
      )}

      <Snackbar
        open={welcomeOpen}
        autoHideDuration={4000}
        onClose={() => setWelcomeOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setWelcomeOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          ¡Hola, {greetingName}! Bienvenido/a a TongueTrek.
        </Alert>
      </Snackbar>
    </Box>
  );
}


