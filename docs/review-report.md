# Code Review Report
**Date:** 2026-03-16
**Status:** PASS WITH NOTES

## Critical Issues (must fix)

1. **Hardcoded HMAC secret in source code.** `/Users/sjonas/nomad/admin/app/services/benchmark_service.ts:35` -- `BENCHMARK_HMAC_SECRET` is a static string committed to the repository. Even with the comment acknowledging this is open-source, this secret is shared across all NOMAD installations, making it trivial to spoof benchmark submissions. Move to an environment variable.

2. **CSRF protection is disabled.** `/Users/sjonas/nomad/admin/config/shield.ts:18` -- `csrf.enabled: false` with a TODO comment. All state-changing POST/PUT/DELETE endpoints are unprotected against cross-site request forgery. An attacker on the same LAN could craft a malicious page that triggers service installs, deletions, or system updates via the victim's browser.

3. **No authentication or authorization on any endpoint.** `/Users/sjonas/nomad/admin/start/routes.ts` -- Every API route is publicly accessible to anyone who can reach port 8080. This includes destructive operations: deleting files (`DELETE /api/zim/:filename`, `DELETE /api/maps/:filename`), managing Docker containers (`POST /api/system/services/affect`), triggering system updates (`POST /api/system/update`), and deleting all chat sessions (`DELETE /api/chat/sessions/all`). On a LAN deployment, any device on the network can perform administrative actions.

4. **Docker socket mounted into multiple containers without restriction.** `/Users/sjonas/nomad/install/management_compose.yaml:14,52,94` -- The Docker socket (`/var/run/docker.sock`) is mounted into admin, dozzle, and updater containers. The admin container effectively has root-level host access. Combined with the lack of authentication, a network attacker can create arbitrary Docker containers on the host.

5. **MySQL and Redis exposed on host ports without authentication.** `/Users/sjonas/nomad/install/management_compose.yaml:61,79` -- MySQL port 3306 and Redis port 6379 are bound to all interfaces. Redis has no password. Any device on the network can connect to the database and Redis directly. These ports should be restricted to Docker-internal networking only.

6. **Dozzle shell access exposed without authentication.** `/Users/sjonas/nomad/install/management_compose.yaml:53-54` -- `DOZZLE_ENABLE_SHELL=true` on port 9999 grants unauthenticated web-based shell access to any running container. This is effectively an unauthenticated remote code execution vector on the LAN.

## Warnings (should fix)

1. **CORS origin is wildcard `*` with credentials enabled.** `/Users/sjonas/nomad/admin/config/cors.ts:11-12` -- `origin: ['*']` combined with `credentials: true` is an insecure combination. Any website can make credentialed cross-origin requests to the NOMAD API.

2. **CSP and HSTS are disabled.** `/Users/sjonas/nomad/admin/config/shield.ts:9,38` -- Content Security Policy is off (`csp.enabled: false`) and HSTS is off (`hsts.enabled: false`), both with TODO comments. While NOMAD is offline-first and may not use HTTPS, CSP should still be configured to prevent XSS.

3. **`getSetting` endpoint reads unvalidated query parameter.** `/Users/sjonas/nomad/admin/app/controllers/settings_controller.ts:102` -- `request.qs().key` is cast directly to `KVStoreKey` without validation. While the underlying `KVStore.findBy` uses parameterized queries (safe from SQL injection), this allows reading any arbitrary key from the KV store, not just the allowed settings keys. Apply the same `vine.enum(SETTINGS_KEYS)` validation used by `updateSetting`.

4. **`getAvailableVersions` does not validate `params.name` input.** `/Users/sjonas/nomad/admin/app/controllers/system_controller.ts:122` -- The route parameter `name` is used directly in a database query without validation. While Lucid ORM parameterizes queries, this should still use a validator for defense in depth.

5. **`updateBuilderTag` manually validates input instead of using a validator.** `/Users/sjonas/nomad/admin/app/controllers/benchmark_controller.ts:194-231` -- Uses `request.input()` directly instead of a VineJS validator. This is inconsistent with the rest of the codebase and bypasses structured validation.

6. **`updateSettings` in BenchmarkController reads raw body without validation.** `/Users/sjonas/nomad/admin/app/controllers/benchmark_controller.ts:261` -- `request.body()` is read directly without a VineJS validator.

7. **Dependencies use caret ranges (`^`) instead of pinned versions.** `/Users/sjonas/nomad/admin/package.json` -- All 60+ dependencies use `^` ranges (e.g., `"axios": "^1.13.5"`), allowing minor/patch upgrades that could introduce regressions or vulnerabilities. Pin to exact versions for production stability.

8. **`console.log`/`console.error` used instead of structured logger in several files.** Found in `/Users/sjonas/nomad/admin/app/services/collection_manifest_service.ts:195,204,222,227`, `/Users/sjonas/nomad/admin/app/services/rag_service.ts:388`, `/Users/sjonas/nomad/admin/app/services/map_service.ts:72`, `/Users/sjonas/nomad/admin/app/jobs/run_download_job.ts:70,72,92,99`. Use AdonisJS `logger` consistently.

9. **RAG file deletion lacks path traversal protection.** `/Users/sjonas/nomad/admin/app/controllers/rag_controller.ts:69` and `/Users/sjonas/nomad/admin/app/services/rag_service.ts:975` -- The `deleteFileBySource` method accepts any source string and deletes the matching file from disk. The `deleteFileSchema` validator only checks that `source` is a string with no further constraints. Unlike the ZIM and map delete handlers, there is no `resolve()` + `startsWith()` path traversal check.

10. **Sidecar updater uses unsanitized `target_tag` in sed command.** `/Users/sjonas/nomad/install/sidecar-updater/update-watcher.sh:46` -- The `target_tag` variable (extracted via `jq` from a JSON file) is interpolated directly into a `sed` command. If the tag contains sed special characters or shell metacharacters, this could corrupt `compose.yml` or cause unexpected behavior. The tag should be validated/sanitized before use.

11. **`error.message` exposed to clients in multiple controllers.** Throughout system_controller.ts, rag_controller.ts, and benchmark_controller.ts, internal error messages are forwarded directly to the API response (e.g., `response.status(500).send({ error: error.message })`). This can leak internal paths, service names, or stack details.

12. **No rate limiting on any API endpoints.** All endpoints including chat, file upload, benchmark submission, and service management have no rate limiting, making them susceptible to abuse from any LAN client.

## Suggestions (nice to have)

1. **Add test coverage.** `/Users/sjonas/nomad/admin/tests/bootstrap.ts` is the only test file. There are zero test cases for any controller, service, or utility function. Priority targets: validators, path traversal guards in delete handlers, SSRF protection in `assertNotPrivateUrl`, and the version comparison logic.

2. **Add a CLAUDE.md to the project root.** No project-level CLAUDE.md exists for project-specific development instructions.

3. **Session middleware is commented out.** `/Users/sjonas/nomad/admin/start/kernel.ts:40` -- The session middleware import is commented out. If sessions are not needed, remove the `@adonisjs/session` dependency. If they are needed (e.g., for future auth), re-enable it.

4. **`exec` from `child_process` is imported but only used with hardcoded commands.** `/Users/sjonas/nomad/admin/app/services/docker_service.ts:10` -- While the current usage (`lspci | grep`) is safe since no user input is involved, consider removing the `exec` import and relying solely on the Docker API for GPU detection to reduce attack surface.

5. **Docker image base runs as root.** `/Users/sjonas/nomad/Dockerfile` -- The production container runs the Node.js process as root (no `USER` directive). Add a non-root user for defense in depth.

6. **`.env.example` contains a placeholder password `password`.** `/Users/sjonas/nomad/admin/.env.example:11` -- While this is just a template, it could lead to developers accidentally deploying with weak credentials.

7. **Dependabot only targets the `rc` branch.** `/Users/sjonas/nomad/.github/dependabot.yaml:7` -- Security updates should also target `main` to ensure timely patching.

8. **The `chat/:id` and `sessions/:id` routes parse `params.id` with `parseInt` without NaN checking.** `/Users/sjonas/nomad/admin/app/controllers/chats_controller.ts:32,67,80,91` -- If `params.id` is not numeric, `parseInt` returns `NaN`, which will cause the database query to fail with an unhelpful error. Use a validator or explicitly check for `NaN`.

9. **`writeStream.on('error', cleanup)` is registered twice.** `/Users/sjonas/nomad/admin/app/utils/downloads.ts:131-132` -- Duplicate error handler registration on the write stream.

10. **Consider adding `--force` to `node ace migration:run` only in CI/production.** `/Users/sjonas/nomad/install/entrypoint.sh:14` -- The `--force` flag bypasses the migration confirmation prompt, which is correct for production but should be documented as intentional.

## Metrics
- Files reviewed: 127 (115 TypeScript + 12 shell scripts)
- Test count: 0 (test bootstrap exists, no test cases)
- Ruff violations: N/A (not a Python project; ESLint is configured but not audited here)
- Security issues: 6 critical, 12 warning
