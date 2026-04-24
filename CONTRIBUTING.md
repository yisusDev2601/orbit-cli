# Contributing to ORBIT

Thank you for your interest in contributing to **ORBIT**! 🪐

All contributions are welcome — from bug fixes and new features to documentation improvements and translations.

## Getting Started

1. **Fork** the repository and clone it locally.
2. Install dependencies:
   ```bash
   cd infra-cli
   npm install
   npm link   # Register the `orbit` command globally
   ```
3. Make your changes and test them by running `orbit`.
4. Submit a **Pull Request** against the `main` branch.

## Guidelines

- Keep commits small and focused. Use conventional commit messages:
  - `feat: add feature X`
  - `fix: resolve issue with Y`
  - `docs: update README`
  - `refactor: restructure menu Z`
- All new features should be placed in the appropriate file under `menus/` or `lib/`.
- Shared utilities belong in `lib/ui.js` or `lib/compose.js` — avoid duplicating logic.

## Reporting Issues

Please open a [GitHub Issue](../../issues) and include:
- Your OS (macOS, Linux, Windows/WSL2)
- Node.js and Docker versions (`node -v`, `docker --version`)
- Steps to reproduce the problem
- Expected vs actual behavior

## Adding New Services

To add a new Docker service to the infrastructure:
1. Add the service definition to `docker-compose.yml`.
2. If it has a web UI, register it in `lib/credentials.js` → `SERVICE_UIS`.
3. If it requires credentials, add them to `lib/credentials.js` → `CREDS`.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
