# Dev Infrastructure

Este proyecto contiene la configuración de Docker Compose para una infraestructura de desarrollo local. Proporciona bases de datos y herramientas comunes necesarias para el desarrollo de aplicaciones modernas (microservicios, colas, bases de datos NoSQL, etc.).

> **ATENCIÓN: ALTO CONSUMO DE RECURSOS**
> No se recomienda levantar todos los servicios a la vez a menos que tu máquina cuente con abundante RAM (>16GB/32GB). Levanta solo los contenedores que necesites para tu tarea actual.

## Requisitos
- Docker
- Docker Compose

## Servicios Incluidos

### Bases de Datos y Almacenamiento
| Servicio | Descripción | Puertos | Credenciales / URLs |
|---|---|---|---|
| **PostgreSQL** | BD Relacional (v15) | 5432 | User: `devuser`, Pass: `devpassword`, DB: `devdb` |
| **MySQL** | BD Relacional (v8.0) | 3306 | User: `devuser`/`root`, Pass: `devpassword`, DB: `devdb` |
| **Redis** | BD Clave-Valor en memoria | 6379 | - |
| **MongoDB** | BD NoSQL Documentos | 27017 | User: `devuser`, Pass: `devpassword` |
| **Cassandra** | BD NoSQL Columnar | 9042 | - |
| **MinIO** | Almacenamiento S3 | API: 9000 | [Console: 9001](http://localhost:9001) (`minioadmin` / `minioadmin`) |
| **Adminer** | UI BDs Relacionales | - | [http://localhost:8080](http://localhost:8080) |
| **Mongo Express** | UI para MongoDB | - | [http://localhost:8081](http://localhost:8081) |

### Colas y Eventos (Message Brokers)
| Servicio | Descripción | Puertos | Credenciales / URLs |
|---|---|---|---|
| **RabbitMQ** | Colas de mensajes AMQP | 5672 | [UI: 15672](http://localhost:15672) (`devuser` / `devpassword`) |
| **Kafka** | Event Streaming (KRaft) | 9092 | - |

### Motores de Búsqueda
| Servicio | Descripción | Puertos | Credenciales / URLs |
|---|---|---|---|
| **Elasticsearch** | Motor de búsqueda potente | 9200 | (Seguridad deshabilitada para dev) |
| **Kibana** | UI para Elasticsearch | - | [http://localhost:5601](http://localhost:5601) |
| **Meilisearch** | Motor de búsqueda rápido/ligero | 7700 | Master Key: `devmasterkey` |

### Monitoreo y Observabilidad
| Servicio | Descripción | Puertos | Credenciales / URLs |
|---|---|---|---|
| **Prometheus** | Métricas | - | [http://localhost:9090](http://localhost:9090) |
| **Grafana** | Dashboards | - | [http://localhost:3000](http://localhost:3000) (User: `admin` / Pass: `admin`) |
| **Jaeger** | Trazabilidad distribuida | gRPC:4317 / HTTP:4318| [UI: 16686](http://localhost:16686) |

### Herramientas de Desarrollo y API
| Servicio | Descripción | Puertos | Credenciales / URLs |
|---|---|---|---|
| **Mailpit** | Pruebas de email (SMTP) | SMTP: 1025 | [UI: 8025](http://localhost:8025) |
| **Keycloak** | IAM (Identidad y SSO) | - | [http://localhost:8082](http://localhost:8082) (`admin` / `admin`) |
| **Traefik** | Reverse Proxy | 80 | [Dashboard: 8083](http://localhost:8083) |

## Uso

1. **Iniciar servicios específicos** (Recomendado):
   ```bash
   docker-compose up -d postgres redis mailpit
   ```

2. **Iniciar TODOS los servicios** (Solo si tienes mucha RAM):
   ```bash
   docker-compose up -d
   ```

3. **Detener servicios**:
   ```bash
   docker-compose down
   ```

## Persistencia de Datos
Los datos se guardan en `./data/`. Este directorio está ignorado en Git.
