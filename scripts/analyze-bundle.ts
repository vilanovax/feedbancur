#!/usr/bin/env npx tsx
/**
 * Bundle Analysis Script
 * Analyzes the Next.js build output to identify large dependencies and chunks
 */

import * as fs from "fs";
import * as path from "path";

const NEXT_DIR = path.join(process.cwd(), ".next");
const CHUNKS_DIR = path.join(NEXT_DIR, "static", "chunks");

interface ChunkInfo {
  name: string;
  size: number;
  sizeFormatted: string;
}

interface DependencySize {
  name: string;
  size: number;
  sizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getChunkSizes(): ChunkInfo[] {
  if (!fs.existsSync(CHUNKS_DIR)) {
    console.error("Build directory not found. Run 'npm run build' first.");
    process.exit(1);
  }

  const files = fs.readdirSync(CHUNKS_DIR);
  const chunks: ChunkInfo[] = [];

  for (const file of files) {
    if (file.endsWith(".js")) {
      const filePath = path.join(CHUNKS_DIR, file);
      const stats = fs.statSync(filePath);
      chunks.push({
        name: file,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
      });
    }
  }

  return chunks.sort((a, b) => b.size - a.size);
}

function analyzeDependencies(): DependencySize[] {
  const nodeModulesDir = path.join(process.cwd(), "node_modules");
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const sizes: DependencySize[] = [];

  for (const dep of Object.keys(dependencies)) {
    const depPath = path.join(nodeModulesDir, dep);
    if (fs.existsSync(depPath)) {
      const size = getDirSize(depPath);
      sizes.push({
        name: dep,
        size,
        sizeFormatted: formatBytes(size),
      });
    }
  }

  return sizes.sort((a, b) => b.size - a.size);
}

function getDirSize(dirPath: string): number {
  let size = 0;

  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch {
    // Ignore permission errors
  }

  return size;
}

function getTotalBundleSize(): { client: number; server: number; total: number } {
  let clientSize = 0;
  let serverSize = 0;

  const staticDir = path.join(NEXT_DIR, "static");
  const serverDir = path.join(NEXT_DIR, "server");

  if (fs.existsSync(staticDir)) {
    clientSize = getDirSize(staticDir);
  }

  if (fs.existsSync(serverDir)) {
    serverSize = getDirSize(serverDir);
  }

  return {
    client: clientSize,
    server: serverSize,
    total: clientSize + serverSize,
  };
}

console.log("\n📊 Bundle Analysis Report\n");
console.log("=".repeat(60));

// Total sizes
const totalSizes = getTotalBundleSize();
console.log("\n📦 Total Bundle Sizes:");
console.log(`   Client (static):  ${formatBytes(totalSizes.client)}`);
console.log(`   Server:           ${formatBytes(totalSizes.server)}`);
console.log(`   Total:            ${formatBytes(totalSizes.total)}`);

// Largest chunks
console.log("\n📁 Top 15 Largest Chunks:");
console.log("-".repeat(60));
const chunks = getChunkSizes();
chunks.slice(0, 15).forEach((chunk, i) => {
  const bar = "█".repeat(Math.ceil(chunk.size / 50000));
  console.log(`   ${(i + 1).toString().padStart(2)}. ${chunk.sizeFormatted.padStart(10)} │ ${bar}`);
  console.log(`       ${chunk.name}`);
});

// Largest dependencies
console.log("\n📚 Top 15 Largest Dependencies (node_modules):");
console.log("-".repeat(60));
const deps = analyzeDependencies();
deps.slice(0, 15).forEach((dep, i) => {
  console.log(`   ${(i + 1).toString().padStart(2)}. ${dep.sizeFormatted.padStart(10)} │ ${dep.name}`);
});

// Recommendations
console.log("\n💡 Optimization Recommendations:");
console.log("-".repeat(60));

const heavyDeps = deps.filter((d) => d.size > 1024 * 1024); // > 1MB
if (heavyDeps.length > 0) {
  console.log("\n   Heavy dependencies to consider optimizing:");
  heavyDeps.forEach((dep) => {
    console.log(`   - ${dep.name} (${dep.sizeFormatted})`);

    // Specific recommendations
    if (dep.name === "recharts") {
      console.log("     → Consider using lightweight alternative like Chart.js or import specific components");
    }
    if (dep.name === "date-fns") {
      console.log("     → Already using date-fns (tree-shakeable) - good choice!");
    }
    if (dep.name === "lucide-react") {
      console.log("     → Import icons individually: import { Icon } from 'lucide-react'");
    }
    if (dep.name.includes("prisma")) {
      console.log("     → Prisma is server-only, ensure it's not bundled in client");
    }
  });
}

const largeChunks = chunks.filter((c) => c.size > 200 * 1024); // > 200KB
if (largeChunks.length > 0) {
  console.log("\n   Large chunks that may need code splitting:");
  largeChunks.forEach((chunk) => {
    console.log(`   - ${chunk.name} (${chunk.sizeFormatted})`);
  });
}

console.log("\n" + "=".repeat(60));
console.log("Run 'npm run analyze' to open interactive bundle visualizer\n");
