const express = require('express')
const path = require('path')
const cors = require('cors')
const { exec } = require('child_process') // Add this line

const clientsRoutes = require('./routes/clientsRoutes')
const stylesRoutes = require('./routes/stylesRoutes')
const invoicingRoutes = require('./routes/invoicingRoutes')
const editorRoutes = require('./routes/editorRoutes')
const globalRoutes = require('./routes/globalRoutes')

const connection = require('./database')
const app = express()

const port = process.env.PORT || 5002

app.use(express.json())
app.use(cors())

app.use(express.static(path.join(__dirname)))
// This needs to be here
app.use(globalRoutes)

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')))
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'src')))
app.use(express.static(path.join(__dirname, 'src/html')))

// Serve index.html on the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// Using the route modules
app.use(clientsRoutes)
app.use(stylesRoutes)
app.use(invoicingRoutes)
app.use(editorRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)

  // Open the default web browser after the server starts
  const startURL = `http://localhost:${port}`
  switch (
    process.platform // Check the platform
  ) {
    case 'darwin': // macOS
      exec(`open ${startURL}`)
      break
    case 'win32': // Windows
      exec(`start ${startURL}`)
      break
    case 'linux': // Linux
      exec(`xdg-open ${startURL}`)
      break
    default:
      console.log(`Server started. Please open ${startURL} in your browser.`)
  }
})
