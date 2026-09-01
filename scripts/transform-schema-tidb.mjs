/**
 * phpMyAdmin dumps CREATE tables without AUTO_INCREMENT, then ALTER MODIFY
 * the id column later. TiDB rejects that ALTER (error 8200). This rewrite
 * puts AUTO_INCREMENT + PRIMARY KEY on CREATE TABLE and converts leftover
 * MODIFY AUTO_INCREMENT into table-level AUTO_INCREMENT = N.
 */
import fs from "fs";

const input = process.argv[2] || "database/schema.sql";
const output = process.argv[3] || "/tmp/beauty_hospital_schema_tidb.sql";

let sql = fs.readFileSync(input, "utf8");

sql = sql.replace(
  /CREATE TABLE `([^`]+)` \(\n  `id` int\(11\) NOT NULL,/g,
  "CREATE TABLE `$1` (\n  `id` int(11) NOT NULL AUTO_INCREMENT,",
);

sql = sql.replace(
  /(\n)(\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;)/g,
  ",\n  PRIMARY KEY (`id`)$1$2",
);

sql = sql.replace(/^\s*ADD PRIMARY KEY \(`id`\),?\n/gm, "");

sql = sql.replace(
  /ALTER TABLE `([^`]+)`\n  MODIFY `id` int\(11\) NOT NULL AUTO_INCREMENT(?:, AUTO_INCREMENT=(\d+))?;/g,
  (_m, table, n) =>
    n
      ? `ALTER TABLE \`${table}\` AUTO_INCREMENT = ${n};`
      : `ALTER TABLE \`${table}\` AUTO_INCREMENT = 1;`,
);

fs.writeFileSync(output, sql);
console.log(`Wrote TiDB-compatible dump → ${output}`);
