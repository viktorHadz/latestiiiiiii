const express = require('express')
const path = require('path')
const createDbBackup = require('./backupScript')

const clientsRoutes = require('./routes/clientsRoutes')
const invoicingRoutes = require('./routes/invoicingRoutes')
const editorRoutes = require('./routes/editorRoutes')
const itemRoutes = require('./routes/itemRoutes')
const validationRoutes = require('./routes/validationRoutes')

const connection = require('./database')

const app = express()
const port = process.env.PORT || 5002

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Register routes with clean prefixes
app.use('/clients', clientsRoutes)
app.use('/invo', invoicingRoutes)
app.use('/editor', editorRoutes)
app.use('/item', itemRoutes)
app.use('/validate', validationRoutes)

app.listen(port, () => {
  // createDbBackup()
  console.log(`Server running on http://localhost:${port}`)
})
