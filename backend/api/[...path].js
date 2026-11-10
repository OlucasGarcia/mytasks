import { createServer } from '../server.js'

const server = createServer()

export default function handler(request, response) {
    server.emit('request', request, response)
}
