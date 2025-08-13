-- =====================================================
-- MODIFICACIONES ESENCIALES PARA ROLES
-- Base de datos: tonguetrek
-- =====================================================

-- 1. Crear tabla de roles
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Insertar roles básicos
INSERT INTO `roles` (`nombre`, `descripcion`) VALUES
('cliente', 'Usuario cliente con acceso limitado'),
('administrador', 'Usuario administrador con acceso completo');

-- 3. Agregar columna rol_id a la tabla clientes
ALTER TABLE `clientes` 
ADD COLUMN `rol_id` int(11) NOT NULL DEFAULT 1 AFTER `estado`;

-- 4. Crear tabla de sesiones para administradores
CREATE TABLE `sesiones_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `token` text NOT NULL,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  `estado` enum('activa','expirada','cerrada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id`),
  KEY `fk_sesion_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Crear tabla de logs de actividad
CREATE TABLE `logs_actividad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `accion` varchar(100) NOT NULL,
  `detalles` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_log_usuario` (`usuario_id`),
  KEY `fk_log_rol` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Agregar restricciones de clave foránea
ALTER TABLE `clientes`
ADD CONSTRAINT `fk_cliente_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `sesiones_admin`
ADD CONSTRAINT `fk_sesion_admin` FOREIGN KEY (`admin_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `logs_actividad`
ADD CONSTRAINT `fk_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `fk_log_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Actualizar clientes existentes para asignar rol de cliente
UPDATE `clientes` SET `rol_id` = 1 WHERE `rol_id` = 0 OR `rol_id` IS NULL;

-- 8. Crear vistas útiles
CREATE VIEW `v_usuarios_completos` AS
SELECT 
  c.id,
  c.documento,
  c.nombre,
  c.correo,
  c.telefono,
  c.estado,
  r.nombre as rol_nombre
FROM clientes c
JOIN roles r ON c.rol_id = r.id;

CREATE VIEW `v_administradores` AS
SELECT 
  c.id,
  c.documento,
  c.nombre,
  c.correo,
  c.telefono,
  c.estado
FROM clientes c
JOIN roles r ON c.rol_id = r.id
WHERE r.nombre = 'administrador';

CREATE VIEW `v_clientes` AS
SELECT 
  c.id,
  c.documento,
  c.nombre,
  c.correo,
  c.telefono,
  c.estado
FROM clientes c
JOIN roles r ON c.rol_id = r.id
WHERE r.nombre = 'cliente';

-- =====================================================
-- FIN DE MODIFICACIONES ESENCIALES
-- =====================================================
