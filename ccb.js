#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const readline = require("readline");

const CLAUDE_DIR = path.join(os.homedir(), ".claude", "projects");

// ── Colors ──────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

// ── Find latest session JSONL ───────────────────────────────────────
function findLatestSession() {
  if (!fs.existsSync(CLAUDE_DIR)) {
    return null;
  }

  let latest = null;
  let latestMtime = 0;

  for (const project of fs.readdirSync(CLAUDE_DIR)) {
    const projectDir = path.join(CLAUDE_DIR, project);
    if (!fs.statSync(projectDir).isDirectory()) continue;

    for (const file of fs.readdirSync(projectDir)) {
      if (!file.endsWith(".jsonl")) continue;
      const filePath = path.join(projectDir, file);
      const mtime = fs.statSync(filePath).mtimeMs;
      if (mtime > latestMtime) {
        latestMtime = mtime;
        latest = filePath;
      }
    }
  }

  return latest;
}

// ── Parse session and find last assistant text ──────────────────────
function getLastAssistantText(sessionPath) {
  const content = fs.readFileSync(sessionPath, "utf8");
  const lines = content.trim().split("\n");

  let lastText = null;

  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (
      record.type === "assistant" &&
      record.message?.role === "assistant" &&
      Array.isArray(record.message?.content)
    ) {
      // Collect all text blocks from this message
      const textParts = record.message.content
        .filter((block) => block.type === "text" && block.text)
        .map((block) => block.text);

      if (textParts.length > 0) {
        lastText = textParts.join("\n");
      }
    }
  }

  return lastText;
}

// ── Extract fenced code blocks ──────────────────────────────────────
function extractCodeBlocks(text) {
  const blocks = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      lang: match[1] || "text",
      code: match[2].replace(/\n$/, ""), // trim trailing newline
    });
  }

  return blocks;
}

// ── Copy to clipboard ───────────────────────────────────────────────
function copyToClipboard(text) {
  const platform = os.platform();
  try {
    if (platform === "win32" || process.env.OSTYPE?.includes("cygwin") || process.env.OSTYPE?.includes("msys") || fs.existsSync("/cygdrive")) {
      execSync("clip.exe", { input: text });
    } else if (platform === "darwin") {
      execSync("pbcopy", { input: text });
    } else {
      try {
        execSync("xclip -selection clipboard", { input: text });
      } catch {
        execSync("xsel --clipboard --input", { input: text });
      }
    }
    return true;
  } catch (e) {
    console.error(`${c.red}Failed to copy: ${e.message}${c.reset}`);
    return false;
  }
}

// ── Display block list ──────────────────────────────────────────────
function displayBlocks(blocks) {
  console.log(`\n${c.bold}Code blocks in last response:${c.reset}\n`);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const preview = b.code.split("\n").find((l) => l.trim()) || "";
    const truncated =
      preview.length > 50 ? preview.substring(0, 50) + "..." : preview;
    const lineCount = b.code.split("\n").length;
    console.log(
      `  ${c.bold}${c.cyan}${i + 1}.${c.reset} ${c.magenta}[${b.lang}]${c.reset} ${c.dim}${truncated}${c.reset}  ${c.dim}(${lineCount} lines)${c.reset}`
    );
  }
  console.log();
}

// ── Prompt user for selection ───────────────────────────────────────
function promptUser(blocks) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    `${c.dim}Block? (1-${blocks.length}, ${c.reset}all${c.dim}, ${c.reset}last${c.dim}):${c.reset} `,
    (answer) => {
      rl.close();
      handleSelection(answer.trim(), blocks);
    }
  );
}

// ── Handle block selection ──────────────────────────────────────────
function handleSelection(selection, blocks) {
  if (selection === "all") {
    const combined = blocks.map((b) => b.code).join("\n\n");
    if (copyToClipboard(combined)) {
      console.log(
        `${c.green}Copied all ${blocks.length} blocks to clipboard.${c.reset}`
      );
    }
    return;
  }

  if (selection === "last") {
    const last = blocks[blocks.length - 1];
    if (copyToClipboard(last.code)) {
      console.log(
        `${c.green}Copied block ${blocks.length} ${c.dim}[${last.lang}]${c.reset}${c.green} to clipboard.${c.reset}`
      );
    }
    return;
  }

  const num = parseInt(selection, 10);
  if (isNaN(num) || num < 1 || num > blocks.length) {
    console.error(
      `${c.red}Invalid selection. Pick 1-${blocks.length}, "all", or "last".${c.reset}`
    );
    process.exit(1);
  }

  const block = blocks[num - 1];
  if (copyToClipboard(block.code)) {
    console.log(
      `${c.green}Copied block ${num} ${c.dim}[${block.lang}]${c.reset}${c.green} to clipboard.${c.reset}`
    );
  }
}

// ── Main ────────────────────────────────────────────────────────────
function main() {
  const arg = process.argv[2];

  // Find session
  const sessionPath = findLatestSession();
  if (!sessionPath) {
    console.error(`${c.red}No Claude Code sessions found.${c.reset}`);
    process.exit(1);
  }

  // Get last assistant text
  const text = getLastAssistantText(sessionPath);
  if (!text) {
    console.error(`${c.red}No assistant messages in latest session.${c.reset}`);
    process.exit(1);
  }

  // Extract code blocks
  const blocks = extractCodeBlocks(text);
  if (blocks.length === 0) {
    console.error(`${c.yellow}No code blocks in last response.${c.reset}`);
    process.exit(0);
  }

  // Direct selection via argument
  if (arg) {
    handleSelection(arg, blocks);
    return;
  }

  // Single block — just copy it
  if (blocks.length === 1) {
    if (copyToClipboard(blocks[0].code)) {
      console.log(
        `${c.green}Copied ${c.dim}[${blocks[0].lang}]${c.reset}${c.green} to clipboard. ${c.dim}(${blocks[0].code.split("\n").length} lines)${c.reset}`
      );
    }
    return;
  }

  // Multiple blocks — show list and prompt
  displayBlocks(blocks);
  promptUser(blocks);
}

main();
