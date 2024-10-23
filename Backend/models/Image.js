const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Reference to the User model
    },
    originalFilename: {
        type: String,
        required: true // Store the original filename
    },
    key:{
        type:String,
        required:true
    },
    imageUrl: {    // storing the s3 url
        type: String, 
        required: true 
    },
    contentType: {
        type: String,
        required: true // MIME type of the image (e.g., image/jpeg)
    },
    transformation: {
        width: {
            type: Number,
            required: false // Width of the transformed image
        },
        height: {
            type: Number,
            required: false // Height of the transformed image
        },
        format: {
            type: String,
            required: false // Format of the transformed image (e.g., jpeg, png)
        },
        rotation: {
            type: Number,
            required: false // Rotation degree for the image
        },
        // crop: {
        //     x: { type: Number, required: false }, // X coordinate for cropping
        //     y: { type: Number, required: false }, // Y coordinate for cropping
        //     width: { type: Number, required: false }, // Crop width
        //     height: { type: Number, required: false } // Crop height
        // },
        watermark: {
            text: {
                type: String,
                required: false // Watermark text if any
            },
            opacity: {
                type: Number,
                required: false // Opacity of the watermark (0 to 1)
            }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set creation date
    }
});


module.exports = mongoose.model('Image', imageSchema);