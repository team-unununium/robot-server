// In-built modules
require('events').EventEmitter.defaultMaxListeners = 15;
const http = require('http')

// npm modules
const express = require('express')
const jwt = require('jsonwebtoken')
const socketio = require('socket.io')
const socketauth = require('socketio-auth')

// User defined modules
require('./utils/mongoose')
const AppClient = require('./models/AppClient')

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

        if (guid === '' && token === process.env.SERVER_ROBOT_SECRET) {
            return callback(null, true)
        }

        AppClient.findOne({guid, token}, (e, client) => {
            if (e || !client) {
                callback(null, false)
            } else {
                callback(null, true)
            }
        })
    },
    timeout: 5000
})

io.on('connection', (socket) => {

    // Called from client and robot side
    socket.on('join', (type, callback) => {
        if (type !== 'robot' && type !== 'client') {
            return callback(new Error('Invalid params'))
        }

        socket['socketType'] = type
        callback()

        if (type === 'robot') {
            // Check if there is another robot, if yes, kick that one out
            io.sockets.clients((error, clients) => {
                if (!error) {
                    clients.forEach((client) => {
                        if (client['socketType'] === 'robot') {
                            client.disconnect(true)
                        }
                    })
                }
            })
        }
        // Get initial data
        io.emit('robotRequestData')
        io.emit('robotRequestStreamUrl')
    })

    // Only called from client side
    socket.on('clientRequestData', (data, callback) => {
        socket.broadcast.emit('robotRequestData')
    })

    // Only called from client side
    socket.on('clientRotateCamera', (directions, callback) => {
        socket.broadcast.emit('robotRotateCamera', directions)
    })

    // Only called from client side
    socket.on('clientStartMoving', (data, callback) => {
        socket.broadcast.emit('robotStartMoving')
    })

    // Only called from client side
    socket.on('clientStopMoving', (data, callback) => {
        socket.broadcast.emit('robotStopMoving')
    })

    // Only called from robot side
    socket.on('robotVerifyClient', ({ guid, token }, callback) => {
        const client = AppClient.findOne({ guid, token })
        socket.emit('robotClientVerified', client)
    })

    // Only called from robot side
    socket.on('robotUpdateData', (data, callback) => {
        socket.broadcast.emit('clientDataReceived', data)
    })

    // Only called from robot side
    socket.on('robotStreamUrl', (url, callback) => {
        socket.broadcast.emit('clientStreamUrl', url)
    })
})

// Get token using GUID and common secret
app.post('/access', async (req, res) => {
    if (!req.body || !req.body.guid || !req.body.secret || req.body.secret !== process.env.SERVER_CLIENT_SECRET) {
        return res.status(400).send()
    }

    // Overwrite existing client data
    try {
        const client = new AppClient({ guid: req.body.guid, token: jwt.sign({ _id: req.body.guid }, process.env.JWT_SECRET)})
        await client.save()
        res.status(201).send(client)
    } catch (e) {
        res.status(500).send()
    }
})

// Connection Test
app.get('/test', (req, res) => {
    res.send("Server is online")
})

app.get('*', (req, res) => {
    
    res.status(404).send()
})

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})