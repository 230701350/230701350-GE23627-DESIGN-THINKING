const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isLoggedIn } = require('../middleware');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploads/profiles';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images Only!'));
        }
    }
});

// Profile page - Make sure app.js has the route set up correctly
router.get('/', isLoggedIn, (req, res) => {
    res.render('profile');
});

// Update personal information
router.post('/update', isLoggedIn, async (req, res) => {
    try {
        const { name, email } = req.body;
        console.log('Updating user profile:', { name, email }); // Debug log

        await User.findByIdAndUpdate(req.user._id, {
            name: name,
            email: email
        });

        req.flash('success', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        req.flash('error', 'Failed to update profile');
        res.redirect('/profile');
    }
});

// Update CVD preferences
router.post('/update-preferences', isLoggedIn, async (req, res) => {
    try {
        const { defaultCVDType, interfaceTheme } = req.body;
        const showSideBySide = req.body.showSideBySide === 'on';

        const user = await User.findById(req.user._id);

        // Initialize preferences object if it doesn't exist
        if (!user.preferences) {
            user.preferences = {};
        }

        user.preferences.defaultCVDType = defaultCVDType;
        user.preferences.interfaceTheme = interfaceTheme;
        user.preferences.showSideBySide = showSideBySide;

        await user.save();

        req.flash('success', 'Preferences updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating preferences:', err);
        req.flash('error', 'Failed to update preferences');
        res.redirect('/profile');
    }
});

// Change password
router.post('/change-password', isLoggedIn, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match');
            return res.redirect('/profile');
        }

        // Change the password - using Passport-Local Mongoose's changePassword method
        req.user.changePassword(currentPassword, newPassword, (err) => {
            if (err) {
                if (err.name === 'IncorrectPasswordError') {
                    req.flash('error', 'Current password is incorrect');
                    return res.redirect('/profile');
                }
                req.flash('error', 'An error occurred when changing your password');
                console.error(err);
                return res.redirect('/profile');
            }

            req.flash('success', 'Password changed successfully');
            return res.redirect('/profile');
        });
    } catch (err) {
        console.error('Error changing password:', err);
        req.flash('error', 'Failed to change password');
        res.redirect('/profile');
    }
});

// Upload profile image
router.post('/upload-image', isLoggedIn, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'Please select an image to upload');
            return res.redirect('/profile');
        }

        // Update user with new profile image path
        const imagePath = `/uploads/profiles/${req.file.filename}`;

        const user = await User.findById(req.user._id);

        // Delete old profile image if it exists
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, '..', 'public', user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        user.profileImage = imagePath;
        await user.save();

        req.flash('success', 'Profile picture updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error('Error uploading profile picture:', err);
        req.flash('error', 'Failed to upload profile picture');
        res.redirect('/profile');
    }
});

// Delete account
router.post('/delete-account', isLoggedIn, async (req, res) => {
    try {
        const { confirmDelete } = req.body;

        // Verify password before deleting
        req.user.authenticate(confirmDelete, async (err, user, passwordErr) => {
            if (err) {
                req.flash('error', 'An error occurred');
                console.error(err);
                return res.redirect('/profile');
            }

            if (!user) {
                req.flash('error', 'Password is incorrect');
                return res.redirect('/profile');
            }

            // Delete profile image if it exists
            if (user.profileImage) {
                const imagePath = path.join(__dirname, '..', 'public', user.profileImage);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            // Delete the user
            await User.findByIdAndDelete(user._id);

            // Log the user out
            req.logout(function (err) {
                if (err) {
                    console.error(err);
                }
                req.flash('success', 'Your account has been deleted');
                res.redirect('/');
            });
        });
    } catch (err) {
        console.error('Error deleting account:', err);
        req.flash('error', 'Failed to delete account');
        res.redirect('/profile');
    }
});

module.exports = router;