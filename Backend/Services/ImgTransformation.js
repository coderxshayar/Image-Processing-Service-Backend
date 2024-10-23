const {getImagefromS3,UploadImagetoS3,deleteImageFromS3,getObjectUrl} = require('./AWS')
const sharp = require('sharp');
const Image = require('../models/Image')
const Job = require('../models/Job');
const {cacheImage,getCachedImage} = require('./Cache');

const processTransformationJob=async (job)=>{
    const {JobId, imageId,saveImage,transformations} = JSON.parse(job.content.toString());
    const {width, height, rotation, format, watermarkText ,watermarkOpacity} = transformations;
    if(!imageId || !JobId) return;
    try{
        const image = await Image.findById(imageId);
        if (!image) {
            console.error('Image not found in the database.');
            return;
        }
        let imageBuffer;
        imageBuffer = await getCachedImage(`${imageId}_transformed`);
        if (imageBuffer) {
            console.log('Serving transformed image from Redis');
        } else {
            imageBuffer = await getCachedImage(imageId);
            if (imageBuffer) {
             console.log('Serving original image from Redis');
            } 
        else {
        
            const imageFromS3 = await getImagefromS3(image.key);
            if (!imageFromS3.Body) {
            throw new Error('Failed to fetch image from S3');
            }

            imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            imageFromS3.Body.on('data', (chunk) => chunks.push(chunk));
            imageFromS3.Body.on('end', () => resolve(Buffer.concat(chunks)));
            imageFromS3.Body.on('error', reject);
        });

        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Invalid or empty image buffer from S3');
        }

        console.log('Image buffer fetched from S3:', imageBuffer.length);
        console.log('Storing image buffer to Redis');
        await cacheImage(imageId, imageBuffer);
    }
}

if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Invalid or empty image buffer');
}

let transformedImage = sharp(imageBuffer);

        // Apply resizing if width or height is provided
        if (width || height) {
            console.log(`Resizing image to width: ${width}, height: ${height}`);
            transformedImage = transformedImage.resize({
                width: width ? parseInt(width) : null,
                height: height ? parseInt(height) : null,
                fit: 'cover'
            });
        }
    
        // Apply rotation if specified
        if (rotation) {
            console.log(`Rotating image by ${rotation} degrees`);
            transformedImage = transformedImage.rotate(parseInt(rotation));
        }
    
        // Apply cropping if specified
        // if (crop && crop.x && crop.y && crop.width && crop.height) {
        //     transformedImage = transformedImage.extract({
        //         left: parseInt(crop.x),
        //         top: parseInt(crop.y),
        //         width: parseInt(crop.width),
        //         height: parseInt(crop.height)
        //     });
        // }
    
        // Apply format change if specified
        if (format) {
            console.log(`Converting image to format: ${format}`);
            transformedImage = transformedImage.toFormat(format);
        }
    
        // Add watermark if specified
        if (watermarkText) {
            console.log(`Applying watermark with text: ${watermarkText}`);
            transformedImage = transformedImage.composite([{
                input: Buffer.from(
                    `<svg width="200" height="200">
                        <text x="10" y="50" font-size="20" opacity="${watermarkOpacity || 0.5}" fill="white">
                            ${watermarkText}
                        </text>
                    </svg>`
                ),
                gravity: 'southeast'
            }]);
        }
    
        // Convert the transformed image to a buffer
        const transformedBuffer = await transformedImage.toBuffer();
        
        //if saveImage is false save in redis
        if(!saveImage){
            await cacheImage(`${imageId}_transformed`,transformedBuffer);
        }else{   // save in s3 and delete previous image

            const transformedKey = `uploads/user-uploads/${Date.now()}-${image.originalFilename.split('.')[0]}.${format ||image.originalFilename.split('.')[1]}`;
            await UploadImagetoS3(transformedKey, transformedBuffer, image.contentType);
            await deleteImageFromS3(image.key); // Deleting the previous image
            console.log("New image uplaoded to the S3")
            // Update only the defined transformation fields in the database
            const newS3Url = await getObjectUrl(transformedKey);
            image.imageUrl = newS3Url;
            image.key = transformedKey;
            image.contentType= format || image.contentType
            await image.save().then("upadated DB imageurl");
        }
    
        image.transformation = {
            ...image.transformation,  // Preserve existing transformations
            width: width ? parseInt(width) : image.transformation.width,
            height: height ? parseInt(height) : image.transformation.height,
            format: format || image.transformation.format,
            rotation: rotation ? parseInt(rotation) : image.transformation.rotation,
            // // Only update crop if all values are provided
            // ...(crop && crop.x !== undefined && crop.y !== undefined && crop.width !== undefined && crop.height !== undefined
            //     ? { crop: crop }
            //     : {}),
            watermark: {
                text: watermarkText || image.transformation.watermark.text,
                opacity: watermarkOpacity ? parseFloat(watermarkOpacity) : image.transformation.watermark.opacity
            }
        };
        await image.save();
        const pendingJob = await Job.findByIdAndUpdate(JobId,{
            status:"completed",
            transformedImageUrl: saveImage ? image.imageUrl : null
        });
        await pendingJob.save();



    } catch(error){
        console.error('Error processing job:', error);
        
    }

}

module.exports=processTransformationJob;