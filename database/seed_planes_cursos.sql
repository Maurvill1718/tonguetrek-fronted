-- --------------------------------------------------------
-- Seed de planes A1..C1 y cursos asociados
-- Ejecutar en bd `tonguetrek` tras crear tablas planes/cursos/planes_cursos
-- --------------------------------------------------------

START TRANSACTION;

-- Planes (niveles CEFR)
INSERT INTO `planes` (`nombre`, `descripcion`, `beneficios`, `precio`, `estado`)
VALUES 
('Plan A1', 'Nivel principiante', 'Acceso a contenidos A1', 80000.00, 'activo'),
('Plan A2', 'Nivel básico', 'Acceso a contenidos A1-A2', 90000.00, 'activo'),
('Plan B1', 'Nivel intermedio', 'Acceso a contenidos A1-B1', 120000.00, 'activo'),
('Plan B2', 'Intermedio alto', 'Acceso a contenidos A1-B2', 150000.00, 'activo'),
('Plan C1', 'Avanzado', 'Acceso a contenidos A1-C1', 200000.00, 'activo');

-- Cursos (ejemplo)
INSERT INTO `cursos` (`nombreCurso`, `descripcion`, `duracion`, `estado`) VALUES
('Inglés A1', 'Fundamentos del idioma', '8 semanas', 'activo'),
('Inglés A2', 'Vocabulario y estructuras básicas', '8 semanas', 'activo'),
('Inglés B1', 'Comunicación cotidiana', '10 semanas', 'activo'),
('Inglés B2', 'Fluidez y comprensión avanzada', '12 semanas', 'activo'),
('Inglés C1', 'Competencia profesional', '14 semanas', 'activo');

-- Vincular planes con cursos (ejemplo progresivo)
-- Nota: Asume ids consecutivos empezando en 1 para planes y cursos recién insertados
INSERT INTO `planes_cursos` (`idPlan`, `idCurso`) VALUES
-- Plan A1 -> A1
(1, 1),
-- Plan A2 -> A1-A2
(2, 1), (2, 2),
-- Plan B1 -> A1-B1
(3, 1), (3, 2), (3, 3),
-- Plan B2 -> A1-B2
(4, 1), (4, 2), (4, 3), (4, 4),
-- Plan C1 -> A1-C1
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5);

COMMIT;


