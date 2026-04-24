# Dev Infrastructure

Este proyecto contiene la configuración de Docker Compose para una infraestructura de desarrollo local. Proporciona bases de datos y herramientas comunes necesarias para el desarrollo.

## Requisitos
- Docker
- Docker Compose

## Servicios Incluidos

| Servicio | Descripción | Puertos | Credenciales por defecto |
|---|---|---|---|
| PostgreSQL | Base de datos relacional (v15) | 5432 | User: `devuser`, Pass: `devpassword`, DB: `devdb` |
| MySQL | Base de datos relacional (v8.0) | 3306 | User: `devuser`/`root`, Pass: `devpassword`, DB: `devdb` |
| Redis | Base de datos clave-valor en memoria (v7) | 6379 | (Sin contraseña por defecto) |
| MinIO | Almacenamiento de objetos S3 compatible | API: 9000, Consola: 9001 | User: `minioadmin`, Pass: `minioadmin` |
| Adminer | Cliente web para base de datos | 8080 | (Usar credenciales de BD) |

## Uso

1. Iniciar los servicios en segundo plano:
   ```bash
   docker-compose up -d
   ```

2. Detener los servicios:
   ```bash
   docker-compose down
   ```

3. Ver logs de un servicio (ej. postgres):
   ```bash
   docker-compose logs -f postgres
   ```

## Persistencia de Datos
Los datos de las bases de datos y MinIO se guardan localmente en el directorio `./data/`. Este directorio está ignorado en git mediante el `.gitignore`.
