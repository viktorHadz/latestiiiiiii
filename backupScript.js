const fs = require('fs')
const path = require('path')

const BACKUP_DIR = path.join(__dirname, 'backups')
const DB_PATH = path.join(__dirname, 'invoicing.sqlite')
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR)
}
// Create a timestamped backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupFileName = `database_backup_${timestamp}.db`
const backupPath = path.join(BACKUP_DIR, backupFileName)

// Perform the backup (copy the database)
fs.copyFileSync(DB_PATH, backupPath)
console.log(`Backup created: ${backupFileName}`)

// Rotation: Keep only the latest 4 backups
const backups = fs
  .readdirSync(BACKUP_DIR)
  .filter(file => file.endsWith('.db'))
  .map(file => ({
    file,
    created: fs.statSync(path.join(BACKUP_DIR, file)).birthtime,
  }))
  .sort((a, b) => a.created - b.created) // Oldest first

if (backups.length > 4) {
  const oldestBackup = backups[0].file
  fs.unlinkSync(path.join(BACKUP_DIR, oldestBackup))
  console.log(`Deleted oldest backup: ${oldestBackup}`)
}
module.exports = MyComponent
