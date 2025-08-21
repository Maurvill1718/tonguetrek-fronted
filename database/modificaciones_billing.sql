-- --------------------------------------------------------
-- MODIFICACIONES PARA FACTURACIÓN DE PLANES MENSUALES
-- Base de datos: `tonguetrek`
-- Compatibilidad: MySQL 5.7+ / MariaDB 10.2+
-- NOTA: Solo modifica la BD. No cambia lógica de backend/frontend.
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

START TRANSACTION;

-- ========================================================
-- 1) TABLAS MAESTRAS: PLANES, CURSOS, PLANES_CURSOS
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
-- 2) FACTURACIÓN: FACTURAS, DETALLES, PAGOS
-- ========================================================

CREATE TABLE IF NOT EXISTS `facturas` (
  `idFactura` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `periodo` char(7) DEFAULT NULL, -- 'YYYY-MM'
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estado` enum('pendiente','pagado','anulado') NOT NULL DEFAULT 'pendiente',
  `observaciones` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idFactura`),
  KEY `idx_factura_cliente` (`cliente_id`),
  KEY `idx_factura_periodo` (`periodo`),
  KEY `idx_factura_estado` (`estado`),
  CONSTRAINT `fk_factura_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `detalles_factura` (
  `idDetalle` int(11) NOT NULL AUTO_INCREMENT,
  `idFactura` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `cantidad` int(11) NOT NULL DEFAULT '1',
  `precio_unitario` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`idDetalle`),
  KEY `idx_detalle_factura` (`idFactura`),
  KEY `idx_detalle_plan` (`plan_id`),
  CONSTRAINT `fk_detalle_factura` FOREIGN KEY (`idFactura`) REFERENCES `facturas` (`idFactura`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`idPlan`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pagos` (
  `idPago` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `idFactura` int(11) DEFAULT NULL,
  `metodo` enum('tarjeta','transferencia','efectivo','otro') NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `monto` decimal(12,2) NOT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'COP',
  `estado` enum('pendiente','pagado','fallido') NOT NULL DEFAULT 'pendiente',
  PRIMARY KEY (`idPago`),
  KEY `idx_pago_cliente` (`cliente_id`),
  KEY `idx_pago_plan` (`plan_id`),
  KEY `idx_pago_factura` (`idFactura`),
  KEY `idx_pago_estado` (`estado`),
  CONSTRAINT `fk_pago_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_plan` FOREIGN KEY (`plan_id`) REFERENCES `planes` (`idPlan`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_pago_factura` FOREIGN KEY (`idFactura`) REFERENCES `facturas` (`idFactura`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- 3) VISTAS ÚTILES
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
  c.documento,
  c.nombre AS cliente_nombre,
  d.idDetalle,
  d.plan_id,
  pl.nombre AS plan_nombre,
  d.cantidad,
  d.precio_unitario,
  d.subtotal
FROM facturas f
JOIN clientes c ON c.id = f.cliente_id
JOIN detalles_factura d ON d.idFactura = f.idFactura
JOIN planes pl ON pl.idPlan = d.plan_id;

-- ========================================================
-- 4) TRIGGERS: AUTOMATIZACIÓN DE FACTURAS Y ESTADOS
-- ========================================================

DELIMITER $$

-- Al registrar un pago, crear automáticamente la factura y su detalle
CREATE TRIGGER `trg_pagos_ai_crear_factura`
AFTER INSERT ON `pagos` FOR EACH ROW
BEGIN
  DECLARE v_precio DECIMAL(12,2);
  DECLARE v_desc VARCHAR(255);
  DECLARE v_idFactura INT;
  DECLARE v_periodo CHAR(7);

  SELECT precio, CONCAT('Plan ', nombre) INTO v_precio, v_desc FROM planes WHERE idPlan = NEW.plan_id;
  SET v_periodo = DATE_FORMAT(NEW.fecha_pago, '%Y-%m');

  INSERT INTO facturas (cliente_id, fecha, periodo, total, estado)
  VALUES (NEW.cliente_id, NEW.fecha_pago, v_periodo, 0.00, IF(NEW.estado='pagado','pagado','pendiente'));

  SET v_idFactura = LAST_INSERT_ID();

  INSERT INTO detalles_factura (idFactura, plan_id, descripcion, cantidad, precio_unitario, subtotal)
  VALUES (v_idFactura, NEW.plan_id, v_desc, 1, v_precio, 1 * v_precio);

  UPDATE facturas f
  JOIN (
    SELECT idFactura, SUM(subtotal) AS total
    FROM detalles_factura
    WHERE idFactura = v_idFactura
    GROUP BY idFactura
  ) t ON t.idFactura = f.idFactura
  SET f.total = t.total
  WHERE f.idFactura = v_idFactura;

  UPDATE pagos SET idFactura = v_idFactura WHERE idPago = NEW.idPago;
END$$

-- Si cambia el estado del pago, sincronizar el estado de la factura
-- Si cambia el plan del pago (y la factura está pendiente), actualizar el detalle y total
CREATE TRIGGER `trg_pagos_au_sincronizar_factura`
AFTER UPDATE ON `pagos` FOR EACH ROW
BEGIN
  DECLARE v_precio DECIMAL(12,2);
  DECLARE v_desc VARCHAR(255);

  IF NEW.idFactura IS NOT NULL THEN
    -- Estado
    IF NEW.estado <> OLD.estado THEN
      UPDATE facturas SET estado = IF(NEW.estado='pagado','pagado','pendiente') WHERE idFactura = NEW.idFactura;
    END IF;

    -- Cambio de plan sobre un pago con factura pendiente
    IF NEW.plan_id <> OLD.plan_id THEN
      SELECT precio, CONCAT('Plan ', nombre) INTO v_precio, v_desc FROM planes WHERE idPlan = NEW.plan_id;

      UPDATE detalles_factura df
      JOIN facturas f ON f.idFactura = df.idFactura
      SET df.plan_id = NEW.plan_id,
          df.descripcion = v_desc,
          df.precio_unitario = v_precio,
          df.subtotal = df.cantidad * v_precio
      WHERE df.idFactura = NEW.idFactura
        AND f.estado = 'pendiente';

      UPDATE facturas f
      JOIN (
        SELECT idFactura, SUM(subtotal) AS total
        FROM detalles_factura
        WHERE idFactura = NEW.idFactura
        GROUP BY idFactura
      ) t ON t.idFactura = f.idFactura
      SET f.total = t.total
      WHERE f.idFactura = NEW.idFactura;
    END IF;
  END IF;
END$$

-- Si cambia el precio de un plan, actualizar las facturas pendientes que lo incluyan
CREATE TRIGGER `trg_planes_au_refrescar_pendientes`
AFTER UPDATE ON `planes` FOR EACH ROW
BEGIN
  IF NEW.precio <> OLD.precio THEN
    UPDATE detalles_factura df
    JOIN facturas f ON f.idFactura = df.idFactura
    SET df.precio_unitario = NEW.precio,
        df.subtotal = df.cantidad * NEW.precio
    WHERE df.plan_id = NEW.idPlan
      AND f.estado = 'pendiente';

    UPDATE facturas f
    JOIN (
      SELECT idFactura, SUM(subtotal) AS total
      FROM detalles_factura
      GROUP BY idFactura
    ) t ON t.idFactura = f.idFactura
    SET f.total = t.total
    WHERE f.estado = 'pendiente';
  END IF;
END$$

DELIMITER ;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


