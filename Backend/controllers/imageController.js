const { validationResult } = require('express-validator');
const { redisClient } = require('../Services/Cache');
const Image = require('../models/Image');
const Job = require('../models/Job');
const { UploadImagetoS3, getObjectUrl} = require('../Services/AWS');
const { getCachedImage } = require('../Services/Cache');
const {sendToQueue} = require('../Services/RabbitMQ')


// Image Upload 
const uploadImage = async (req, res) => {
    
    
    if (!req.file) return res.status(400).send('No file uploaded');
    
    try {
        // Unique key for storing the image in S3
        const imgkey = `uploads/user-uploads/${Date.now()}-${req.file.originalname}`;

        // Uploading the image to S3
        await UploadImagetoS3(imgkey, req.file.buffer, req.file.mimetype);

        // getting the S3 URL
        const s3Url = await getObjectUrl(imgkey);

        // Saving image metadata to the database
        const newImage = new Image({
            userId: req.user.id,
            originalFilename: req.file.originalname,
            imageUrl: s3Url,   // Storing the S3 URL
            key: imgkey,       // S3 key for retrieving the image
            contentType: req.file.mimetype, // Image MIME type
        });

        const savedImage = await newImage.save();

        res.status(200).send({ message: 'Image uploaded and saved', id: savedImage._id , url:savedImage.imageUrl});
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        res.status(500).send('Error uploading image to S3');
    }
};

// Retrieve Image from Database
const getImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).send('Image not found');
        
        // Generating a presigned URL for accessing the image in S3
        // const url = await getObjectUrl(image.key);

        // Returning the signed URL
        res.status(200).send({ imageUrl: image.imageUrl });
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).send('Error retrieving image');
    }
};

// Transform Existing Image
const transformExistingImage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { width, height, rotation ,format,watermarkText,watermarkOpacity,saveImage} = req.body;
    //console.log("req.body: ", req.body);
   
    
    if(!width && !height && !rotation && !watermarkText && !watermarkOpacity && !saveImage) 
        return res.status(400).json({message: "You must give at least one attribute to transform"});

    try {
        // Find the existing image by its ID
        const imageId = req.params.id;
        if (!imageId) return res.status(404).send('Image Id required');
        
        //new job 
        const job = new Job({ imageId, status: 'pending' });
        await job.save();
        
        await sendToQueue(job._id, imageId, saveImage,{ width, height, rotation, format, watermarkText ,watermarkOpacity});
        res.status(202).json({ message: 'Job submitted successfully', jobId: job._id });
        // res.status(200).send({ message: 'Image transformed successfully', imageId: image._id, imageUrl: image.imageUrl });
    } catch (error) {
        console.error('Error transforming image:', error);
        res.status(500).send('Error transforming image');
    }
};
// checks for transformed image in redis called for polling response
const getTransformedImage=async(req,res)=>{
    const Jobid = req.params.Jobid;
    const Job = await Job.findById(Jobid);
    const imageId = Job.imageId;
    const imgbuffer = await getCachedImage(imageId);
    if(imgbuffer){
        res.status(200).send(imgbuffer);
    }else {
        res.status(400).json({"message": "image is not in redis"});
    }
}

const deleteImage = async(req,res)=>{
    const imgId = req.params.id;
    try{
        const image = await Image.findById(imgId);
        const S3ImgKey=image.key;
        await redisClient.del(imgId);
        await redisClient.del(`${imgId}_transformed`);
        await deleteImageFromS3(S3ImgKey);
        await image.remove();
    }catch(error){
        console.error('Error deleting image:', error);
    }    
};

async function getImageURL(key) {
   return await getObjectUrl(key);    
}
// for a user
const listImages= async(req,res)=>{
    const user_Id = req.user.id;
    try{
        const imageList = await db.collection('images').find({ user_Id}).toArray();

       // Get image URLs from S3
       const imageUrls = await Promise.all(imageList.map(image => getImageURL(image.key)));
       res.json(imageUrls);
    }catch(error){
        console.log('error fetching list of images for a user');
        res.status(500).json({ message: 'Internal Server Error' });
    }   

}


module.exports = {
    uploadImage,
    getImage,
    transformExistingImage,
    deleteImage,
    listImages,
    getTransformedImage
};
