express = require('express')

const app = express()

app.listen()
const port = process.env.PORT || 5500

// Connection Test
app.get('/test', (req, res) => {
    res.send()
})

app.get('*', (req, res) => {
    res.status(404).send()
})

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})