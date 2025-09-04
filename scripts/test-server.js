#!/usr/bin/env node
// scripts/test-server.js - Simple HTTP server for Cypress testing

const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const ROOT_DIR = path.join(__dirname, '..')

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url)
  
  // Security: ensure we stay within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }

    res.statusCode = 200
    res.setHeader('Content-Type', getMimeType(filePath))
    
    // Add CORS headers for development
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    res.end(data)
  })
})

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down test server...')
  server.close(() => {
    process.exit(0)
  })
})