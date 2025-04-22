// controllers/imageController.js
const ImageHistory = require('../models/imagehistory');

// Function to save a processed image to history
exports.saveProcessedImage = async (req, res) => {
    try {
        const { originalImageUrl, processedImageUrl, cvdType, title, description } = req.body;

        // Validate required fields
        if (!originalImageUrl || !processedImageUrl || !cvdType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create new image history entry
        const newImageEntry = new ImageHistory({
            userId: req.user._id,
            originalImageUrl,
            processedImageUrl,
            cvdType,
            metadata: {
                title,
                description
            }
        });

        // Save to database
        await newImageEntry.save();

        res.status(200).json({
            success: true,
            message: 'Image processed and saved to history',
            imageId: newImageEntry._id
        });
    } catch (error) {
        console.error('Error saving processed image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save image to history'
        });
    }
};

// Function to get user's image history
exports.getUserImageHistory = async (req, res) => {
    try {
        const images = await ImageHistory.find({ userId: req.user._id })
            .sort({ processedDate: -1 });

        res.status(200).json({
            success: true,
            images
        });
    } catch (error) {
        console.error('Error fetching image history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch image history'
        });
    }
};

// Function to delete an image
exports.deleteImage = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the image
        const image = await ImageHistory.findById(id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Check if the image belongs to the user
        if (image.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this image'
            });
        }

        // Delete the image
        await ImageHistory.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete image'
        });
    }
};