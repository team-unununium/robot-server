// All socket functions (io is passed from app.js)

/* Custom socket variables:
-  data_guid: GUID of the socket
-  data_type: The type of socket (client or robot)
-  data_rtc: The RTC info of the socket
*/

const AppClient = require('../models/AppClient')

const auth = function(io) { 
    return {
        authenticate: (socket, data, callback) => {
            const guid = data.guid
            const token = data.token

            socket.data_guid = guid
            AppClient.findOne({guid, token}, (e, client) => {
                if (!e && client) {
                    socket.data_type = client.type
                }
                callback(null, !e && client)
            })
        },
        disconnect: (socket) => {
            if (socket.data_type === 'robot') {
                io.emit('clientRemovePeer')
            } else {
                io.emit('robotRemovePeer', socket.data_rtc)
            }
            AppClient.findOne({ guid: socket.data_guid }, (e, client) => {
                if (e) {
                    print('Error while deleting socket with GUID', socket.data_guid)
                } else if (client) {
                    client['online'] = false
                    client.save((e) => {if (e) console.log('Error changing online status of socket with GUID ', socket.data_guid, '\nError is', e)})
                } else {
                    print('Client with GUID', socket.data_guid, 'not found')
                }
            })
        },
        postAuthenticate: (socket, data) => {
            AppClient.findOne({ guid: socket.data_guid }, (e, client) => {
                if (e) {
                    print('Socket with GUID', socket.data_guid, ' not found')
                } else {
                    client['online'] = true
                    client.save((e) => {if (e) console.log('Error changing online status of socket with GUID ', socket.data_guid, '\nError is', e)})
                }
            })
        },
        timeout: 5000
    }
}

const connection = function(io) {
    // All functions starting with robot would only be sent to/from robots, vice versa for clients
    return (socket) => {
        // socket.on('join') is handled by auth.postAuthenticate
        // The if statements is to prevent malicious connection to the socket pretending to be someone else's role

        // All operator side function receivers
        socket.on('operatorRotate', (data, callback) => {
            if (socket.data_type === 'operator') {
                io.emit('robotRotate', data)
            }
            callback()
        })

        socket.on('operatorStartMoving', (data, callback) => {
            if (socket.data_type === 'operator') {
                io.emit('robotStartMoving')
            }
            callback()
        })

        socket.on('operatorStopMoving', (data, callback) => {
            if (socket.data_type === 'operator') {
                io.emit('robotStopMoving')
            }
            callback()
        })
        
        socket.on('robotUpdateData', (data, callback) => {
            if (socket.data_type === 'robot') {
                io.emit('clientUpdateData', data)
            }
            callback()
        })
    }
}

module.exports = { auth, connection }