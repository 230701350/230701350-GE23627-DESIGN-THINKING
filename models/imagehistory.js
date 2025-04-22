// // models/imagehistory.js
// const mongoose = require('mongoose');

// const imageHistorySchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     originalImageUrl: {
//         type: String,
//         required: true
//     },
//     processedImageUrl: {
//         type: String,
//         required: true
//     },
//     cvdType: {
//         type: String,
//         required: true,
//         enum: ['Protanopia', 'Deuteranopia', 'Tritanopia']
//     },
//     metadata: {
//         type: Object,
//         default: {}
//     },
//     processedDate: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('ImageHistory', imageHistorySchema);

// models/imagehistory.js
const mongoose = require('mongoose');

const imageHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalImageUrl: {
        type: String,
        required: true
    },
    processedImageUrl: {
        type: String,
        required: true
    },
    cvdType: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    processedDate: {
        type: Date,
        default: Date.now
    }
});

// Check if model exists before defining
const ImageHistory = mongoose.models.ImageHistory ||
    mongoose.model('ImageHistory', imageHistorySchema);

module.exports = ImageHistory;