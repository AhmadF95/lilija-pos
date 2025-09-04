// cypress/e2e/smoke-test.cy.js
// Basic smoke test to verify the app loads correctly

describe('Application Smoke Test', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the main page successfully', () => {
    // Check that the page title contains "Lilija"
    cy.title().should('contain', 'Lilija')
    
    // Check that the HTML has correct language attributes
    cy.get('html').should('have.attr', 'lang', 'ar')
    cy.get('html').should('have.attr', 'dir', 'rtl')
  })

  it('should display the authentication overlay by default', () => {
    // The auth overlay should be visible when no user is logged in
    cy.get('#authOverlay').should('exist')
    cy.get('#authOverlay').should('be.visible')
    
    // The main app should be hidden initially
    cy.get('#appRoot').should('be.hidden')
  })

  it('should have proper CSS and styling loaded', () => {
    // Check that CSS variables are applied (dark theme by default)
    cy.get('body').should('have.css', 'margin', '0px')
    
    // Check that the auth overlay has flex display
    cy.get('#authOverlay').should('have.css', 'display', 'flex')
  })

  it('should load JavaScript modules successfully', () => {
    cy.window().should('have.property', 'App')
    cy.window().should('have.property', 'loadUsers')
    cy.window().should('have.property', 'saveUsers')
    cy.window().should('have.property', 'setSession')
    cy.window().should('have.property', 'getSession')
  })

  it('should display registration form when no users exist', () => {
    // Clear localStorage to ensure no users exist
    cy.clearLocalStorage()
    cy.reload()
    
    // Should show create account form
    cy.get('#authTitle').should('be.visible')
    
    // Registration form elements should exist in the DOM
    // (They might be created dynamically by renderCreate)
    cy.get('body').should('contain.text', 'اسم المستخدم') // Username in Arabic
  })
})