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
        db.run(`CREATE INDEX IF NOT EXISTS idx_clients_id ON clients(id)`)

        db.run(`CREATE TABLE IF NOT EXISTS styles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL,
          client_id INTEGER,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_styles_client_id ON styles(client_id)`)

        db.run(`CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT,
          file_location TEXT,
          client_id INTEGER NOT NULL,
          discount_type INTEGER NOT NULL DEFAULT 0,
          discount_value REAL NOT NULL DEFAULT 0,
          discVal_ifPercent REAL NOT NULL DEFAULT 0,
          vat_percent REAL NOT NULL DEFAULT 20,
          subtotal REAL NOT NULL,
          vat REAL NOT NULL DEFAULT 0,
          total REAL NOT NULL,
          deposit_type INTEGER NOT NULL DEFAULT 0,
          deposit_value REAL NOT NULL DEFAULT 0,
          depoVal_ifPercent REAL NOT NULL DEFAULT 0,
          note TEXT,
          total_pre_discount REAL NOT NULL DEFAULT 0,
          date TEXT NOT NULL,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id)`)

        db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL DEFAULT 0,
          type TEXT,
          time REAL NOT NULL,
          quantity REAL NOT NULL DEFAULT 1,
          total_item_price REAL NOT NULL,
          invoice_id INTEGER NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )`)
        db.run(`CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)`)

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
        db.run(`CREATE INDEX IF NOT EXISTS idx_samples_client_id ON samples(client_id)`)
      })
    })
  }
  return db
}

module.exports = getDb
