#!/usr/bin/env node
// scripts/validate-e2e-setup.js - Validate E2E test setup without running Cypress

const fs = require('fs')
const path = require('path')
const http = require('http')

console.log('🧪 Validating E2E Test Setup...\n')

// 1. Check files exist
console.log('📁 Checking file structure...')
const requiredFiles = [
  'cypress.config.js',
  'cypress/e2e/auth-flow.cy.js',
  'cypress/e2e/smoke-test.cy.js',
  'cypress/support/e2e.js',
  'cypress/support/commands.js',
  'cypress/fixtures/users.json',
  'scripts/test-server.js'
]

let allFilesExist = true
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - MISSING`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!')
  process.exit(1)
}

// 2. Test server functionality
console.log('\n🌐 Testing server functionality...')

const testServer = () => {
  return new Promise((resolve, reject) => {
    // Start the test server
    const testServerPath = path.join(__dirname, 'test-server.js')
    const { spawn } = require('child_process')
    
    const server = spawn('node', [testServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '3001' } // Use different port to avoid conflicts
    })
    
    let serverStarted = false
    
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Test server running')) {
        serverStarted = true
        
        // Test the server
        const req = http.request({
          hostname: 'localhost',
          port: 3001,
          path: '/',
          method: 'GET'
        }, (res) => {
          if (res.statusCode === 200) {
            console.log('  ✅ Server responds with status 200')
            
            // Test static file serving
            const staticReq = http.request({
              hostname: 'localhost', 
              port: 3001,
              path: '/i18n/en.js',
              method: 'GET'
            }, (staticRes) => {
              if (staticRes.statusCode === 200) {
                console.log('  ✅ Static files served correctly')
                server.kill()
                resolve()
              } else {
                console.log(`  ❌ Static file serving failed: ${staticRes.statusCode}`)
                server.kill()
                reject(new Error('Static file test failed'))
              }
            })
            
            staticReq.on('error', (err) => {
              console.log(`  ❌ Static file request error: ${err.message}`)
              server.kill()
              reject(err)
            })
            
            staticReq.end()
          } else {
            console.log(`  ❌ Server responded with status ${res.statusCode}`)
            server.kill()
            reject(new Error(`Server test failed with status ${res.statusCode}`))
          }
        })
        
        req.on('error', (err) => {
          console.log(`  ❌ Server request error: ${err.message}`)
          server.kill()
          reject(err)
        })
        
        req.end()
      }
    })
    
    server.on('error', (err) => {
      reject(err)
    })
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!serverStarted) {
        server.kill()
        reject(new Error('Server startup timeout'))
      }
    }, 5000)
  })
}

testServer()
  .then(() => {
    // 3. Validate test content
    console.log('\n📝 Validating test content...')
    
    const authTest = fs.readFileSync(path.join(__dirname, '..', 'cypress/e2e/auth-flow.cy.js'), 'utf8')
    const smokeTest = fs.readFileSync(path.join(__dirname, '..', 'cypress/e2e/smoke-test.cy.js'), 'utf8')
    
    // Check for key test scenarios
    const testChecks = [
      { name: 'Registration flow test', check: authTest.includes('Initial User Registration') },
      { name: 'Login flow test', check: authTest.includes('User Login') }, 
      { name: 'Session management test', check: authTest.includes('Session Management') },
      { name: 'UI language test', check: authTest.includes('UI Language Support') },
      { name: 'Smoke test', check: smokeTest.includes('Application Smoke Test') },
      { name: 'Custom commands', check: authTest.includes('cy.createUser') && authTest.includes('cy.loginUser') }
    ]
    
    let allTestsValid = true
    testChecks.forEach(({ name, check }) => {
      if (check) {
        console.log(`  ✅ ${name}`)
      } else {
        console.log(`  ❌ ${name} - MISSING`)
        allTestsValid = false
      }
    })
    
    // 4. Check package.json scripts
    console.log('\n📦 Checking NPM scripts...')
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
    
    const scriptChecks = [
      'cypress:run',
      'cypress:open', 
      'test:e2e',
      'test:server',
      'test:e2e:open'
    ]
    
    let allScriptsExist = true
    scriptChecks.forEach(script => {
      if (packageJson.scripts[script]) {
        console.log(`  ✅ ${script}`)
      } else {
        console.log(`  ❌ ${script} - MISSING`)
        allScriptsExist = false
      }
    })
    
    if (allFilesExist && allTestsValid && allScriptsExist) {
      console.log('\n🎉 E2E Test Setup Validation Complete!')
      console.log('\n✅ All checks passed. The Cypress E2E test infrastructure is properly set up.')
      console.log('\nTo run the tests:')
      console.log('  npm run test:e2e       # Run tests in headless mode')
      console.log('  npm run test:e2e:open  # Open Cypress GUI')
      process.exit(0)
    } else {
      console.log('\n❌ Some validation checks failed!')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.log(`\n❌ Server test failed: ${error.message}`)
    process.exit(1)
  })