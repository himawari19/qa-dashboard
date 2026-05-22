/**
 * Backup local Postgres database to a timestamped SQL file.
 * Usage: node scripts/backup.mjs
 * Schedule monthly via Windows Task Scheduler or cron.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const backupDir = path.resolve(".", "backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const filename = `qa_daily_backup_${timestamp}.sql`;
const filepath = path.join(backupDir, filename);

console.log(`📦 Backing up database to ${filename}...`);

try {
  execSync(
    `docker exec qa-daily-db pg_dump -U admin --no-owner --no-acl qa_daily`,
    { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }
  );
  const output = execSync(
    `docker exec qa-daily-db pg_dump -U admin --no-owner --no-acl qa_daily`,
    { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 }
  );
  fs.writeFileSync(filepath, output);

  const sizeMb = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Backup saved: ${filepath} (${sizeMb} MB)`);

  // Keep only last 3 backups
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("qa_daily_backup_") && f.endsWith(".sql"))
    .sort()
    .reverse();

  if (backups.length > 3) {
    for (const old of backups.slice(3)) {
      fs.unlinkSync(path.join(backupDir, old));
      console.log(`🗑️  Removed old backup: ${old}`);
    }
  }
} catch (err) {
  console.error("❌ Backup failed:", err.message);
  console.error("   Make sure Docker container 'qa-daily-db' is running.");
  process.exit(1);
}
