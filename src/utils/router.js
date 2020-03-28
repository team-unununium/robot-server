// All Express routes
const express = require('express')
const jwt = require('jsonwebtoken')

const AppClient = require('../models/AppClient')
const router = new express.Router()

// Get token using GUID and common secrets
/* All possible reponse codes:
-  201: Operation completed successfully
-  400: body/guid/secret incorrect/not provided
-  401 (Robot / Operator): Another robot/operator already exists
-  403: A client with the same GUID already exists
-  500: Error occured while querying database */
router.post('/access', async (req, res) => {
    if (!req.body || !req.body.guid || !req.body.secret) {
        return res.status(400).send()
    }

    // Check secret validity
    var type
    if (req.body.secret === process.env.SERVER_CLIENT_SECRET) {
        type = 'client'
    } else if (req.body.secret === process.env.SERVER_ROBOT_SECRET) {
        // Check if robot exists in database
        var failReq = false
        await AppClient.findOne({ type: 'robot' }, (e, client) => {
            if (e) {
                failReq = true
                res.status(500).send()
            } else if (client) {
                failReq = true
                res.status(401).send()
            }
        })
        if (failReq) return
        type = 'robot'
    } else if (req.body.secret === process.env.SERVER_OPERATOR_SECRET) {
        // Check if operator exists in database
        var failReq = false
        await AppClient.findOne({ type: 'operator' }, (e, client) => {
            if (e) {
                failReq = true
                res.status(500).send()
            } else if (client) {
                failReq = true
                res.status(401).send()
            }
        })
        if (failReq) return
        type = 'operator'
    } else {
        // Secret doesn't match any possible secrets
        return res.status(400).send()
    }

    // Check if client already exists
    await AppClient.findOne({ guid: req.body.guid }, (e, client) => {
        if (e) {
            return res.status(500).send()
        } else if (client) {
            return res.status(403).send()
        }
    })

    // Save client
    const client = new AppClient({ guid: req.body.guid, token: jwt.sign({ _id: req.body.guid }, process.env.JWT_SECRET), type})
    await client.save()
    res.status(201).send(client)
})

/* All possible response codes:
- 204: Client successfully deleted
- 400: Incorrect parameters provided
- 404: The client could not be found
- 500: Error occured while querying database / deleting user
*/
router.delete('/access', async (req, res) => {
    if (!req.body || !req.body.guid || !req.body.token) {
        return res.status(400).send()
    }

    await AppClient.deleteOne({ guid: req.body.guid, token: req.body.token }, (e, client) => {
        if (e) {
            return res.status(500).send()
        } else if (client) {
            return res.status(204).send()
        } else {
            return res.status(404).send()
        }
    })
})

// Show info abt website
router.get('/', (req, res) => {
    res.send({
        name: 'Unununium VR Robot Server',
        host: req.hostname,
        devpost: 'https://devpost.com/software/hnr2020-vr-robot',
        repository: 'https://github.com/pc-chin/HnR2020-VR-Server'
    })
})

// Connection Test
router.get('/test', (req, res) => {
    res.send("Server is online")
})

router.get('*', (req, res) => {
    res.status(404).send({
        error: 404,
        message: 'Could not GET ' + req.path
    })
})

router.all('*', (req, res) => {
    res.status(405).send({
        error: 405,
        message: 'Method ' + req.method + ' ' + req.path + ' not found'
    })
})

module.exports = router