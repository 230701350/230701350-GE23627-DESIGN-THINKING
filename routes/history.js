// routes/history.js
const express = require('express');
const router = express.Router();
const ImageHistory = require('../models/imagehistory');

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    next();
}

//----------
// Add this to the top of your routes/history.js file
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../public/uploads');
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Modified route to handle file uploads
router.post('/save', isLoggedIn, upload.fields([
    { name: 'originalImage', maxCount: 1 },
    { name: 'processedImage', maxCount: 1 }
]), async (req, res) => {
    try {
        // Check if files exist
        if (!req.files || !req.files.originalImage || !req.files.processedImage) {
            return res.status(400).json({
                success: false,
                message: 'Missing image files'
            });
        }

        const { cvdType, metadata } = req.body;

        // Get file paths
        const originalImagePath = '/uploads/' + req.files.originalImage[0].filename;
        const processedImagePath = '/uploads/' + req.files.processedImage[0].filename;

        // Create new history entry
        const newImage = new ImageHistory({
            userId: req.user._id,
            originalImageUrl: originalImagePath,
            processedImageUrl: processedImagePath,
            cvdType,
            metadata: metadata ? JSON.parse(metadata) : {}
        });

        // Save to database
        await newImage.save();

        res.json({
            success: true,
            message: 'Image saved to history successfully',
            imageId: newImage._id
        });
    } catch (error) {
        console.error('Error saving image to history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save image to history'
        });
    }
});

//---------

// Show history page
router.get('/', isLoggedIn, (req, res) => {
    res.render('history'); // We'll load images via AJAX
});

// API route to get user's image history
router.get('/api/images', isLoggedIn, async (req, res) => {
    try {
        const images = await ImageHistory.find({ userId: req.user._id })
            .sort({ processedDate: -1 });

        res.json({ success: true, images });
    } catch (error) {
        console.error('Error fetching image history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch image history'
        });
    }
});

// Get a specific image detail
router.get('/api/images/:id', isLoggedIn, async (req, res) => {
    try {
        const image = await ImageHistory.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        if (image.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this image'
            });
        }

        res.json({ success: true, image });
    } catch (error) {
        console.error('Error fetching image detail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch image detail'
        });
    }
});

// Delete an image from history
router.delete('/api/images/:id', isLoggedIn, async (req, res) => {
    try {
        const image = await ImageHistory.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        if (image.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this image'
            });
        }

        await ImageHistory.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image'
        });
    }
});

// Batch delete images
router.post('/api/images/batch-delete', isLoggedIn, async (req, res) => {
    try {
        const { imageIds } = req.body;

        if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images specified for deletion'
            });
        }

        // Find images that belong to this user
        const imagesToDelete = await ImageHistory.find({
            _id: { $in: imageIds },
            userId: req.user._id
        });

        const validImageIds = imagesToDelete.map(img => img._id);

        await ImageHistory.deleteMany({
            _id: { $in: validImageIds }
        });

        res.json({
            success: true,
            message: `${validImageIds.length} images deleted successfully`
        });
    } catch (error) {
        console.error('Error batch deleting images:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete images'
        });
    }
});




module.exports = router;