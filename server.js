module.exports = async (PORT) => {

    const express = require('express')
    const app = express()
    const cors = require('cors')

    const http = require('http')
    const server = http.createServer(app)

    app.use(cors())

    const auth_api = require('./auth_api')
    app.use('/api/auth', auth_api)

    const key_api = require('./key_api')
    app.use('/api/key', key_api)

    const key_socket_api = require('./key_socket_api')
    key_socket_api.attach(server)

    const dist_dir = __dirname + '/dist'
    if (require('fs').existsSync(dist_dir)) {
        app.use(express.static(dist_dir))
        app.use((req, res) => res.sendFile(dist_dir + '/index.html'))
    }

    server.on('close', () => console.log('KEY-DB server closed'))
    server.listen(PORT)
    console.log('KEY-DB server listening on', PORT)

    return server
}