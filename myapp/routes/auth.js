// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Show login form
router.get('/login', (req, res) => {
  res.render('login'); // make sure views/login.jade exists
});

// Handle login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);         // Passport error
    if (!user) return res.render('login', { error: info.message }); // invalid login

    req.logIn(user, (err) => {
      if (err) return next(err);
      // ✅ SUCCESS: redirect to main page
      return res.redirect('/products'); 
    });
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login'); // after logout, go back to login page
  });
});

module.exports = router;
