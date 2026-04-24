<p align="center">
  <img src="assets/orbit-banner.png" alt="ORBIT — Dev Infrastructure CLI" width="800"/>
</p>

<p align="center">
  <img src="assets/orbit-icon.png" alt="ORBIT icon" width="80"/>
  &nbsp;&nbsp;
  <strong>ORBIT</strong> &nbsp;·&nbsp; Dev Infrastructure CLI
</p>

<p align="center">
  Manage your entire development infrastructure — Docker services, databases, queues,<br/>
  search engines, monitoring and dev tools — from a single interactive command.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/command-orbit-6C63FF?style=for-the-badge&logo=terminal&logoColor=white" alt="command: orbit"/>
  <img src="https://img.shields.io/badge/Node.js-18%2B-00D4FF?style=for-the-badge&logo=node.js&logoColor=white" alt="Node 18+"/>
  <img src="https://img.shields.io/badge/Docker-24%2B-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker 24+"/>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-555?style=for-the-badge" alt="platforms"/>
</p>

---


## 📋 Tabla de Contenidos

- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Herramienta CLI (`infra`)](#-herramienta-cli-infra)
- [Servicios Incluidos](#-servicios-incluidos)
- [Conectar tus Apps](#-conectar-tus-apps)
- [Uso Manual con Docker Compose](#-uso-manual-con-docker-compose)
- [Persistencia de Datos](#-persistencia-de-datos)

---

## ⚠️ Advertencia de Recursos

No se recomienda levantar todos los servicios a la vez. Herramientas como Elasticsearch, Kafka y Cassandra son muy pesadas en memoria. Utiliza la CLI para seleccionar solo los que necesitas.

| Recomendación | RAM mínima |
|---|---|
| Servicios básicos (Postgres, Redis, MinIO) | 4 GB |
| Stack completo (con Elastic, Kafka, etc.) | 16 GB+ |

---

## 📦 Requisitos

### Obligatorios
| Herramienta | Versión mínima | Instalación |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24.x+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| [Node.js](https://nodejs.org/) | 18.x+ | [nodejs.org](https://nodejs.org/en/download) |
| [npm](https://npmjs.com/) | 9.x+ | Incluido con Node.js |
| Git | 2.x+ | [git-scm.com](https://git-scm.com/) |

### Por sistema operativo

**macOS**
```bash
# Con Homebrew
brew install node git
# Docker Desktop: descargar desde docker.com
```

**Linux (Debian/Ubuntu)**
```bash
# Node.js (via nvm — recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**Windows**
```powershell
# Con winget
winget install OpenJS.NodeJS
winget install Git.Git
# Docker Desktop: descargar desde docker.com
# Recomendado: usar WSL2 (Windows Subsystem for Linux)
```

> **Windows:** La CLI y todos los scripts están diseñados para `bash`/`zsh`. En Windows se recomienda usar **WSL2** con Ubuntu para la mejor experiencia. Docker Desktop tiene integración nativa con WSL2.

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio> infra-dev
cd infra-dev
```

### 2. Instalar la CLI

```bash
cd infra-cli
npm install
npm link        # Registra el comando global 'infra'
cd ..
```

### 3. Verificar instalación

```bash
infra
```

Si todo está correcto, verás el banner de **INFRA CLI** con el menú principal.

---

## 🛠️ Herramienta CLI (`orbit`)

La herramienta central del proyecto. Se ejecuta desde cualquier directorio de tu terminal.

```bash
orbit
```

### Funcionalidades

#### 🐳 Docker Infra
| Opción | Descripción |
|---|---|
| Ver estado general | Dashboard con estado, puertos y uptime de todos los servicios |
| Iniciar servicios | Selección múltiple con checkboxes — arranca solo lo que necesitas |
| Detener todos | Apaga toda la infraestructura |
| Gestionar servicio | Por servicio: Logs, Stats, Variables de entorno, Credenciales, Hard Reset, Abrir UI |
| Auto-Inicio (Boot) | Configura qué servicios arrancan automáticamente al encender tu computadora |
| Conectar mis apps | Guía con código exacto para conectar apps NestJS/Next.js a la red interna |

#### 🛠️ Dev Tools
| Opción | Descripción |
|---|---|
| Port Killer | Detecta qué proceso tiene secuestrado un puerto y lo mata |
| Doctor | Muestra versiones de Node, npm, Git, Docker y tu IP local de red |
| Cheat Sheet | Soluciones rápidas a problemas comunes de desarrollo |

#### 📈 System Health
| Opción | Descripción |
|---|---|
| RAM y CPU | Memoria disponible con barra de uso visual |
| Espacio Docker | Imágenes, volúmenes y caché de builds |
| Prune | Limpia la caché de Docker y libera espacio en disco |

### Atajos de teclado en la CLI

| Tecla | Acción |
|---|---|
| `↑` / `↓` | Moverse entre opciones |
| `Enter` | Seleccionar / Confirmar |
| `Espacio` | Marcar/desmarcar en listas de selección múltiple |
| `Ctrl+C` | Cancelar / Salir en cualquier momento |

### Reinstalar la CLI

Si el comando `infra` deja de funcionar después de actualizar el repositorio:

```bash
cd infra-cli
npm install     # Actualizar dependencias si cambiaron
npm link        # Volver a registrar el comando global
```

### Notas por sistema operativo

**macOS / Linux**: Funciona de manera nativa. `npm link` crea el symlink en `/usr/local/bin/infra` o `~/.nvm/versions/node/.../bin/infra`.

**Windows (WSL2)**: Ejecutar todo desde la terminal de WSL2. El comando `infra` quedará disponible dentro del entorno WSL.

**Windows (PowerShell / CMD)**: Funcional con limitaciones — los colores ANSI requieren Windows Terminal. Algunas funciones como Port Killer usan `lsof` que no existe en Windows nativo (sí en WSL2).

---

## 🗄️ Servicios Incluidos

### Bases de Datos y Almacenamiento

| Servicio | Descripción | Puerto | UI / Credenciales |
|---|---|---|---|
| **PostgreSQL** 15 | BD Relacional | 5432 | User: `devuser` · Pass: `devpassword` · DB: `devdb` |
| **MySQL** 8.0 | BD Relacional | 3306 | User: `devuser` · Pass: `devpassword` · DB: `devdb` |
| **Redis** 7 | Caché / Colas | 6379 | — |
| **MongoDB** 6 | BD Documentos | 27017 | User: `devuser` · Pass: `devpassword` |
| **Cassandra** 4 | BD Columnar | 9042 | — |
| **MinIO** | Almacenamiento S3 | API: 9000 | [localhost:9001](http://localhost:9001) · `minioadmin` / `minioadmin` |
| **Adminer** | UI BDs Relacionales | 8080 | [localhost:8080](http://localhost:8080) |
| **Mongo Express** | UI para MongoDB | 8081 | [localhost:8081](http://localhost:8081) |

### Colas y Eventos

| Servicio | Descripción | Puerto | UI |
|---|---|---|---|
| **RabbitMQ** 3 | Message Broker AMQP | 5672 | [localhost:15672](http://localhost:15672) · `devuser` / `devpassword` |
| **Kafka** 3.5 | Event Streaming (KRaft) | 9092 | — |

### Motores de Búsqueda

| Servicio | Descripción | Puerto | Notas |
|---|---|---|---|
| **Elasticsearch** 8.9 | Motor de búsqueda | 9200 | Seguridad deshabilitada para dev |
| **Kibana** 8.9 | UI Elasticsearch | 5601 | [localhost:5601](http://localhost:5601) |
| **Meilisearch** v1.4 | Búsqueda rápida | 7700 | Master Key: `devmasterkey` |

### Monitoreo y Observabilidad

| Servicio | Descripción | Puerto | UI |
|---|---|---|---|
| **Prometheus** | Métricas | 9090 | [localhost:9090](http://localhost:9090) |
| **Grafana** | Dashboards | 3000 | [localhost:3000](http://localhost:3000) · `admin` / `admin` |
| **Jaeger** | Trazabilidad | gRPC: 4317 | [localhost:16686](http://localhost:16686) |

### Herramientas de Desarrollo

| Servicio | Descripción | Puertos | UI |
|---|---|---|---|
| **Mailpit** | Captura de emails SMTP | SMTP: 1025 | [localhost:8025](http://localhost:8025) |
| **Keycloak** 22 | IAM / SSO | 8082 | [localhost:8082](http://localhost:8082) · `admin` / `admin` |
| **Traefik** v2.10 | Reverse Proxy | 80 | [localhost:8083](http://localhost:8083) |

---

## 🔗 Conectar tus Apps

### App corriendo en tu Mac (sin Docker)

Usa `localhost` y el puerto del servicio:

```env
# .env de tu proyecto NestJS / Next.js / etc.
DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/devdb"
REDIS_URL="redis://localhost:6379"
MONGO_URI="mongodb://devuser:devpassword@localhost:27017/"
SMTP_HOST="localhost"
SMTP_PORT=1025
```

### App dockerizada (en la misma red)

Añade este bloque al final del `docker-compose.yml` de **tu app**:

```yaml
networks:
  default:
    name: infra_dev_network
    external: true
```

Luego usa el nombre del servicio como host:

```env
DATABASE_URL="postgresql://devuser:devpassword@postgres:5432/devdb"
REDIS_URL="redis://redis:6379"
MONGO_URI="mongodb://devuser:devpassword@mongodb:27017/"
SMTP_HOST="mailpit"
SMTP_PORT=1025
```

> La CLI (`infra`) tiene una opción "🔗 Conectar mis apps" que muestra este código listo para copiar.

---

## ⚡ Uso Manual con Docker Compose

```bash
# Iniciar servicios específicos (recomendado)
docker compose up -d postgres redis mailpit

# Ver estado
docker compose ps

# Ver logs de un servicio
docker compose logs -f postgres

# Detener todo
docker compose down
```

---

## 💾 Persistencia de Datos

Los datos de cada servicio se guardan localmente en `./data/<servicio>/`. Esta carpeta está en `.gitignore` y **nunca se sube al repositorio**.

```
data/
├── postgres/
├── mysql/
├── redis/
├── mongo/
├── minio/
└── ...
```

Para borrar los datos de un servicio y empezar limpio, usa la opción **"💣 Hard Reset"** en la CLI o manualmente:

```bash
docker compose stop postgres
docker compose rm -f postgres
rm -rf ./data/postgres
docker compose up -d postgres
```
