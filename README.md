<div align="center">
<img src="admin/public/project_nomad_logo.png" width="200" height="200"/>

# The Attic AI
### Offline AI Knowledge Platform

**Knowledge That Never Goes Offline**

</div>

---

The Attic AI is a self-contained, offline-first knowledge and AI server packed with critical tools, content, and local AI to keep you informed and empowered -- anytime, anywhere. Designed for enterprise, government, and field deployments where reliable offline access to information is mission-critical.

Built on the [Project N.O.M.A.D.](https://github.com/Crosstalk-Solutions/project-nomad) platform, The Attic AI extends it with hardware-aware model selection, download queue management, backup/restore, scenario-based content packs, and a hardened security layer.

## Installation

The Attic AI supports **Linux** (Debian-based, Ubuntu recommended) and **macOS** (Apple Silicon or Intel, with Docker Desktop).

### Prerequisites

| | Linux (Debian-based) | macOS |
|---|---|---|
| **Docker** | Installed automatically by the installer | [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) must be installed and running |
| **Privileges** | Requires `sudo` / root | No `sudo` required |
| **Install location** | `/opt/project-nomad` | `~/.nomad` |
| **GPU support** | NVIDIA with [Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) | Not available (CPU-only) |

### Linux (Debian-based)

```bash
sudo apt-get update && sudo apt-get install -y curl
curl -fsSL https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/install_nomad.sh -o install_nomad.sh
sudo bash install_nomad.sh
```

### macOS

1. **Install Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/) and make sure it's running (whale icon in menu bar).

2. **Run the installer:**

```bash
curl -fsSL https://raw.githubusercontent.com/Crosstalk-Solutions/project-nomad/refs/heads/main/install/install_nomad.sh -o install_nomad.sh
bash install_nomad.sh
```

The installer will:
- Verify Docker Desktop is installed and the daemon is running
- Detect your local IP address (tries `en0`/Wi-Fi, then `en1`/Ethernet, then `127.0.0.1`)
- Create `~/.nomad/` with subdirectories for storage, MySQL, and Redis data
- Download the Docker Compose configuration and helper scripts
- Generate random secrets for the database, Redis, and application key
- Pull and start all containers

3. **Open the admin panel** at `http://localhost:8080` and create your admin account.

### What Gets Installed

| Container | Image | Purpose |
|-----------|-------|---------|
| `admin` | `ghcr.io/crosstalk-solutions/project-nomad:latest` | Management UI and API |
| `mysql` | `mysql:8.0` | User data, settings, audit logs |
| `redis` | `redis:7-alpine` | Sessions, job queues, caching |
| `updater` | Built from sidecar Dockerfile | Watches for and applies updates |
| `disk-collector` | Sidecar image | Disk usage monitoring (Linux only) |

Port **8080** is the only port exposed to the host.

### Post-Install

After first launch, visit `http://localhost:8080` (or `http://<your-ip>:8080` from another device on the network):

1. **Create admin account** -- the first user becomes the admin
2. **Run the Easy Setup wizard** -- choose a scenario pack or manually select capabilities
3. **Install apps** -- enable the AI assistant, education platform, and other tools from Settings > Apps
4. **Download content** -- grab offline Wikipedia, maps, ZIM files, and AI models

## Features

### Core Platform

| Capability | Powered By | Description |
|-----------|-----------|-------------|
| AI Chat with Knowledge Base | Ollama + Qdrant | Local AI chat with document upload, OCR, and semantic search (RAG) |
| Information Library | Kiwix | Offline Wikipedia, medical references, survival guides, ebooks |
| Education Platform | Kolibri | Khan Academy courses with progress tracking |
| Offline Maps | ProtoMaps | Downloadable regional maps with search and navigation |
| Data Tools | CyberChef | Encryption, encoding, hashing, and data analysis |
| Notes | FlatNotes | Local note-taking with markdown support |
| System Benchmark | Built-in | Hardware scoring for CPU, memory, disk, and AI performance |

### Added by The Attic AI

| Feature | Description |
|---------|-------------|
| **Hardware-Aware Model Picker** | Shows which AI models fit your hardware. Each model tag categorized as Recommended / Will Run (Slow) / Too Large based on RAM and GPU VRAM. Toggle to hide incompatible models. |
| **Download Manager** | Bandwidth throttling (1/5/10/50 Mbps or unlimited), priority queue (models > maps > ZIM), 10x retries with exponential backoff, pause/resume, and a full management UI. |
| **Backup & Restore** | Export a JSON manifest of all installed content, settings, and users. Import on a fresh instance to re-download everything. Content files are not included (they can be 100GB+) -- just the list of what to download. |
| **Scenario Packs** | One-click content bundles for specific use cases. Each pack selects the right ZIM categories, maps, Wikipedia options, and AI models. |
| **Hardened Security** | CSP, HSTS, SSRF protection with DNS resolution, role-enforced mutation routes, file upload restrictions, path traversal guards, and input validation on all endpoints. |

### Scenario Packs

| Pack | Includes | ~Size |
|------|----------|-------|
| Medical Emergency | Medicine ZIMs, Pacific maps, small AI model | ~1 GB |
| Wilderness Survival | Survival + medicine + agriculture ZIMs, Pacific + mountain maps, 8B AI model | ~5 GB |
| Grid-Down Communications | Computing + DIY ZIMs, small AI model | ~0.5 GB |
| Remote Field Operations | All essential ZIM tiers, 3 map collections, mini Wikipedia, 8B AI model | ~18 GB |
| SCIF / Air-Gapped | All comprehensive ZIM tiers, all 9 map collections, full Wikipedia, 2 AI models | ~150 GB |

## Security

The Attic AI includes a defense-in-depth security layer:

- **Authentication** -- session-based login with remember-me, rate limiting (lockout after 5 failed attempts), and atomic initial setup (race-condition-proof)
- **Role-Based Access Control (RBAC)** -- three roles with a strict hierarchy:
  - **Viewer** -- browse content, chat, view maps and docs
  - **Operator** -- all viewer permissions plus content management, download queue control, service management, system settings
  - **Admin** -- full access including user management, audit logs, backup/restore
- **Content Security Policy (CSP)** -- strict directives blocking XSS; `unsafe-eval` only in development
- **HSTS** -- enforced in production deployments
- **CSRF Protection** -- on all state-changing requests
- **SSRF Protection** -- URL validation with DNS resolution to prevent rebinding attacks
- **Input Validation** -- VineJS validators on all endpoints; file upload type/size restrictions; path traversal guards
- **Audit Logging** -- all mutations logged with user, action, result, IP, and timestamp
- **Secure Defaults** -- MySQL and Redis not exposed to host network; Redis requires auth; secrets generated randomly at install

## Device Requirements

### Minimum (management UI + content browsing)
- 2 GHz dual-core processor
- 4 GB RAM
- 5 GB free disk space
- Debian-based Linux (Ubuntu recommended) or macOS 12+
- Docker (Linux) or Docker Desktop (macOS)
- Internet connection for initial install and content downloads only

### Recommended (with AI models and full content)
- AMD Ryzen 7 / Intel Core i7 / Apple Silicon M1 or better
- 32 GB RAM
- NVIDIA RTX 3060+ or equivalent (Linux only; macOS is CPU-only)
- 250 GB+ free SSD space
- Debian-based Linux or macOS 12+

## Platform Notes

### Linux
- Installs to `/opt/project-nomad`
- Requires sudo for installation and Docker management
- Full GPU passthrough support (NVIDIA with Container Toolkit)
- Disk usage monitoring via dedicated sidecar container
- Auto-start via systemd (if configured)

### macOS
- Installs to `~/.nomad`
- No sudo required (Docker Desktop handles permissions)
- GPU passthrough not available; AI models run CPU-only (Apple Silicon's unified memory still benefits larger models)
- Disk usage reported via system info fallback (no sidecar needed)
- Auto-start: relies on Docker Desktop's "Start Docker Desktop when you sign in" setting
- IP detection uses `ipconfig getifaddr en0` (Wi-Fi) or `en1` (Ethernet)

## Privacy

The Attic AI is designed for offline usage. An internet connection is only required during installation and when downloading content. The system has **zero built-in telemetry** -- no usage data, analytics, or tracking is collected or transmitted.

The only outbound network requests are:
- **Content downloads** (user-initiated)
- **Update checks** (GitHub API, cached)
- **Internet connectivity test** (`https://1.1.1.1/cdn-cgi/trace`, configurable via `INTERNET_STATUS_TEST_URL`)
- **Release notes subscription** (only if you explicitly enter your email)

## Helper Scripts

Once installed, helper scripts are available for maintenance. On Linux they're in `/opt/project-nomad`, on macOS in `~/.nomad`.

```bash
# Start all containers
# Linux: sudo bash /opt/project-nomad/start_nomad.sh
# macOS:
bash ~/.nomad/start_nomad.sh

# Stop all containers
# Linux: sudo bash /opt/project-nomad/stop_nomad.sh
# macOS:
bash ~/.nomad/stop_nomad.sh

# Update core containers (pulls latest images and recreates)
# Linux: sudo bash /opt/project-nomad/update_nomad.sh
# macOS:
bash ~/.nomad/update_nomad.sh
```

## Development

### Local Development Setup

```bash
# Clone the repo
git clone <repo-url> && cd nomad/admin

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your local database/Redis credentials

# Run database migrations
node ace migration:run

# Start dev server (with Vite HMR)
node ace serve --hmr
```

### Tech Stack
- **Backend:** AdonisJS 6, TypeScript, Lucid ORM, VineJS validation
- **Frontend:** React 19, Inertia.js, TanStack React Query, Tailwind CSS
- **Database:** MySQL 8
- **Queue:** BullMQ (Redis-backed)
- **Real-time:** Adonis Transmit (SSE)
- **AI:** Ollama JavaScript SDK
- **Containerization:** Docker Compose

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Feature branches off main
- Small, focused commits

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2024-2026 The Attic AI. Built on [Project N.O.M.A.D.](https://github.com/Crosstalk-Solutions/project-nomad) by Crosstalk Solutions, LLC.
