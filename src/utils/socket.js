// All socket functions (io is passed from app.js)

/* Custom socket variables:
-  data_guid: GUID of the socket
-  data_type: The type of socket (client or robot)
-  data_rtc: The RTC info of the socket
*/
const AppClient = require('../models/AppClient')

const dataCheck = function(data) {
    // Check if data is String, if yes, then parse data
    if (typeof data === "string") {
        data = JSON.parse(data)
    }
    return data
}

const auth = function(io) {
	// https://stackoverflow.com/a/36821359
	return (socket, next) => {
		if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.guid) {
			const guid = socket.handshake.query.guid
			const token = socket.handshake.query.token
			AppClient.findOne({guid, token}, (e, client) => {
				if (!e && client) {
                    socket.data_type = client.type
                    client['online'] = true
                    client.save((e) => {if (e) console.log('Error changing online status of socket with GUID ', socket.data_guid, '\nError is', e)})
                    next()
				} else {
                    next(new Error('Authentication error'))
                }
			})
		} else {
			next(new Error('Parameter error'))
		}
	}
}

const connection = function(io) {
    // All functions starting with robot would only be sent to/from robots, vice versa for clients
    return (socket) => {
        // socket.on('join') is handled by auth.postAuthenticate
        // The if statements is to prevent malicious connection to the socket pretending to be someone else's role

        // Deletes the user from the database when the user is deleted
        socket.on('disconnect', (data, callback) => {
            AppClient.findOne({ guid: socket.data_guid }, (e, client) => {
                if (e) {
                    console.log('Error while deleting socket with GUID', socket.data_guid)
                } else if (client) {
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
            if (socket.data_type === 'operator') {
                io.emit('robotRotateCamera', data)
            }
            callback()
        })

        socket.on('operatorRotate', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.emit('robotRotate', data)
            }
            callback()
        })

        socket.on('operatorStartMoving', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.emit('robotStartMoving')
            }
            callback()
        })

        socket.on('operatorStopMoving', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.emit('robotStopMoving')
            }
            callback()
        })

        socket.on('operatorChangeSpeed', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'operator') {
                io.emit('robotChangeSpeed', data)
            }
            callback()
        })
        
        socket.on('robotUpdateData', (data, callback) => {
            data = dataCheck(data)
            if (socket.data_type === 'robot') {
                io.emit('clientUpdateData', data)
            }
            callback()
        })
    }
}

module.exports = { auth, connection }
