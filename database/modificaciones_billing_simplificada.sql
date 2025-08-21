-- --------------------------------------------------------
-- FACTURACIÓN SIMPLIFICADA (menos tablas)
-- Reemplaza el detalle en una tabla independiente por columnas en `facturas`
-- Base de datos: `tonguetrek`
-- Compatibilidad: MySQL 5.7+ / MariaDB 10.2+
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

START TRANSACTION;

-- ========================================================
-- 1) TABLAS MAESTRAS (se mantienen)
-- ========================================================

CREATE TABLE IF NOT EXISTS `planes` (
  `idPlan` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `beneficios` text DEFAULT NULL,
  `precio` decimal(12,2) NOT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idPlan`),
  UNIQUE KEY `uq_planes_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cursos` (
  `idCurso` int(11) NOT NULL AUTO_INCREMENT,
  `nombreCurso` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `duracion` varchar(50) DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`idCurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `planes_cursos` (
  `idPlan` int(11) NOT NULL,
  `idCurso` int(11) NOT NULL,
  PRIMARY KEY (`idPlan`,`idCurso`),
  KEY `idx_pc_curso` (`idCurso`),
  CONSTRAINT `fk_pc_plan` FOREIGN KEY (`idPlan`) REFERENCES `planes` (`idPlan`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pc_curso` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 2) PAGOS (primero, para referenciar desde facturas)
-- ========================================================

CREATE TABLE IF NOT EXISTS `pagos` (
  `idPago` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `metodo` enum('tarjeta','transferencia','efectivo','otro') NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto` decimal(12,2) NOT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'COP',
  `estado` enum('pendiente','pagado','fallido') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`idPago`),
  KEY `idx_pago_cliente` (`cliente_id`),
  KEY `idx_pago_plan` (`plan_id`),
  KEY `idx_pago_estado` (`estado`),
  CONSTRAINT `fk_pago_cliente_s` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_plan_s` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`idPlan`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 3) FACTURAS (simplificada: incluye los campos del detalle)
-- ========================================================

CREATE TABLE IF NOT EXISTS `facturas` (
  `idFactura` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `pago_id` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `periodo` char(7) DEFAULT NULL, -- 'YYYY-MM'
  `plan_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT '1',
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `estado` enum('pendiente','pagado','anulado') NOT NULL DEFAULT 'pendiente',
  `observaciones` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idFactura`),
  UNIQUE KEY `uq_fact_cliente_periodo` (`cliente_id`,`periodo`),
  KEY `idx_factura_cliente` (`cliente_id`),
  KEY `idx_factura_periodo` (`periodo`),
  KEY `idx_factura_estado` (`estado`),
  KEY `idx_factura_plan` (`plan_id`),
  KEY `idx_factura_pago` (`pago_id`),
  CONSTRAINT `fk_factura_cliente_s` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_factura_plan_s` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`idPlan`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_factura_pago_s` FOREIGN KEY (`pago_id`) REFERENCES `pagos` (`idPago`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 4) VISTAS (actualizadas a estructura simplificada)
-- ========================================================

DROP VIEW IF EXISTS `v_planes_cursos`;
CREATE VIEW `v_planes_cursos` AS
SELECT 
  p.idPlan,
  p.nombre AS plan_nombre,
  p.precio,
  c.idCurso,
  c.nombreCurso AS curso_nombre
FROM planes p
JOIN planes_cursos pc ON pc.idPlan = p.idPlan
JOIN cursos c ON c.idCurso = pc.idCurso;

DROP VIEW IF EXISTS `v_facturas_completas`;
CREATE VIEW `v_facturas_completas` AS
SELECT 
  f.idFactura,
  f.fecha,
  f.periodo,
  f.total,
  f.estado,
  f.cliente_id,
  cli.documento,
  cli.nombre AS cliente_nombre,
  f.plan_id,
  pl.nombre AS plan_nombre,
  f.cantidad,
  f.precio_unitario,
  f.subtotal,
  f.pago_id
FROM facturas f
JOIN clientes cli ON cli.id = f.cliente_id
JOIN planes pl ON pl.idPlan = f.plan_id;

-- ========================================================
-- 5) TRIGGERS (re-hechos para la estructura simplificada)
-- ========================================================

DROP TRIGGER IF EXISTS `trg_pagos_ai_crear_factura`;
DROP TRIGGER IF EXISTS `trg_pagos_au_sincronizar_factura`;
DROP TRIGGER IF EXISTS `trg_planes_au_refrescar_pendientes`;

DELIMITER $$

-- Crear factura automáticamente cuando entra un pago
CREATE TRIGGER `trg_pagos_ai_crear_factura`
AFTER INSERT ON `pagos` FOR EACH ROW
BEGIN
  DECLARE v_precio DECIMAL(12,2);
  DECLARE v_periodo CHAR(7);

  SELECT precio INTO v_precio FROM planes WHERE idPlan = NEW.plan_id;
  SET v_periodo = DATE_FORMAT(NEW.fecha_pago, '%Y-%m');

  INSERT INTO facturas (
    cliente_id, pago_id, fecha, periodo,
    plan_id, cantidad, precio_unitario, subtotal, total,
    estado
  ) VALUES (
    NEW.cliente_id, NEW.idPago, NEW.fecha_pago, v_periodo,
    NEW.plan_id, 1, v_precio, 1 * v_precio, 1 * v_precio,
    IF(NEW.estado='pagado','pagado','pendiente')
  );
END$$

-- Sincronizar estado de factura con el pago y permitir cambio de plan si pendiente
CREATE TRIGGER `trg_pagos_au_sincronizar_factura`
AFTER UPDATE ON `pagos` FOR EACH ROW
BEGIN
  DECLARE v_precio DECIMAL(12,2);

  -- Estado de la factura
  IF NEW.estado <> OLD.estado THEN
    UPDATE facturas 
    SET estado = IF(NEW.estado='pagado','pagado','pendiente')
    WHERE pago_id = NEW.idPago;
  END IF;

  -- Cambio de plan (solo aplica si la factura está pendiente)
  IF NEW.plan_id <> OLD.plan_id THEN
    SELECT precio INTO v_precio FROM planes WHERE idPlan = NEW.plan_id;

    UPDATE facturas 
    SET plan_id = NEW.plan_id,
        precio_unitario = v_precio,
        subtotal = cantidad * v_precio,
        total = cantidad * v_precio
    WHERE pago_id = NEW.idPago
      AND estado = 'pendiente';
  END IF;
END$$

-- Si cambia el precio del plan, refrescar facturas pendientes
CREATE TRIGGER `trg_planes_au_refrescar_pendientes`
AFTER UPDATE ON `planes` FOR EACH ROW
BEGIN
  IF NEW.precio <> OLD.precio THEN
    UPDATE facturas
    SET precio_unitario = NEW.precio,
        subtotal = cantidad * NEW.precio,
        total = cantidad * NEW.precio
    WHERE plan_id = NEW.idPlan
      AND estado = 'pendiente';
  END IF;
END$$

DELIMITER ;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


