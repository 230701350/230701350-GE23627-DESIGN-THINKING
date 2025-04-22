const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

// const ImageSchema = new Schema({
//     filename: String,
//     originalUrl: String,
//     correctedUrl: String,
//     processType: String, // 'Protanopia', 'Deuteranopia', or 'Tritanopia'
//     timestamp: {
//         type: Date,
//         default: Date.now
//     }
// });



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
//         required: true
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

const UserSchema = new Schema({
    name: String,
    email: String,
    profileImage: String, // Added for profile picture functionality
    preferences: {
        defaultCVDType: {
            type: String,
            enum: ['Protanopia', 'Deuteranopia', 'Tritanopia'],
            default: 'Protanopia'
        },
        interfaceTheme: {
            type: String,
            enum: ['standard', 'high-contrast', 'dark'],
            default: 'standard'
        },
        showSideBySide: {
            type: Boolean,
            default: true
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    //imageHistory: [imageHistorySchema]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);