const express = require('express');
const multer = require('multer');
const router = express.Router();
const {uploadImage,transformExistingImage,getImage,deleteImage,listImages,getTransformedImage} = require('../controllers/imageController');
const authMiddleware = require('../middlewares/auth'); // Assuming JWT authentication
const rateLimit = require('express-rate-limit');
const {body} = require('express-validator');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                // Limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.',
});

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

router.post('/upload', authMiddleware,limiter, upload.single('file') ,uploadImage);
router.post('/transform/:id', authMiddleware,limiter,
    [
        body('width').isInt({ min: 1 }).optional(),
        body('height').isInt({ min: 1 }).optional(),
        body('rotation').isInt({ min: 0, max: 360 }).optional(),
        body('format').isIn(['jpeg', 'png', 'jpg']).optional(),
        body('watermarkText').isString().optional(),
        body('watermarkOpacity').isFloat().optional(),
        body('saveImage').isIn(['true','false'])
    ],transformExistingImage);

router.get('/:id', authMiddleware, getImage);
router.delete('/:id',authMiddleware,deleteImage);
router.get('/list',authMiddleware,limiter,listImages);
router.get('/transformedImage/:id',limiter,getTransformedImage);
module.exports = router;
