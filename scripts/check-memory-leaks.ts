#!/usr/bin/env npx tsx
/**
 * Memory Leak Pattern Detection Script
 * Scans React components for common memory leak patterns
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface LeakPattern {
  file: string;
  line: number;
  pattern: string;
  severity: "high" | "medium" | "low";
  suggestion: string;
}

const patterns = [
  {
    // setInterval without cleanup
    regex: /setInterval\s*\([^)]+\)/g,
    checkCleanup: /clearInterval/,
    pattern: "setInterval without clearInterval",
    severity: "high" as const,
    suggestion: "Add clearInterval in useEffect cleanup function",
  },
  {
    // setTimeout that sets state without isMounted check
    regex: /setTimeout\s*\(\s*\(\)\s*=>\s*\{[^}]*set[A-Z]/g,
    checkCleanup: /clearTimeout|isMounted/,
    pattern: "setTimeout with setState might update unmounted component",
    severity: "medium" as const,
    suggestion: "Use useCleanup hook or add isMounted check",
  },
  {
    // addEventListener without removeEventListener
    regex: /addEventListener\s*\([^)]+\)/g,
    checkCleanup: /removeEventListener/,
    pattern: "addEventListener without cleanup",
    severity: "high" as const,
    suggestion: "Add removeEventListener in cleanup function",
  },
  {
    // fetch without AbortController
    regex: /fetch\s*\([^)]+\)(?!.*signal)/g,
    checkCleanup: /AbortController|signal/,
    pattern: "fetch without AbortController",
    severity: "low" as const,
    suggestion: "Consider using AbortController for cancelable requests",
  },
  {
    // useEffect with async function
    regex: /useEffect\s*\(\s*async\s*\(\)/g,
    checkCleanup: null,
    pattern: "async useEffect (cannot return cleanup)",
    severity: "medium" as const,
    suggestion: "Move async logic to separate function inside useEffect",
  },
];

async function scanFile(filePath: string): Promise<LeakPattern[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues: LeakPattern[] = [];

  // Get all useEffect blocks
  const useEffectBlocks: { start: number; end: number; content: string }[] = [];
  let inUseEffect = false;
  let braceCount = 0;
  let currentBlock = { start: 0, content: "" };

  lines.forEach((line, index) => {
    if (line.includes("useEffect")) {
      inUseEffect = true;
      currentBlock = { start: index + 1, content: "" };
      braceCount = 0;
    }

    if (inUseEffect) {
      currentBlock.content += line + "\n";
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount <= 0 && currentBlock.content.length > 20) {
        useEffectBlocks.push({
          start: currentBlock.start,
          end: index + 1,
          content: currentBlock.content,
        });
        inUseEffect = false;
      }
    }
  });

  // Check each useEffect block for patterns
  for (const block of useEffectBlocks) {
    for (const pattern of patterns) {
      const matches = block.content.match(pattern.regex);
      if (matches) {
        // Check if cleanup exists
        if (pattern.checkCleanup) {
          const hasCleanup = pattern.checkCleanup.test(block.content);
          if (!hasCleanup) {
            issues.push({
              file: filePath,
              line: block.start,
              pattern: pattern.pattern,
              severity: pattern.severity,
              suggestion: pattern.suggestion,
            });
          }
        } else {
          issues.push({
            file: filePath,
            line: block.start,
            pattern: pattern.pattern,
            severity: pattern.severity,
            suggestion: pattern.suggestion,
          });
        }
      }
    }
  }

  return issues;
}

async function main() {
  console.log("\n🔍 Memory Leak Pattern Detection\n");
  console.log("=".repeat(60));

  const files = await glob("**/*.tsx", {
    cwd: process.cwd(),
    ignore: ["node_modules/**", ".next/**"],
  });

  let allIssues: LeakPattern[] = [];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const issues = await scanFile(filePath);
    allIssues = allIssues.concat(issues);
  }

  // Group by severity
  const highSeverity = allIssues.filter((i) => i.severity === "high");
  const mediumSeverity = allIssues.filter((i) => i.severity === "medium");
  const lowSeverity = allIssues.filter((i) => i.severity === "low");

  console.log(`\n📊 Summary:`);
  console.log(`   High severity:   ${highSeverity.length}`);
  console.log(`   Medium severity: ${mediumSeverity.length}`);
  console.log(`   Low severity:    ${lowSeverity.length}`);
  console.log(`   Total issues:    ${allIssues.length}`);

  if (highSeverity.length > 0) {
    console.log("\n🔴 High Severity Issues:");
    console.log("-".repeat(60));
    highSeverity.forEach((issue) => {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`\n   📁 ${relativePath}:${issue.line}`);
      console.log(`   ⚠️  ${issue.pattern}`);
      console.log(`   💡 ${issue.suggestion}`);
    });
  }

  if (mediumSeverity.length > 0) {
    console.log("\n🟡 Medium Severity Issues:");
    console.log("-".repeat(60));
    mediumSeverity.forEach((issue) => {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`\n   📁 ${relativePath}:${issue.line}`);
      console.log(`   ⚠️  ${issue.pattern}`);
      console.log(`   💡 ${issue.suggestion}`);
    });
  }

  if (lowSeverity.length > 0 && process.argv.includes("--verbose")) {
    console.log("\n🟢 Low Severity Issues:");
    console.log("-".repeat(60));
    lowSeverity.forEach((issue) => {
      const relativePath = path.relative(process.cwd(), issue.file);
      console.log(`\n   📁 ${relativePath}:${issue.line}`);
      console.log(`   ⚠️  ${issue.pattern}`);
      console.log(`   💡 ${issue.suggestion}`);
    });
  }

  console.log("\n" + "=".repeat(60));

  if (allIssues.length === 0) {
    console.log("✅ No memory leak patterns detected!");
  } else {
    console.log("💡 Use --verbose flag to see low severity issues");
    console.log("💡 Import { useCleanup } from '@/lib/hooks' for safe async operations");
  }

  console.log("");
}

main().catch(console.error);
