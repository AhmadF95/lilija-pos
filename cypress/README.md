# Cypress E2E Testing

This directory contains end-to-end tests for the Lilija POS application using Cypress.

## Directory Structure

```
cypress/
├── e2e/                    # E2E test files
│   └── auth-flow.cy.js    # Authentication flow tests
├── fixtures/              # Test data
│   └── users.json         # Sample user data
└── support/               # Support files and custom commands
    ├── commands.js        # Custom Cypress commands
    └── e2e.js            # Global configuration
```

## Running Tests

### Prerequisites
Make sure all dependencies are installed:
```bash
npm install
```

### Run Tests in Headless Mode
```bash
npm run test:e2e
```

### Open Cypress Test Runner (GUI)
```bash  
npm run test:e2e:open
```

### Run Individual Commands
Start test server:
```bash
npm run test:server
```

Run Cypress directly:
```bash
npm run cypress:run    # Headless mode
npm run cypress:open   # GUI mode
```

## Test Coverage

The current test suite covers:

### Authentication Flow (`auth-flow.cy.js`)
- **Initial User Registration**
  - Shows registration form when no users exist
  - Validates required fields
  - Validates password confirmation
  - Successfully creates first user account

- **User Login**  
  - Shows login form when users exist
  - Validates required fields
  - Shows error for invalid credentials

- **Session Management**
  - Maintains session after successful login
  - Logout functionality and session clearing

- **UI Language Support**
  - Arabic interface display
  - Proper RTL text direction

## Custom Commands

The following custom commands are available in tests:

- `cy.waitForAuthOverlay()` - Waits for authentication overlay to appear
- `cy.waitForAppLoad()` - Waits for main app to load after login
- `cy.createUser(username, password)` - Helper to create a new user
- `cy.loginUser(username, password)` - Helper to login with credentials

## Configuration

Cypress configuration is in `cypress.config.js`:
- Base URL: `http://localhost:3000`
- Viewport: 1200x800 (matches Electron app window)
- Screenshots enabled on test failures
- Video recording disabled for faster runs

## Development Notes

- Tests use a simple HTTP server (`scripts/test-server.js`) to serve the HTML app
- The test server serves all static files from the project root
- localStorage and sessionStorage are cleared before each test
- Tests simulate user interactions with form elements and buttons
- Arabic text and RTL support is tested as part of the UI validation