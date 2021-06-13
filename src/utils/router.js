// All Express routes
const basicAuth = require('express-basic-auth')
const express = require('express')
const got = require('got')
const jwt = require('jsonwebtoken')

const AppClient = require('../models/AppClient')
const router = new express.Router()

// No robots
router.get('/robots.txt', (req, res) => {
    res.send('User-agent: \*\nDisallow: /')
})

// Get token using GUID and common secrets
/* All possible reponse codes:
-  201: Operation completed successfully
-  400: body/guid/secret incorrect/not provided
-  401 (Robot / Operator): Another robot/operator already exists
-  403: A client (that is online) with the same GUID already exists
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
                if (client['online']) {
                    failReq = true
                    res.status(401).send()
                } else {
                    await AppClient.deleteOne({ type: 'robot' }, (e, client) => {
                        if (e) {
                            failReq = true
                            res.status(500).send()
                        }
                    })
                }
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
                if (client['online']) {
                    failReq = true
                    res.status(401).send()
                } else {
                    await AppClient.deleteOne({ type: 'operator' }, (e, client) => {
                        if (e) {
                            failReq = true
                            res.status(500).send()
                        }
                    })
                }
            }
        })
        if (failReq) return
        type = 'operator'
    } else {
        // Secret doesn't match any possible secrets
        return res.status(400).send()
    }

    // Save client
    var client
    AppClient.findOne({ guid: req.body.guid }, async (e, client) => {
        if (e) {
            return res.status(500).send()
        } else if (client) {
            // Only overwrite if client is not online
            if (client['online']) {
                return res.status(403).send()
            } else {
                // GUID remains the same
                client['token'] = jwt.sign({ _id: req.body.guid, date: '' + new Date() }, process.env.JWT_SECRET)
                client['type'] = type
                client['online'] = false
                await client.save()
                return res.status(201).send(client)
            }
        } else {
            const newClient = new AppClient({ guid: req.body.guid, token: jwt.sign({ _id: req.body.guid, date: '' + new Date() }, process.env.JWT_SECRET), type, online:false})
            await newClient.save()
            return res.status(201).send(newClient)
        }
    })
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

// Global variables used
var dlVersion, dlLink, dlPage, dlLast
const setDlLink = async function () {
    const url = 'https://api.github.com/repos/team-unununium/HnR-2020-VR-Client/releases/latest'
    const body = JSON.parse((await got(url)).body)
    var download = ''
    // Find the first assets that is an APK
    body.assets.forEach((asset) => {
        if (asset.content_type === 'application/vnd.android.package-archive') {
            download = asset.browser_download_url
            return false
        } else {
            return true
        }
    })
    dlVersion = body.tag_name
    dlLink = download
    dlPage = body.html_url
    dlLast = Date.now()
}

router.get('/client/latest', async (req, res) => { 
    try {
        // Only updates result once every 30 mins
        if (!dlLast || Date.now().toFixed() - dlLast.toFixed() > 30 * 60 * 1000) {
            await setDlLink()
        }
        if (dlLink.length === 0) {
            return res.status(502).send({
                error: 502,
                message: 'The download URL could not be found.'
            })
        }

        if (req.query.dl && req.query.dl === 'true') {
            return res.redirect(dlLink)
        } else {
            return res.send({ version: dlVersion, download: dlLink, page: dlPage })
        }
    } catch (e) {
        console.log(e)
        return res.status(502).send({
            error: 502,
            message: 'The GitHub server could not be reached.'
        })
    }
})

// Deletes all AppClient data
router.get('/nuke', basicAuth({
    users: { admin: process.env.ADMIN_PW },
    challenge: true
}), (req, res) => {
    AppClient.deleteMany({}, (e) => {
        if (e) {
            res.send(500)
        } else {
            res.send('Database wiped')
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