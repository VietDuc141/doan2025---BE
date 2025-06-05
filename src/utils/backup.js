const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const config = require("../config");
const logger = require("./logger");

const backupDir = path.join(__dirname, "../../backups");

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

exports.createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `backup-${timestamp}`);

  try {
    // Create backup using mongodump
    await new Promise((resolve, reject) => {
      const command = `mongodump --uri="${config.db.uri}" --out="${backupPath}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error("Backup error:", error);
          reject(error);
          return;
        }
        logger.info("Backup created successfully");
        resolve();
      });
    });

    // Backup uploaded files
    const uploadsBackupPath = path.join(backupPath, "uploads");
    fs.mkdirSync(uploadsBackupPath, { recursive: true });
    fs.cpSync(config.upload.destination, uploadsBackupPath, {
      recursive: true,
    });

    return backupPath;
  } catch (error) {
    logger.error("Backup failed:", error);
    throw error;
  }
};

exports.restoreBackup = async (backupPath) => {
  try {
    // Restore database
    await new Promise((resolve, reject) => {
      const command = `mongorestore --uri="${config.db.uri}" "${backupPath}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error("Restore error:", error);
          reject(error);
          return;
        }
        logger.info("Database restored successfully");
        resolve();
      });
    });

    // Restore uploaded files
    const uploadsBackupPath = path.join(backupPath, "uploads");
    if (fs.existsSync(uploadsBackupPath)) {
      fs.rmSync(config.upload.destination, { recursive: true, force: true });
      fs.cpSync(uploadsBackupPath, config.upload.destination, {
        recursive: true,
      });
    }

    logger.info("Backup restored successfully");
  } catch (error) {
    logger.error("Restore failed:", error);
    throw error;
  }
};

exports.listBackups = () => {
  try {
    const backups = fs
      .readdirSync(backupDir)
      .filter((file) => fs.statSync(path.join(backupDir, file)).isDirectory())
      .map((file) => ({
        name: file,
        path: path.join(backupDir, file),
        created: fs.statSync(path.join(backupDir, file)).birthtime,
      }))
      .sort((a, b) => b.created - a.created);

    return backups;
  } catch (error) {
    logger.error("List backups error:", error);
    throw error;
  }
};

exports.deleteBackup = (backupPath) => {
  try {
    fs.rmSync(backupPath, { recursive: true, force: true });
    logger.info(`Backup deleted: ${backupPath}`);
  } catch (error) {
    logger.error("Delete backup error:", error);
    throw error;
  }
};
