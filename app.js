const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const historyRoutes = require('./routes/history');
const educationalRoutes = require('./routes/educational');


mongoose.connect('mongodb://localhost:27017/database', {
    useNewUrlParser: true,
    useUnifiedTopology: true

});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Configuration
app.use(session({
    secret: 'chromavision-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Flash messages
app.use(flash());

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to pass variables to templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});




// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/history', historyRoutes);
app.use('/educational', educationalRoutes);



app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.listen(3000, () => {
    console.log('ChromaVision serving on portal 3000')
})

app.get('/profile', (req, res) => {
    res.render('profile');
});


const profileRoutes = require('./routes/profile');
app.use('/profile', profileRoutes);

const multer = require('multer');

// Set limit for file size (in bytes)
const upload = multer({
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB
}).single('file'); // Assuming you're uploading a single file

// Use multer middleware in your route
app.post('/upload', upload, (req, res) => {
    // Handle the file upload
});

app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ limit: '5000mb', extended: true }));




app.use('/history', historyRoutes); // ✅ this is correct



const errorHandler = (err, req, res, next) => {
    // Log the error with details
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        user: req.user ? req.user._id : 'unauthenticated'
    });

    // Handle different error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'The submitted data is invalid',
            details: err.message
        });
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'Duplicate Error',
                message: 'This record already exists'
            });
        }
    }

    // Client-facing error response
    if (req.xhr || req.path.includes('/api/')) {
        // API response
        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.name || 'Server Error',
            message: err.message || 'An unexpected error occurred'
        });
    } else {
        // Web response with flash message
        if (req.flash) {
            req.flash('error', err.message || 'An unexpected error occurred');
        }
        return res.status(err.statusCode || 500).render('error', {
            title: 'Error',
            error: {
                status: err.statusCode || 500,
                message: err.message || 'An unexpected error occurred'
            }
        });
    }
};

module.exports = errorHandler;