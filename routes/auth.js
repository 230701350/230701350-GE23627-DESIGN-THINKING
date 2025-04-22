const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sudharshan2k5@gmail.com',
        pass: 'lsoi flty xapd beri' // Use the app password here, not your regular password
    }
});


// Register Form
router.get('/register', (req, res) => {
    res.render('register');
});

// Register Logic
router.post('/register', async (req, res) => {
    try {
        const { email, username, name, password } = req.body;
        const user = new User({ email, username, name });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to ChromaVision!');
            res.redirect('/dashboard');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
});

// Login Form
router.get('/login', (req, res) => {
    res.render('login');
});

// Login Logic
router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), (req, res) => {

    req.session.user = {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        preferences: req.user.preferences || { defaultCVDType: 'Protanopia' }
    };

    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});





// Logout
router.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
});

// Forgot Password
router.get('/forgot', (req, res) => {
    res.render('forgot');
});

router.post('/forgot', async (req, res, next) => {
    try {
        const token = crypto.randomBytes(20).toString('hex');
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            req.flash('error', 'No account with that email exists.');
            return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Setup email - in production, use proper email service
        const smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'youremail@gmail.com',
                pass: process.env.GMAIL_PW
            }
        });


        const resetUrl = `http://localhost:3000/reset/${token}`;
        const mailOptions = {
            to: user.email,
            from: 'passwordreset@chromavision.com',
            subject: 'ChromaVision Password Reset',
            text: `You are receiving this because you requested a password reset.
                   Please click on the following link to complete the process:
                   http://${req.headers.host}/reset/${token}
                   If you did not request this, please ignore this email.`
        };

        await transporter.sendMail(mailOptions);
        smtpTransport.sendMail(mailOptions);
        req.flash('success', 'An email has been sent with further instructions.');
        res.redirect('/forgot');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred.');
        res.redirect('/forgot');
    }
});

// Reset Password
router.get('/reset/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }

        // Log for debugging
        console.log('Rendering reset template with token:', req.params.token);

        res.render('reset', {
            token: req.params.token,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (err) {
        console.error('Reset page error:', err);
        req.flash('error', 'An error occurred.');
        res.redirect('/forgot');
    }
});

router.post('/reset/:token', async (req, res) => {
    try {
        if (req.body.password !== req.body.confirm) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('back');
        }

        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }

        await user.setPassword(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.login(user, err => {
            if (err) return next(err);
            req.flash('success', 'Your password has been changed successfully.');
            res.redirect('/dashboard');
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred.');
        res.redirect('/reset');
    }
});

// In your app.js or index.js
const historyRoutes = require('./history');
// app.use('/history', historyRoutes);

module.exports = router;