# INSTRUCCIONES PARA IMPLEMENTAR FACTURACIÓN DE PLANES

## 📋 Resumen
Crea tablas y triggers para manejar planes mensuales, cursos y facturación automática (factura + detalle + pagos).

## 🚀 Pasos
1. Abrir phpMyAdmin y seleccionar la base de datos `tonguetrek`.
2. Ir a la pestaña "SQL".
3. Copiar y pegar TODO el contenido de `modificaciones_billing.sql`.
4. Ejecutar.

## ✅ Qué se creará
- Tablas: `planes`, `cursos`, `planes_cursos`, `facturas`, `detalles_factura`, `pagos`.
- Vistas: `v_planes_cursos`, `v_facturas_completas`.
- Triggers:
  - `trg_pagos_ai_crear_factura`: crea factura y detalle al registrar un pago.
  - `trg_pagos_au_sincronizar_factura`: sincroniza estado de factura y cambia plan si el pago cambia.
  - `trg_planes_au_refrescar_pendientes`: actualiza totales de facturas pendientes si cambia el precio del plan.

## 🧩 Relaciones Clave
- `clientes` → `facturas` (1:N)
- `facturas` → `detalles_factura` (1:N)
- `planes` → `detalles_factura` (1:N)
- `clientes` → `pagos` (1:N)
- `planes` → `pagos` (1:N)
- `planes` ↔ `cursos` mediante `planes_cursos` (N:M)

## 🔎 Notas
- No se modifica backend ni frontend.
- Compatible con MySQL 5.7+ (usa InnoDB y utf8mb4).
- Si ya existen tablas con el mismo nombre, se respetan por `IF NOT EXISTS`.
- Los estados usados: `pendiente`, `pagado`, `anulado` (facturas) y `pendiente`, `pagado`, `fallido` (pagos).

## 🧪 Pruebas rápidas
```sql
-- 1) Crear un plan y un curso
INSERT INTO planes (nombre, precio) VALUES ('Plan Premium', 200000.00);
INSERT INTO cursos (nombreCurso, duracion) VALUES ('Inglés A1', '8 semanas');
INSERT INTO planes_cursos (idPlan, idCurso) VALUES (LAST_INSERT_ID(), 1);

-- 2) Registrar un pago (debe crear factura + detalle)
INSERT INTO pagos (cliente_id, plan_id, metodo, monto, estado)
VALUES (1, 1, 'tarjeta', 200000.00, 'pagado');

-- 3) Cambiar precio del plan (actualiza facturas pendientes)
UPDATE planes SET precio = 210000.00 WHERE idPlan = 1;
```

## 🔙 Reversión
- El script no elimina datos. Para revertir, haz backup previo.

**Fecha**: 2025-01-27  
**Versión**: 1.0


