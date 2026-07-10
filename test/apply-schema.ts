import { env } from "cloudflare:test";

// D1's env.DB.exec() expects one statement per line, which breaks on
// schema.sql's multi-line CREATE TABLE blocks -- so split on ';' and run
// each statement individually instead. Runs before every test file
// (isolated storage per file) so each file starts from the real schema.
// ponytail: naive split, correct only because schema.sql today has no string
// literals or trigger bodies containing ';'. Upgrade to a string/BEGIN...END
// -aware splitter (or env.DB.exec() if it starts supporting real multi-statement
// input) if schema.sql ever grows either.
const schemaSql = (env as unknown as { SCHEMA_SQL: string }).SCHEMA_SQL;
const statements = schemaSql
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await env.DB.prepare(statement).run();
}
