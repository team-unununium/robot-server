// In-built modules
require('events').EventEmitter.defaultMaxListeners = 15;
const http = require('http')

// npm modules
const express = require('express')
const socketio = require('socket.io')
const socketauth = require('socketio-auth')

// User defined modules
require('./utils/mongoose')
const AppClient = require('./models/AppClient')
const router = require('./utils/router')

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
    disconnect: (socket, data, callback) => {
        // TODO: Complete
    },
    timeout: 5000
})

io.on('connection', (socket) => {

    // Called from client and robot side
    socket.on('join', (data, callback) => {
        // TODO: Complete
    })

    // TODO: Complete
})

app.use(router)
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})