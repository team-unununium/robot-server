// All socket functions (io is passed from app.js)

/* Custom socket variables:
-  data_guid: GUID of the socket. The ID of the socket is not used as an identifier to allow the server to handle disconnects and reconnects
-  data_type: The type of socket (client or robot)
-  data_rtc: The RTC info of the socket
*/
const AppClient = require('../models/AppClient')
const stream = require('stream')

const dataCheck = function(data) {
    // Check if data is String, if yes, then parse data
    if (typeof data === "string") {
        data = JSON.parse(data)
    }
    return data
}

const auth = (socket, next) => {
	// https://stackoverflow.com/a/36821359
    var guid
    var token
    var bufferDuration
    if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.guid) {
        guid = socket.handshake.query.guid
        token = socket.handshake.query.token
        bufferDuration = socket.handshake.query.bufferDuration
    } else if (socket.handshake.headers && socket.handshake.headers.token && socket.handshake.headers.guid) {
        guid = socket.handshake.headers.guid
        token = socket.handshake.headers.token
        bufferDuration = socket.handshake.headers.bufferDuration
    }
	if (guid != null && token != null) {
        AppClient.findOne({guid, token}, (e, client) => {
            if (!e && client) {
                socket.data_guid = guid
                socket.data_type = client.type
                if (socket.data_type === 'robot' && bufferDuration) stream.bufferDuration = bufferDuration
                next()
            } else {
                next(new Error('Authentication error'))
            }
        })
    } else {
        next(new Error('Parameter error'))
    }
}

const onSocketJoin = (io, socket) => {
    AppClient.findOne({guid: socket.data_guid}, (e, client) => {
        if (!e && client) {
            console.log('Client with GUID', socket.data_guid, 'and type', socket.data_type, 'connected')
            client['online'] = true
            client.save((e) => {if (e) console.log('Error changing online status of socket with GUID ', socket.data_guid, '\nError is', e)})
        } else {
            console.log('Client with invalid GUID', socket.data_guid,'successfully connected, disconnecting')
            socket.disconnect()
        }
    })

    socket.join(socket.data_type)
    if (socket.data_type === 'robot') {
        socket.emit ('testRobot')
    } else {
        if (socket.data_type === 'operator') socket.emit('testOperator')
        else socket.emit('testClient')
    }
    stream.reset()
}

const connection = function(io) {
    // All functions starting with robot would only be sent to/from robots, vice versa for clients
    return (socket) => {
        onSocketJoin(io, socket)

        // Sets the user to be offline when it gets disconnected
        socket.on('disconnect', (data, callback) => {
            AppClient.findOne({ guid: socket.data_guid }, (e, client) => {
                if (e) {
                    console.log('Error while deleting socket with GUID', socket.data_guid)
                } else if (client) {
                    if (client.type === 'robot') socket.broadcast.emit('rtcRobotDisconnected', { guid: socket.data_guid })
                    else socket.broadcast.emit('rtcClientDisconnected', { guid: socket.data_guid })
                    client['online'] = false
                    client.save((e) => {if (e) console.log('Error changing online status of socket with GUID ', socket.data_guid, '\nError is', e)})
                } else {
                    console.log('Client with GUID', socket.data_guid, 'not found')
                }
            })
        })

        // All operator side function receivers
        socket.on('operatorRotateCamera', (data, callback) => {
            data = dataCheck(data)
            if(socket.data_type === 'operator') {
                io.of('/').to('robot').emit('robotRotateCamera', data)
            }
        })

        socket.on('operatorRotate', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.of('/').to('robot').emit('robotRotate', data)
            }
        })

        socket.on('operatorStartMoving', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.of('/').to('robot').emit('robotStartMoving')
            }
        })

        socket.on('operatorStopMoving', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.of('/').to('robot').emit('robotStopMoving')
            }
        })

        socket.on('operatorChangeSpeed', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.of('/').to('robot').emit('robotChangeSpeed', data)
            }
        })
        
        // All robot side function receivers
        socket.on('robotUpdateData', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'robot') {
                io.of('/').to('operator').to('client').emit('clientUpdateData', data)
            }
        })

        socket.on('robotSendVideo', (data, callback) => {
            if (socket.data_type === 'robot') {
                stream.addVideo(data)
            }
        })
    }
}

module.exports = { auth, connection }
