import { Route, Routes, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import RecoveryStartPage from './pages/RecoveryStartPage';
import RecoveryQuestionPage from './pages/RecoveryQuestionPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import {
  AppBar, Box, Button, Container, CssBaseline, Toolbar, Typography
} from '@mui/material';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>TongueTrek</Typography>
          <Button color="inherit" component={Link} to="/">Inicio</Button>
          {!isAuthenticated && <Button color="inherit" component={Link} to="/login">Login</Button>}
          {!isAuthenticated && <Button color="inherit" component={Link} to="/registro">Registro</Button>}
          <Button color="inherit" component={Link} to="/recuperar">Recuperar</Button>
          {isAuthenticated && <Button color="inherit" component={Link} to="/perfil">Perfil</Button>}
          {isAuthenticated && <Button color="inherit" onClick={logout}>Salir</Button>}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ py: 6 }}>
        <Container maxWidth="md">
          {children}
        </Container>
      </Box>
      <Box component="footer" sx={{ py: 4, bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} TongueTrek • Aprende inglés a tu ritmo</Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/recuperar" element={<RecoveryStartPage />} />
          <Route path="/recuperar/pregunta" element={<RecoveryQuestionPage />} />
          <Route path="/recuperar/reset" element={<ResetPasswordPage />} />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil/completar"
            element={
              <PrivateRoute>
                <CompleteProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}


