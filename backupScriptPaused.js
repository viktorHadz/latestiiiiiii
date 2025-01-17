// const fs = require('fs')
// const path = require('path')

// function dbBackup() {
//   const BACKUP_DIR = path.join(__dirname, 'backups')
//   const DB_PATH = path.join(__dirname, 'invoicing.sqlite')
//   if (!fs.existsSync(BACKUP_DIR)) {
//     fs.mkdirSync(BACKUP_DIR)
//   }
//   // Create a timestamped backup
//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
//   const backupFileName = `db_backup_${timestamp}.sqlite`
//   const backupPath = path.join(BACKUP_DIR, backupFileName)

//   // Perform the backup - copy the database
//   fs.copyFileSync(DB_PATH, backupPath)
//   console.log(`Backup created: ${backupFileName}`)

//   // Keep only the latest 4 backups
//   const backups = fs
//     .readdirSync(BACKUP_DIR)
//     .filter(file => file.endsWith('.sqlite'))
//     .map(file => ({
//       file,
//       created: fs.statSync(path.join(BACKUP_DIR, file)).birthtime,
//     }))
//     .sort((a, b) => a.created - b.created)

//   if (backups.length > 10) {
//     const oldestBackup = backups[0].file
//     fs.unlinkSync(path.join(BACKUP_DIR, oldestBackup))
//     console.log(`Deleted oldest backup: ${oldestBackup}`)
//   }
// }
// module.exports = dbBackup
