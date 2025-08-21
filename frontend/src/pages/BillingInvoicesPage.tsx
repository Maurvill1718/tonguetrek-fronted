import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

type Factura = {
  idFactura: number;
  fecha: string;
  periodo: string | null;
  total: number;
  estado: 'pendiente' | 'pagado' | 'anulado';
};

export default function BillingInvoicesPage() {
  const { token } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545/api'}/facturas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setFacturas(json.facturas);
    })();
  }, [token]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mis facturas</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Periodo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {facturas.map(f => (
            <TableRow key={f.idFactura} hover>
              <TableCell>
                <Link component={RouterLink} to={`/facturas/${f.idFactura}`}>#{f.idFactura}</Link>
              </TableCell>
              <TableCell>{new Date(f.fecha).toLocaleString()}</TableCell>
              <TableCell>{f.periodo ?? '-'}</TableCell>
              <TableCell>{f.estado}</TableCell>
              <TableCell align="right">${f.total.toLocaleString('es-CO')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}


