const sqlite3 = require('sqlite3').verbose()
let db

function getDb() {
  if (!db) {
    db = new sqlite3.Database('./invoicing.sqlite', err => {
      if (err) {
        console.error('Error opening database:', err.message)
        return
      }
      console.log('Successfully connected to the SQLite database.')
      db.run('PRAGMA foreign_keys = ON')

      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company_name TEXT,
          address TEXT,
          email TEXT
        )`)

        db.run(`CREATE TABLE IF NOT EXISTS styles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL,
          client_id INTEGER,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )`)

        db.run(`CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT,
          file_location TEXT,
          client_id INTEGER,
          discount_percent REAL,
          discount_flat REAL,
          vat_percent REAL,
          subtotal REAL,
          discount REAL,
          discount_percent_value REAL,
          vat REAL,
          total REAL,
          deposit REAL,
          deposit_percent_value REAL,
          note TEXT,
          total_pre_discount REAL,
          date TEXT,
          deposit_flat,
          deposit_percent,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )`)

        db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          price REAL,
          type TEXT,
          time REAL,
          quantity REAL,
          total_item_price REAL,
          invoice_id INTEGER,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )`)

        db.run(
          `CREATE TABLE IF NOT EXISTS samples (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          time REAL NOT NULL,
          price REAL NOT NULL,
          client_id INTEGER,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )`,
          err => {
            if (err) {
              console.error('Error creating tables:', err.message)
            } else {
              console.log('Tables are ready.')
            }
          },
        )
      })
    })
  }
  return db
}

module.exports = getDb
