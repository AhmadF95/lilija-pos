// cypress/support/commands.js
// Custom commands for Lilija POS testing

Cypress.Commands.add('waitForAuthOverlay', () => {
  cy.get('#authOverlay').should('be.visible')
})

Cypress.Commands.add('waitForAppLoad', () => {
  cy.get('#appRoot').should('not.be.hidden')
  cy.get('#authOverlay').should('have.class', 'is-hidden')
})

Cypress.Commands.add('createUser', (username, password) => {
  cy.get('#regUser').type(username)
  cy.get('#regPass').type(password)
  cy.get('#regPass2').type(password)
  cy.get('#doCreate').click()
})

Cypress.Commands.add('loginUser', (username, password) => {
  cy.get('#loginUser').type(username)
  cy.get('#loginPass').type(password)
  cy.get('#doLogin').click()
})