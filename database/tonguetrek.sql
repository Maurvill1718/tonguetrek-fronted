-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 05-07-2025 a las 06:48:46
-- Versión del servidor: 5.7.33
-- Versión de PHP: 7.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tonguetrek`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `intentos_fallidos` int(11) DEFAULT '0',
  `intentos_preguntas_fallidos` int(11) NOT NULL DEFAULT '0',
  `estado` enum('activo','inactiva','bloqueado_login','bloqueado_preguntas') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `documento`, `nombre`, `correo`, `telefono`, `contrasena`, `intentos_fallidos`, `intentos_preguntas_fallidos`, `estado`) VALUES
(20, '54258618', 'Esther Calderon', 'calester2016@gmail.com', '3123456789', '$2b$10$vlcH9BHv/mMnInSBpwlu8ufaWCKA.wfWMM9Ky9u4uCrwPlPV8Opgm', 0, 0, 'activo'),
(21, '1035123556', 'Sebastian benitez', 'sebastianjey@gmail.com', '3011234567', '$2b$10$Hcbc5ePWm44Lt2vsTHu5rOSL7xaJ5cEnjF6IrhF0o53aa5uUgHjRO', 0, 0, 'inactiva'),
(24, '1030405060', 'Mauricio Villegas (Demo)', 'mauriciovill018@gmail.com', '3123456789', '$2b$10$DTfFLDGQXeRrsfdW8ig7yOlOfdCfyHDwo5oOfp.Y.LJktegG480ee', 0, 2, 'activo'),
(25, '60708090', 'Andrés (Prueba de Error)', 'mauricaldeville2016@gmail.com', '3151234567', '$2b$10$fL20CUWCq/gjIek/UMpdoO0Wcyse/vzI/sCKE4M7xXH.Gy8QLjOwC', 0, 3, 'bloqueado_preguntas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfil`
--

CREATE TABLE `perfil` (
  `idPerfil` int(11) NOT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `documento` varchar(10) NOT NULL,
  `respuesta1` varchar(255) DEFAULT NULL,
  `respuesta2` varchar(255) DEFAULT NULL,
  `respuesta3` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `fechaexpedicion` varchar(30) DEFAULT NULL,
  `pregunta1` varchar(255) DEFAULT NULL,
  `pregunta2` varchar(255) DEFAULT NULL,
  `pregunta3` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `perfil`
--

INSERT INTO `perfil` (`idPerfil`, `cliente_id`, `documento`, `respuesta1`, `respuesta2`, `respuesta3`, `direccion`, `fechaexpedicion`, `pregunta1`, `pregunta2`, `pregunta3`) VALUES
(3, 24, '1030405060', '$2b$10$E6zr5Dc5BBeSB09gKCVxDOvewTY1qgy0gOTOFKcMvGTCavKs77Az6', '$2b$10$kz9pMgYqhL3n1h34kWtlIe8d1eEZzR.3jvPVbend0mTOtW/b0P5wu', '$2b$10$gZjgArLgNw.U6ghwwzz62OxTVCvq56ZW1t1wVFz4/wQFm2PjnoUxy', 'Universidad de Antioquia', '2020-10-10', 'Color favorito', 'Segundo nombre', 'Equipo de futbol'),
(4, 25, '60708090', '$2b$10$NeeN0z3jBRU9o35novH0AOc6tFYVsYmzuemKBaN3RsryInXUC/hb6', '$2b$10$HPfuh6zjN7LHwnoZGN5Ez.iTTieK4PETHkGTYr0msN.KzSLdqmH3u', '$2b$10$k/ZW5WqhzBdbT1cVkn.68.3S8onIhoUugyeb51r9XbZv.rL2Nq2KW', 'Calle de los Errores 123', '2018-01-01', 'Color favorito', 'Segundo apellido', 'Primer colegio');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `token` text NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` timestamp NOT NULL,
  `estado` enum('activo','revocado') DEFAULT 'activo',
  `tipo` enum('acceso','reseteo') NOT NULL DEFAULT 'acceso'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Volcado de datos para la tabla `tokens`
--

INSERT INTO `tokens` (`id`, `documento`, `token`, `fecha_creacion`, `fecha_expiracion`, `estado`, `tipo`) VALUES
(1, '1030405060', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsImNvcnJlbyI6Im1hdXJpY2lvdmlsbDAxOEBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDMwNDA1MDYwIiwiaWF0IjoxNzUxNDA1ODE3LCJleHAiOjE3NTE0MDk0MTd9.R10i75OGYzhKhSPDzngzi3_cMHjCkOlTzh52eePoqSk', '2025-07-01 21:36:57', '2025-07-01 22:36:57', 'activo', 'acceso'),
(2, '1035123556', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImNvcnJlbyI6InNlYmFzdGlhbmpleUBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDM1MTIzNTU2IiwiaWF0IjoxNzUxNDYxNzI0LCJleHAiOjE3NTE0NjUzMjR9.FWSRHiFNE6Aa13BWErsE6ySAkMcxbBQddf0CQP0QLQA', '2025-07-02 13:08:44', '2025-07-02 14:08:44', 'revocado', 'acceso'),
(3, '1035123556', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjEsImNvcnJlbyI6InNlYmFzdGlhbmpleUBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDM1MTIzNTU2IiwiaWF0IjoxNzUxNDYxNzU5LCJleHAiOjE3NTE0NjUzNTl9.0BMaMw35lexllgrFfvaCvEdq3LxkzZymgk6jeNrqIuA', '2025-07-02 13:09:19', '2025-07-02 14:09:19', 'revocado', 'acceso'),
(4, '1030405060', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsImNvcnJlbyI6Im1hdXJpY2lvdmlsbDAxOEBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDMwNDA1MDYwIiwiaWF0IjoxNzUxNjc4ODYzLCJleHAiOjE3NTE2ODI0NjN9.zyscanAb_pZiB7eU8kYlNTr61qyCSAOU-j9ptrwMz0c', '2025-07-05 01:27:43', '2025-07-05 02:27:43', 'activo', 'acceso'),
(5, '1030405060', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjMsImNvcnJlbyI6Im1hdXJpY2lvdmlsbDAxOEBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDMwNDA1MDYwIiwiaWF0IjoxNzUxNjkzOTExLCJleHAiOjE3NTE2OTc1MTF9.9IJ42oIwYXuPrRKamAz-PkAMy5Yc318WwZk1DuL-JCY', '2025-07-05 05:38:31', '2025-07-05 06:38:31', 'activo', 'acceso'),
(6, '1030405060', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsImNvcnJlbyI6Im1hdXJpY2lvdmlsbDAxOEBnbWFpbC5jb20iLCJkb2N1bWVudG8iOiIxMDMwNDA1MDYwIiwiaWF0IjoxNzUxNjk0NTE3LCJleHAiOjE3NTE2OTgxMTd9.9mZ2yYBscBtH6yBiKO_riFDvKdHlGqHuVdrFUdteWao', '2025-07-05 05:48:37', '2025-07-05 06:48:37', 'activo', 'acceso'),
(7, '1030405060', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsInB1cnBvc2UiOiJwYXNzd29yZC1yZXNldCIsImlhdCI6MTc1MTY5NDg2NiwiZXhwIjoxNzUxNjk1MTY2fQ.HG9jdYZSvjedehg6Z-C9ub7Xyldzbq37GtU7YLNb8_I', '2025-07-05 05:54:26', '2025-07-05 05:59:26', 'activo', 'reseteo'),
(8, '60708090', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjUsImNvcnJlbyI6Im1hdXJpY2FsZGV2aWxsZTIwMTZAZ21haWwuY29tIiwiZG9jdW1lbnRvIjoiNjA3MDgwOTAiLCJpYXQiOjE3NTE2OTU0MDksImV4cCI6MTc1MTY5OTAwOX0.LWP60iKGinVdU8SKDp_Vy-y3Oclc0LaVKHSG-sHh9_o', '2025-07-05 06:03:29', '2025-07-05 07:03:29', 'activo', 'acceso');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento` (`documento`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `perfil`
--
ALTER TABLE `perfil`
  ADD PRIMARY KEY (`idPerfil`),
  ADD KEY `fk_perfil_cliente` (`cliente_id`);

--
-- Indices de la tabla `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `perfil`
--
ALTER TABLE `perfil`
  MODIFY `idPerfil` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `perfil`
--
ALTER TABLE `perfil`
  ADD CONSTRAINT `fk_perfil_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
