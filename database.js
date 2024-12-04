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

/**
filename: populateDatabase.js
Dont think I need this: 

const createClients = (numClients) => {
    const clients = [];
    for (let i = 1; i <= numClients; i++) {
        clients.push({
            name: `Client ${i}`,
            company_name: `Company ${i}`,
            address: `Address ${i}`,
            email: `client${i}@example.com`
        });
    }
    return clients;
};

const createStyles = (clientId, numStyles) => {
    const styles = [];
    for (let i = 1; i <= numStyles; i++) {
        styles.push({
            name: `Style ${i}`,
            price: (Math.random() * 100).toFixed(2),
            client_id: clientId
        });
    }
    return styles;
};

const createSamples = (clientId, numSamples) => {
    const samples = [];
    for (let i = 1; i <= numSamples; i++) {
        samples.push({
            name: `Sample ${i}`,
            time: `${Math.floor(Math.random() * 10) + 1} hours`,
            price: (Math.random() * 100).toFixed(2),
            client_id: clientId
        });
    }
    return samples;
};

const batchRequests = async (requests, batchSize = 50) => {
    const results = [];
    for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        results.push(...await Promise.all(batch.map(req => fetch(req.url, req.options))));
    }
    return results;
};

const populateDatabase = async () => {
    const numClients = 200;
    const numStyles = 200;
    const numSamples = 200;

    try {
        const clients = createClients(numClients);
        const clientRequests = clients.map(client => ({
            url: 'http://localhost:5002/clients',
            options: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(client)
            }
        }));

        // Add clients in batches
        const clientResponses = await batchRequests(clientRequests);
        const clientIds = await Promise.all(clientResponses.map(res => res.json()));

        // Create requests for styles and samples
        const styleRequests = [];
        const sampleRequests = [];
        for (const clientData of clientIds) {
            const clientId = clientData.id;

            const styles = createStyles(clientId, numStyles);
            styleRequests.push({
                url: 'http://localhost:5002/styles/bulk',
                options: {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ clientId: clientId, styles: styles })
                }
            });

            const samples = createSamples(clientId, numSamples);
            for (const sample of samples) {
                sampleRequests.push({
                    url: 'http://localhost:5002/samples',
                    options: {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sample)
                    }
                });
            }
        }

        // Add styles in batches
        await batchRequests(styleRequests);

        // Add samples in batches
        await batchRequests(sampleRequests);

        console.log(`Successfully populated ${numClients} clients with ${numStyles} styles and ${numSamples} samples each.`);
    } catch (error) {
        console.error('Error populating database:', error);
    }
};

populateDatabase();

 */
