const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');



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