const mongoose = require('mongoose')

const appClientSchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['client', 'robot'],
        required: true
    }
})

const AppClient = mongoose.model('AppClient', appClientSchema)

module.exports = AppClient