// All Express routes
const express = require('express')
const jwt = require('jsonwebtoken')

const AppClient = require('./src/models/AppClient')
const router = new express.Router()

// Get token using GUID and common secret
router.post('/access', async (req, res) => {
    if (!req.body || !req.body.guid || !req.body.secret) {
        return res.status(400).send()
    }

    // Overwrite existing client data
    var type
    if (req.body.secret === process.env.SERVER_CLIENT_SECRET) {
        type = 'client'
    } else if (req.body.secret === process.env.SERVER_ROBOT_SECRET) {
        // Check if robot exists in database
        await AppClient.findOne({ type: 'robot' }, (e, client) => {
            if (e) {
                return res.status(500).send()
            } else if (client) {
                return res.status(403).send()
            }
        })
        type = 'robot'
    } else {
        return res.status(400).send()
    }

    // Save client
    const client = new AppClient({ guid: req.body.guid, token: jwt.sign({ _id: req.body.guid }, process.env.JWT_SECRET), type})
    await client.save()
    res.status(201).send(client)
})

// Connection Test
router.get('/test', (req, res) => {
    res.send("Server is online")
})

router.get('*', (req, res) => {
    res.status(404).send()
})

router.all('*', (req, res) => {
    res.status(405).send()
})

module.exports = router