-- =====================================================
-- MODIFICACIONES PARA CONECTAR ROLES DE CLIENTE Y ADMINISTRADOR
-- Base de datos: tonguetrek
-- Fecha: 2025-01-27
-- =====================================================

-- 1. Crear tabla de roles
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text,
  `permisos` json DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Insertar roles básicos
INSERT INTO `roles` (`nombre`, `descripcion`, `permisos`) VALUES
('cliente', 'Usuario cliente con acceso limitado', '{"ver_perfil": true, "editar_perfil": true, "cambiar_contrasena": true}'),
('administrador', 'Usuario administrador con acceso completo', '{"ver_perfil": true, "editar_perfil": true, "cambiar_contrasena": true, "gestionar_clientes": true, "gestionar_roles": true, "ver_reportes": true}');

-- 3. Agregar columna rol_id a la tabla clientes
ALTER TABLE `clientes` 
ADD COLUMN `rol_id` int(11) NOT NULL DEFAULT 1 AFTER `estado`,
ADD COLUMN `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `rol_id`,
ADD COLUMN `ultima_actividad` timestamp NULL DEFAULT NULL AFTER `fecha_creacion`;

-- 4. Crear tabla de sesiones para administradores
CREATE TABLE `sesiones_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `token` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
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
  `detalles` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_log_usuario` (`usuario_id`),
  KEY `fk_log_rol` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Crear tabla de permisos personalizados
CREATE TABLE `permisos_personalizados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol_id` int(11) NOT NULL,
  `permiso` varchar(100) NOT NULL,
  `valor` boolean NOT NULL DEFAULT true,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rol_permiso` (`rol_id`, `permiso`),
  KEY `fk_permiso_rol` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Agregar índices para mejorar rendimiento
ALTER TABLE `clientes` ADD INDEX `idx_rol_id` (`rol_id`);
ALTER TABLE `clientes` ADD INDEX `idx_estado_rol` (`estado`, `rol_id`);
ALTER TABLE `clientes` ADD INDEX `idx_fecha_creacion` (`fecha_creacion`);

-- 8. Crear vistas para facilitar consultas
CREATE VIEW `v_usuarios_completos` AS
SELECT 
  c.id,
  c.documento,
  c.nombre,
  c.correo,
  c.telefono,
  c.estado,
  r.nombre as rol_nombre,
  r.descripcion as rol_descripcion,
  c.fecha_creacion,
  c.ultima_actividad
FROM clientes c
JOIN roles r ON c.rol_id = r.id;

CREATE VIEW `v_administradores` AS
SELECT 
  c.id,
  c.documento,
  c.nombre,
  c.correo,
  c.telefono,
  c.estado,
  c.fecha_creacion,
  c.ultima_actividad
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
  c.estado,
  c.fecha_creacion,
  c.ultima_actividad
FROM clientes c
JOIN roles r ON c.rol_id = r.id
WHERE r.nombre = 'cliente';

-- 9. Agregar restricciones de clave foránea
ALTER TABLE `clientes`
ADD CONSTRAINT `fk_cliente_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `sesiones_admin`
ADD CONSTRAINT `fk_sesion_admin` FOREIGN KEY (`admin_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `logs_actividad`
ADD CONSTRAINT `fk_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `fk_log_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `permisos_personalizados`
ADD CONSTRAINT `fk_permiso_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Insertar permisos personalizados básicos
INSERT INTO `permisos_personalizados` (`rol_id`, `permiso`) VALUES
(1, 'ver_perfil'),
(1, 'editar_perfil'),
(1, 'cambiar_contrasena'),
(2, 'ver_perfil'),
(2, 'editar_perfil'),
(2, 'cambiar_contrasena'),
(2, 'gestionar_clientes'),
(2, 'gestionar_roles'),
(2, 'ver_reportes'),
(2, 'gestionar_sistema');

-- 11. Actualizar clientes existentes para asignar rol de cliente
UPDATE `clientes` SET `rol_id` = 1 WHERE `rol_id` = 0 OR `rol_id` IS NULL;

-- 12. Crear procedimiento almacenado para cambiar rol de usuario
DELIMITER //
CREATE PROCEDURE `CambiarRolUsuario`(
  IN p_usuario_id INT,
  IN p_nuevo_rol_id INT,
  IN p_admin_id INT
)
BEGIN
  DECLARE v_rol_actual VARCHAR(50);
  DECLARE v_nuevo_rol VARCHAR(50);
  
  -- Obtener rol actual
  SELECT r.nombre INTO v_rol_actual
  FROM clientes c
  JOIN roles r ON c.rol_id = r.id
  WHERE c.id = p_usuario_id;
  
  -- Obtener nuevo rol
  SELECT nombre INTO v_nuevo_rol
  FROM roles
  WHERE id = p_nuevo_rol_id;
  
  -- Verificar que el usuario existe
  IF v_rol_actual IS NOT NULL AND v_nuevo_rol IS NOT NULL THEN
    -- Cambiar rol
    UPDATE clientes SET rol_id = p_nuevo_rol_id WHERE id = p_usuario_id;
    
    -- Registrar en logs
    INSERT INTO logs_actividad (usuario_id, rol_id, accion, detalles, ip_address)
    VALUES (p_admin_id, (SELECT rol_id FROM clientes WHERE id = p_admin_id), 
            'cambio_rol', 
            JSON_OBJECT('usuario_afectado', p_usuario_id, 'rol_anterior', v_rol_actual, 'rol_nuevo', v_nuevo_rol),
            NULL);
    
    SELECT 'Rol cambiado exitosamente' as mensaje;
  ELSE
    SELECT 'Error: Usuario o rol no encontrado' as mensaje;
  END IF;
END //
DELIMITER ;

-- 13. Crear trigger para actualizar última actividad
DELIMITER //
CREATE TRIGGER `tr_actualizar_ultima_actividad`
BEFORE UPDATE ON `clientes`
FOR EACH ROW
BEGIN
  SET NEW.ultima_actividad = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- 14. Crear índice compuesto para búsquedas eficientes
CREATE INDEX `idx_cliente_rol_estado` ON `clientes` (`rol_id`, `estado`, `fecha_creacion`);

-- 15. Comentarios finales
-- Esta estructura permite:
-- * Diferenciar entre clientes y administradores
-- * Mantener la compatibilidad con el código existente
-- * Escalar fácilmente para nuevos roles
-- * Auditoría completa de actividades
-- * Gestión granular de permisos
-- * Consultas optimizadas mediante vistas

-- =====================================================
-- FIN DE MODIFICACIONES
-- =====================================================
