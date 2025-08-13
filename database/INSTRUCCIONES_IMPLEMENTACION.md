# INSTRUCCIONES PARA IMPLEMENTAR ROLES EN LA BASE DE DATOS

## 📋 Resumen de Cambios

Este archivo contiene las modificaciones necesarias para conectar la base de datos y permitir que tanto **clientes** como **administradores** usen la misma base de datos con roles diferenciados.

## 🚀 Pasos para Implementar

### 1. Acceder a phpMyAdmin
- Abrir phpMyAdmin en tu servidor local
- Seleccionar la base de datos `tonguetrek`

### 2. Ejecutar las Modificaciones
- Ir a la pestaña "SQL"
- Copiar y pegar TODO el contenido del archivo `modificaciones_roles.sql`
- Hacer clic en "Continuar" para ejecutar

### 3. Verificar la Implementación
Después de ejecutar, deberías ver:
- ✅ Nueva tabla `roles` creada
- ✅ Nueva tabla `sesiones_admin` creada
- ✅ Nueva tabla `logs_actividad` creada
- ✅ Nueva tabla `permisos_personalizados` creada
- ✅ Columna `rol_id` agregada a la tabla `clientes`
- ✅ Nuevas vistas creadas
- ✅ Procedimientos almacenados creados

## 🔧 Estructura de Roles Implementada

### Rol: Cliente (ID: 1)
- **Permisos básicos**: ver perfil, editar perfil, cambiar contraseña
- **Acceso**: Limitado a funcionalidades de cliente

### Rol: Administrador (ID: 2)
- **Permisos completos**: Todos los del cliente + gestión de clientes, roles, reportes y sistema
- **Acceso**: Completo a todas las funcionalidades

## 📊 Nuevas Tablas Creadas

| Tabla | Propósito |
|-------|-----------|
| `roles` | Define los roles disponibles en el sistema |
| `sesiones_admin` | Gestiona sesiones de administradores |
| `logs_actividad` | Registra todas las actividades del sistema |
| `permisos_personalizados` | Permisos granulares por rol |

## 🔗 Relaciones Establecidas

- **clientes** ↔ **roles** (cliente tiene un rol)
- **sesiones_admin** ↔ **clientes** (sesión pertenece a un admin)
- **logs_actividad** ↔ **clientes** y **roles** (log registra usuario y rol)
- **permisos_personalizados** ↔ **roles** (permisos específicos por rol)

## 📈 Vistas Útiles Creadas

- `v_usuarios_completos` - Todos los usuarios con información de rol
- `v_administradores` - Solo usuarios administradores
- `v_clientes` - Solo usuarios clientes

## ⚠️ Importante

1. **NO se modificó la lógica del backend existente**
2. **NO se modificó la lógica del frontend existente**
3. **Todos los clientes existentes se asignan automáticamente al rol "cliente"**
4. **La estructura es compatible con el código actual**

## 🔄 Para Asignar un Administrador

Después de implementar, para convertir un cliente en administrador:

```sql
-- Cambiar el rol de un usuario específico a administrador
UPDATE clientes SET rol_id = 2 WHERE id = [ID_DEL_USUARIO];

-- O usar el procedimiento almacenado
CALL CambiarRolUsuario([ID_USUARIO], 2, [ID_ADMIN_QUE_HACE_EL_CAMBIO]);
```

## 📝 Notas Técnicas

- **Compatibilidad**: MySQL 5.7+ y MariaDB 10.2+
- **Caracteres**: UTF8MB4 para soporte completo de Unicode
- **Motor**: InnoDB para transacciones y claves foráneas
- **Índices**: Optimizados para consultas por rol y estado

## 🎯 Beneficios de esta Implementación

1. **Escalabilidad**: Fácil agregar nuevos roles
2. **Seguridad**: Control granular de permisos
3. **Auditoría**: Log completo de todas las actividades
4. **Mantenimiento**: Estructura organizada y documentada
5. **Compatibilidad**: No rompe el código existente

## ❓ En Caso de Problemas

Si encuentras algún error durante la implementación:

1. Verificar que tienes permisos de administrador en la base de datos
2. Asegurarte de que la versión de MySQL sea compatible
3. Revisar que no haya conflictos con restricciones existentes
4. Hacer backup antes de ejecutar las modificaciones

---

**Fecha de creación**: 2025-01-27  
**Versión**: 1.0  
**Compatible con**: TongueTrek API v1.0
