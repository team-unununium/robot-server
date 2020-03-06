// Initialization statements
require('events').EventEmitter.defaultMaxListeners = 15;
require('./utils/mongoose')

// System/npm modules
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const socketauth = require('socketio-auth')

// User defined modules
const AppClient = require('./models/AppClient')
const router = require('./utils/router')
const socketConnection = require('./utils/socket')

// Initialize Express
const app = express()
app.use(express.json())
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT

// Socket.io Authentication
socketauth(io, {
    authenticate: (socket, data, callback) => {
        const guid = data.guid
        const token = data.token

        AppClient.findOne({guid, token}, (e, client) => {
            if (e || !client) {
                callback(null, false)
            } else {
                callback(null, true)
            }
        })
    },
    disconnect: (socket) => {
        // TODO: Complete
    },
    timeout: 5000
})

io.on('connection', socketConnection(io))

app.use(router)
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})