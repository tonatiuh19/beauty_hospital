#!/usr/bin/env node
/**
 * Route Import Generator
 *
 * This script helps you generate import statements for route handlers.
 * Run this to see all available exports from route files.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, "../server/routes");

console.log("🚀 Beauty Hospital API - Route Import Generator\n");
console.log("Available route files and their exports:\n");

// Read all TypeScript files in the routes directory
const routeFiles = fs
  .readdirSync(routesDir)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .sort();

routeFiles.forEach((file) => {
  const filePath = path.join(routesDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Extract export statements
  const exportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
  const exports = [];
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  if (exports.length > 0) {
    const moduleName = file.replace(".ts", "");
    console.log(`📁 ${file}`);
    console.log(
      `   import { ${exports.join(", ")} } from "../server/routes/${moduleName}";`,
    );
    console.log("");
  }
});

console.log(
  "\n💡 Copy the import statements above and paste them in your api/index.ts file.",
);
console.log(
  "💡 Then add the corresponding route handlers to your Express app.",
);
console.log("\nExample usage:");
console.log('  expressApp.get("/api/demo", handleDemo);');
console.log('  expressApp.get("/api/services", handleGetServices);');
