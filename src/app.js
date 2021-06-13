// Initialization statements
require('events').EventEmitter.defaultMaxListeners = 25;
require('./utils/mongoose')

// System/npm modules
const express = require('express')
const http = require('http')
const socketio = require('socket.io')

// User defined modules
const router = require('./utils/router')
const socketfunc = require('./utils/socket')

// Initialize Express server
const app = express()
app.use(express.json())

// Create HTTP Server from Express
const server = http.createServer(app)

// Set up sockets
const io = socketio(server)
app.use(router)
io.use(socketfunc.auth(io), {
    path: '/client/',
    serveClient: true
})
io.on('connection', socketfunc.connection(io))

// Start server
const port = process.env.PORT
server.listen(port, () => {
    console.log('Server is up on port ' + port)
})
