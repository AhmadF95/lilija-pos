// cypress/e2e/auth-flow.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/')
    // Wait for the page to load and auth overlay to appear
    cy.waitForAuthOverlay()
  })

  describe('Initial User Registration', () => {
    it('should show registration form when no users exist', () => {
      // When no users exist, the app should show registration form
      cy.get('#authTitle').should('contain.text', 'إنشاء حساب جديد') // Arabic: Create New Account
      cy.get('#regUser').should('be.visible')
      cy.get('#regPass').should('be.visible')
      cy.get('#regPass2').should('be.visible')
      cy.get('#doCreate').should('be.visible')
    })

    it('should validate required fields for registration', () => {
      // Try to register without filling fields
      cy.get('#doCreate').click()
      
      // Should show an alert for empty username/password
      cy.window().its('alert').should('have.been.called')
    })

    it('should validate password confirmation mismatch', () => {
      cy.get('#regUser').type('testuser')
      cy.get('#regPass').type('password123')
      cy.get('#regPass2').type('different_password')
      cy.get('#doCreate').click()
      
      // Should show password mismatch alert
      cy.window().its('alert').should('have.been.called')
    })

    it('should successfully create the first user account', () => {
      const username = 'admin'
      const password = 'admin123'

      // Stub the alert to capture successful account creation
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.createUser(username, password)
      
      // Should show account created alert
      cy.get('@windowAlert').should('have.been.calledWith', 'تم إنشاء الحساب بنجاح')
      
      // Should redirect to login form
      cy.get('#authTitle').should('contain.text', 'تسجيل الدخول') // Arabic: Login
      cy.get('#loginUser').should('be.visible')
      cy.get('#loginPass').should('be.visible')
      cy.get('#doLogin').should('be.visible')
    })
  })

  describe('User Login', () => {
    beforeEach(() => {
      // Create a test user first
      const testUser = { username: 'testuser', salt: 'testsalt', hash: 'testhash' }
      cy.window().then((win) => {
        win.localStorage.setItem('lilija.users', JSON.stringify([testUser]))
        // Reload to show login form
        cy.reload()
        cy.waitForAuthOverlay()
      })
    })

    it('should show login form when users exist', () => {
      cy.get('#authTitle').should('contain.text', 'تسجيل الدخول') // Arabic: Login
      cy.get('#loginUser').should('be.visible')
      cy.get('#loginPass').should('be.visible')
      cy.get('#doLogin').should('be.visible')
    })

    it('should validate required fields for login', () => {
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      // Try to login without filling fields
      cy.get('#doLogin').click()
      
      // Should show alert for empty username/password
      cy.get('@windowAlert').should('have.been.called')
    })

    it('should show error for invalid credentials', () => {
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert')
      })

      cy.loginUser('invaliduser', 'invalidpass')
      
      // Should show invalid credentials alert
      cy.get('@windowAlert').should('have.been.called')
    })
  })

  describe('User Session Management', () => {
    it('should maintain session after successful login', () => {
      // Create a test user and simulate successful login by setting session
      const testUser = { username: 'testuser', salt: 'testsalt', hash: 'testhash' }
      cy.window().then((win) => {
        win.localStorage.setItem('lilija.users', JSON.stringify([testUser]))
        win.sessionStorage.setItem('lilija.session', JSON.stringify({ username: 'testuser' }))
        cy.reload()
      })

      // Should bypass auth and show main app
      cy.waitForAppLoad()
      cy.get('#whoami').should('contain', 'testuser')
      cy.get('#btnLogout').should('be.visible')
    })

    it('should logout and clear session', () => {
      // Set up logged in state
      const testUser = { username: 'testuser', salt: 'testsalt', hash: 'testhash' }
      cy.window().then((win) => {
        win.localStorage.setItem('lilija.users', JSON.stringify([testUser]))
        win.sessionStorage.setItem('lilija.session', JSON.stringify({ username: 'testuser' }))
        cy.reload()
      })

      // Verify logged in state
      cy.waitForAppLoad()
      cy.get('#btnLogout').should('be.visible')

      // Click logout
      cy.get('#btnLogout').click()

      // Should redirect to login/auth overlay
      cy.waitForAuthOverlay()
      cy.get('#authTitle').should('be.visible')
    })
  })

  describe('UI Language Support', () => {
    it('should display Arabic interface by default', () => {
      cy.get('html').should('have.attr', 'lang', 'ar')
      cy.get('html').should('have.attr', 'dir', 'rtl')
    })

    it('should have proper Arabic text in auth forms', () => {
      // Check for Arabic labels and text
      cy.get('body').should('contain', 'اسم المستخدم') // Username
      cy.get('body').should('contain', 'كلمة المرور') // Password
    })
  })
})