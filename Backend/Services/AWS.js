const {S3Client, GetObjectCommand, PutObjectCommand,DeleteObjectCommand,ListObjectsV2Command} = require("@aws-sdk/client-s3");
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const S3 = new S3Client({
    region : 'ap-south-1',
    credentials :{
        accessKeyId: process.env.AWS_IAM_ACCESS_KEY,
        secretAccessKey : process.env.AWS_IAM_SECRET_KEY,
    },
});

async function getObjectUrl(key){
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });
    const url = await getSignedUrl(S3,command);
    return url;   
}

async function getImagefromS3(key){
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });
  
   const res = await S3.send(command);
   return res;
}


async function UploadImagetoS3(key,buffer,mimeType){
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body:buffer,
        ContentType: mimeType,
    });

    await S3.send(command);
}

async function deleteImageFromS3(key) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });
    await S3.send(command);
};

async function listAllImagesWithPagination(bucketName, maxKeys = 10, continuationToken = null) {
    const params = {
        Bucket: bucketName,
        Prefix: 'uploads/user-uploads/',  // Specify the folder name as the prefix
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
    };

    try {
        
        const data = await S3.send(new ListObjectsV2Command(params));

        // Extract and log the image URLs
        const imageUrls = data.Contents.map(item => {
            return `https://${bucketName}.s3.amazonaws.com/${item.Key}`;
        });

        console.log("Images:", imageUrls);

        // Check if more data is available for pagination
        if (data.IsTruncated) {
            console.log('Fetching more images...');
            await listImagesWithPagination(bucketName,maxKeys, data.NextContinuationToken);
        } else {
            console.log('All images retrieved.');
        }
    } catch (error) {
        console.error("Error fetching Paginated images from S3:", error);
    }
}


module.exports = {
    getObjectUrl,
    UploadImagetoS3,
    getImagefromS3,
    deleteImageFromS3,
    listAllImagesWithPagination
}