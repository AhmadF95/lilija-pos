// tools/smoke_auth.js - Validate Cypress E2E test infrastructure
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Starting Cypress E2E infrastructure validation...');

// Test 1: Check Cypress configuration file
console.log('Test 1: Cypress configuration');
const cypressConfigPath = path.join(__dirname, '..', 'cypress.config.js');
assert.ok(fs.existsSync(cypressConfigPath), 'cypress.config.js should exist');

const cypressConfig = require(cypressConfigPath);
assert.ok(cypressConfig.e2e, 'Cypress config should have e2e configuration');
assert.ok(cypressConfig.e2e.baseUrl, 'Cypress config should have baseUrl');

// Test 2: Check Cypress directory structure
console.log('Test 2: Directory structure');
const cypressDir = path.join(__dirname, '..', 'cypress');
assert.ok(fs.existsSync(cypressDir), 'cypress directory should exist');
assert.ok(fs.existsSync(path.join(cypressDir, 'e2e')), 'cypress/e2e directory should exist');
assert.ok(fs.existsSync(path.join(cypressDir, 'support')), 'cypress/support directory should exist');
assert.ok(fs.existsSync(path.join(cypressDir, 'fixtures')), 'cypress/fixtures directory should exist');

// Test 3: Check test files
console.log('Test 3: Test files');
const authTestPath = path.join(cypressDir, 'e2e', 'auth-flow.cy.js');
assert.ok(fs.existsSync(authTestPath), 'auth-flow.cy.js should exist');

const authTestContent = fs.readFileSync(authTestPath, 'utf8');
assert.ok(authTestContent.includes('Authentication Flow'), 'Auth test should contain main describe block');
assert.ok(authTestContent.includes('Initial User Registration'), 'Auth test should test registration');
assert.ok(authTestContent.includes('User Login'), 'Auth test should test login');

// Test 4: Check support files  
console.log('Test 4: Support files');
const supportE2ePath = path.join(cypressDir, 'support', 'e2e.js');
const commandsPath = path.join(cypressDir, 'support', 'commands.js');
assert.ok(fs.existsSync(supportE2ePath), 'e2e.js support file should exist');
assert.ok(fs.existsSync(commandsPath), 'commands.js should exist');

const commandsContent = fs.readFileSync(commandsPath, 'utf8');
assert.ok(commandsContent.includes('createUser'), 'Custom createUser command should exist');
assert.ok(commandsContent.includes('loginUser'), 'Custom loginUser command should exist');

// Test 5: Check test server script
console.log('Test 5: Test server');
const testServerPath = path.join(__dirname, '..', 'scripts', 'test-server.js');
assert.ok(fs.existsSync(testServerPath), 'test-server.js should exist');

const testServerContent = fs.readFileSync(testServerPath, 'utf8');
assert.ok(testServerContent.includes('http.createServer'), 'Test server should create HTTP server');
assert.ok(testServerContent.includes('PORT'), 'Test server should support PORT configuration');

// Test 6: Check package.json scripts
console.log('Test 6: NPM scripts');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

assert.ok(packageJson.scripts['cypress:run'], 'cypress:run script should exist');
assert.ok(packageJson.scripts['cypress:open'], 'cypress:open script should exist');
assert.ok(packageJson.scripts['test:e2e'], 'test:e2e script should exist');
assert.ok(packageJson.scripts['test:server'], 'test:server script should exist');

// Test 7: Check dependencies
console.log('Test 7: Dependencies');
assert.ok(packageJson.devDependencies.cypress, 'cypress should be in devDependencies');
assert.ok(packageJson.devDependencies['start-server-and-test'], 'start-server-and-test should be in devDependencies');

// Test 8: Validate fixture data
console.log('Test 8: Fixture files');
const usersFixturePath = path.join(cypressDir, 'fixtures', 'users.json');
assert.ok(fs.existsSync(usersFixturePath), 'users.json fixture should exist');

const usersFixture = JSON.parse(fs.readFileSync(usersFixturePath, 'utf8'));
assert.ok(usersFixture.testUsers, 'Users fixture should have testUsers');
assert.ok(Array.isArray(usersFixture.testUsers), 'testUsers should be an array');

console.log('✓ Cypress E2E infrastructure validation passed');
console.log('smoke:auth ok');