var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var methodOverride = require('method-override');
var productsRouter = require('./routes/products');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/User');

const authRouter = require('./routes/auth');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var productsRouter = require('./routes/products');

// ====== DEFINE APP ======
var app = express(); // ✅ This was missing before

// ====== VIEW ENGINE SETUP ======
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// ====== MIDDLEWARE ======
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// ====== SESSION & PASSPORT ======
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// ====== SET CURRENT USER FOR VIEWS ======
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'Incorrect username' });

    const match = await user.comparePassword(password);
    if (!match) return done(null, false, { message: 'Incorrect password' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// ====== ROUTES ======
app.use('/', authRouter);       // auth routes
app.use('/', indexRouter);      // index/home routes
app.use('/users', usersRouter); // user routes
app.use('/products', productsRouter); // product routes



// ====== CATCH 404 ======
app.use(function(req, res, next) {
  next(createError(404));
});

// ====== ERROR HANDLER ======
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
