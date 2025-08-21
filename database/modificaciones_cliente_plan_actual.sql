-- --------------------------------------------------------
-- Agrega referencia al plan actual del cliente
-- Ejecutar una sola vez después de crear tablas de billing
-- --------------------------------------------------------

START TRANSACTION;

-- Columna para plan actual (NULL = sin plan seleccionado)
ALTER TABLE `clientes`
  ADD COLUMN `plan_id_actual` INT NULL AFTER `rol_id`;

-- Índice y FK
ALTER TABLE `clientes`
  ADD KEY `idx_cliente_plan_actual` (`plan_id_actual`),
  ADD CONSTRAINT `fk_cliente_plan_actual` FOREIGN KEY (`plan_id_actual`) REFERENCES `planes` (`idPlan`) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;


