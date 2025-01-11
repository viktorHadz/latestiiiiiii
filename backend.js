const express = require('express')
const path = require('path')
const createDbBackup = require('./backupScript')

const clientsRoutes = require('./routes/clientsRoutes')
const invoicingRoutes = require('./routes/invoicingRoutes')
const editorRoutes = require('./routes/editorRoutes')
const globalRoutes = require('./routes/globalRoutes')
const itemRoutes = require('./routes/itemRoutes')

const connection = require('./database')

const app = express()
const port = process.env.PORT || 5002

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Register routes with clean prefixes
app.use('/clients', clientsRoutes)
app.use('/invoicing', invoicingRoutes)
app.use('/editor', editorRoutes)
app.use('/item', itemRoutes)
app.use(globalRoutes)

app.listen(port, () => {
  createDbBackup()
  console.log(`Server running on http://localhost:${port}`)
})
// const express = require('express')
// const path = require('path')

// const clientsRoutes = require('./routes/clientsRoutes')
// const stylesRoutes = require('./routes/stylesRoutes')
// const invoicingRoutes = require('./routes/invoicingRoutes')
// const editorRoutes = require('./routes/editorRoutes')
// const globalRoutes = require('./routes/globalRoutes')
// const mixedRoutes = require('./routes/mixedRoutes')
// // dB
// const connection = require('./database')

// const app = express()
// const port = process.env.PORT || 5002

// app.use(express.json())

// app.use(express.static(path.join(__dirname, 'public')))

// // Register routes and prepend string
// app.use(globalRoutes)
// app.use('/items/', mixedRoutes)
// app.use(clientsRoutes)
// app.use('/api/items/', stylesRoutes)
// app.use(invoicingRoutes)
// app.use(editorRoutes)

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`)
// })
