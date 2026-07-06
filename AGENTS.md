# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the application code.
  - `src/index.ts` boots the Express server.
  - `src/routes/` defines HTTP routes.
  - `src/controllers/` handles request/response logic.
  - `src/services/` contains query and database logic.
  - `src/db/` holds the Drizzle database connection and schema.
- `scripts/` contains one-off data ingestion scripts for Coppermind WoBs.
- `private-docs/` holds project notes and workflow docs; read these before changing ingestion or query behavior.

## Build, Test, and Development Commands
- `pnpm dev` runs the API in watch mode with `tsx`.
- `pnpm build` type-checks the project with `tsc`.
- `pnpm start` runs the compiled server from `dist/`.
- `pnpm lint` runs ESLint over `src/`.
- `pnpm format` formats TypeScript files in `src/` with Prettier.

## Coding Style & Naming Conventions
- Use TypeScript with ES modules and `strict` mode expectations.
- Prefer small, focused modules: HTTP behavior in controllers, business/query logic in services.
- Use `camelCase` for variables/functions, `PascalCase` only for types/interfaces if needed, and lowercase route paths such as `/wobs/search`.
- Keep indentation consistent with the existing codebase (2 spaces).
- Follow the lint/format toolchain already in the repo: ESLint + Prettier.

## Testing Guidelines
- No automated test framework is configured yet.
- Before merging changes, verify manually with `pnpm build` and `pnpm lint`.
- If you add tests later, keep them close to the feature they validate and document the new command in `package.json`.

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commits, for example: `feat: add search and random wob features`.
- Keep commit messages short, imperative, and scoped to one change.
- Pull requests should describe the behavior change, mention any DB/schema impact, and include example requests or screenshots when relevant.
- Call out changes to ingestion flows, query rules, or environment variables explicitly so reviewers can assess data impact.

## Security & Configuration Tips
- Configure `DATABASE_URL` in the environment before running the app or scripts.
- Do not commit local secrets or generated database artifacts.
- Review `private-docs/` before editing Coppermind ingestion, tag handling, or search semantics.
