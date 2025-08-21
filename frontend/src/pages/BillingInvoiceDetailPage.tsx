import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Card, CardContent, Typography } from '@mui/material';

type FacturaDetalle = {
  idFactura: number;
  fecha: string;
  periodo: string | null;
  total: number;
  estado: 'pendiente' | 'pagado' | 'anulado';
  idDetalle: number;
  plan_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  plan_nombre: string;
};

export default function BillingInvoiceDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [factura, setFactura] = useState<FacturaDetalle | null>(null);

  useEffect(() => {
    (async () => {
      if (!token || !id) return;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545/api'}/facturas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setFactura(json.factura);
    })();
  }, [token, id]);

  if (!factura) return <Typography>Cargando factura...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Factura #{factura.idFactura}</Typography>
      <Card>
        <CardContent>
          <Typography variant="subtitle2">Fecha</Typography>
          <Typography>{new Date(factura.fecha).toLocaleString()}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Periodo</Typography>
          <Typography>{factura.periodo ?? '-'}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>Estado</Typography>
          <Typography>{factura.estado}</Typography>
          <Typography variant="h6" sx={{ mt: 3 }}>{factura.plan_nombre}</Typography>
          <Typography>{factura.descripcion}</Typography>
          <Typography>Cantidad: {factura.cantidad}</Typography>
          <Typography>Precio: ${factura.precio_unitario.toLocaleString('es-CO')}</Typography>
          <Typography>Subtotal: ${factura.subtotal.toLocaleString('es-CO')}</Typography>
          <Typography variant="h5" color="primary" sx={{ mt: 2 }}>Total: ${factura.total.toLocaleString('es-CO')}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}


