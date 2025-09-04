// cypress/support/e2e.js
// Import commands.js using ES2015 syntax:
import './commands'

// Clear localStorage and sessionStorage before each test
beforeEach(() => {
  cy.clearAllLocalStorage()
  cy.clearAllSessionStorage()
})