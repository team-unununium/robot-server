// All socket functions (io is passed from app.js)
const connection = function(io) {
    return (socket) => {
        // Main functions start

        // Called from client and robot side
        socket.on('join', (data, callback) => {
            // TODO: Complete
        })

        // TODO: Complete
    }
}

module.exports = connection