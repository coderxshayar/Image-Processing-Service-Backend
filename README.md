# Image Processing Service Backend

This project is a scalable backend for an image processing service that provides functionality for image uploading, transformation (resize, crop, rotate, watermark, etc.), caching, and retrieval. It includes user authentication, task queuing, and cloud storage integration for efficient image management. The project is built using the MERN stack, with RabbitMQ for job queuing, Redis for caching, AWS S3 for storage, and Docker for containerization.

## Features

- **Image Uploading**: Users can upload images to be processed and stored.
- **Image Transformation**: Supports various image transformations like resizing,rotating,adding watermarks and changing Format of image like .jpeg/.png/.jpg.
- **Job Queueing**: Large or time-consuming image transformations are queued using RabbitMQ.
- **Image Caching**: Frequently accessed images are cached in Redis for faster retrieval.
- **Cloud Storage**: Images are stored in AWS S3 for scalable and durable storage.
- **Authentication**: User authentication using JWT tokens.
- **Rate Limiting**: Limits the number of requests to prevent abuse.
- **Polling for Job Completion**: Supports polling to check the status of a job for async transformation tasks.
- **Dockerized**: The entire backend is containerized using Docker for easy deployment.

## Tech Stack

- **Node.js** with **Express.js** for the backend server.
- **MongoDB Atlas** for storing image metadata and user data.
- **Redis** for caching images and transformation results.
- **RabbitMQ** for asynchronous job queueing.
- **Sharp** for performing image transformations.
- **AWS S3** for cloud storage.
- **Docker** and **Docker Compose** for containerization.

## Setup Instructions

### Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS Account](https://aws.amazon.com/) for S3 (or you can use any alternative cloud storage service)
  
### Clone the Repository

```bash
git clone https://github.com/yourusername/image-processing-service-backend.git
cd image-processing-service-backend
```
## Environment Variables
Create a .env file in the Backend folder and set the following environment variables:
```bash
NODE_ENV=production
PORT=3000

# MongoDB
MONGO_URI=mongodb://mongo:27017/image-processing-service

# AWS S3
AWS_IAM_ACCESS_KEY=your-aws-access-key
AWS_IAM_SECRET_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=your-s3-region

# Redis
REDIS_HOST=redis

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672

# JWT Secret for Authentication
JWT_SECRET=your-secret-key
```
## Docker Compose Setup
To start all services with Docker, run:

```bash
docker-compose up --build
```
This command will:
 - Build and run the backend application.
 - Spin up Redis, RabbitMQ, and MongoDB containers.
## API Endpoints
This backend provides several API endpoints for uploading, transforming, retrieving, and checking the status of images.
### 1. Register User
Register Yourself 

Endpoint: /auth/register

Method: POST

Request body: Raw JSON
```bash
{
  "username": "XYZ",
  "password": "strongPassword!"
}
```
Response :
Status : 200
, message : "User registered successfully"

### 2. Login
To transform and upload images , login first

Endpoint: /auth/login

Method: POST

Request body: Raw JSON
```bash
{
  "username": "XYZ",
  "password": "strongPassword!"
}
```
Response :
Status : 200
```bash
{
    "token": "",
    "message": "Login successful"
}
```
### 3. Upload Image
Uploads an image to the S3 bucket and its metadata to mongoDB

Endpoint: /images/upload

Method: POST

Authorization: Requires Bearer token in the Authorization header

Request Body: multipart/form-data
- file: Image file to upload

Response Body: get a Signed Url to access the image from the private bucket
```bash
{
    "message": "Image uploaded and saved",
    "id": imageId,
    "url": "https://img-processing-service-bucket.s3.ap-south-1.amazonaws.com/uploads/user-uploads/Your-file?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAWQUOZOK2QBXN7WV3%2F20241026%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20241026T113455Z&X-Amz-Expires=900&X-Amz-Signature=c973f8cbddbe0c29705ca56f025f7a9515fda31f4c738ee33f0c37ead89085fa&X-Amz-SignedHeaders=host&x-id=GetObject"
}
```
### 2. Transform Image
Transforms an image which is already uploaded.

Authorization: Requires Bearer token in the Authorization header

Endpoint : /images/transform/imageId

Method : POST

Request Body : Json data
```bash
{
 "width":300,(optional)
  "height":200,(optional)
  "rotation":90,(optional)
  "watermarkText":"XYZ creations",(optional)
  "watermarkOpacity":0.9,(optional)
  "saveImage":false [mandatory ,type bool]
}
```
saveImage is mandatory to transform the image, which has two options true or false.
- "saveImage" : true [ for saving the image after transformation to the S3, for the final saving you must pass this as true]
- "saveImage": false [it won't save the current transformation to S3 ,only to the cache],
  
Response Body :returns a jobId 
```bash
{
    "message": "Job submitted successfully",
    "jobId": "671cd5b56b14c65a5537b3b5"
}
```
### 4. Polling Job 
This is done to get the image when the Job is complete. Image buffer is served from the redis if the image is not saved yet to the s3 but you will get an Signed url if it is saved after transformation.

Method : GET

Endpoint : /api/JobStatus/JobId

Response :
1. if it is served from the S3 
```bash
example :
{
    "status": "completed",
    "imageId": "671cd3df6b14c65a5537b3b3",
    "imageUrl": "https://img-processing-service-bucket.s3.ap-south-1.amazonaws.com/uploads/user-uploads/your-file-name?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAWQUOZOK2QBXN7WV3%2F20241026%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20241026T115244Z&X-Amz-Expires=900&X-Amz-Signature=94670dfc8d27535ae8a00706026564d96ee654faa6c1aa0d629860462370db5d&X-Amz-SignedHeaders=host&x-id=GetObject"
}
```
2. If it is still in process.
 ```bash
{
    "status": "pending"
}
```

3. If it is in redis Cache and not yet saved in S3.
```bash
   {
    "status": "completed",
    "imageId": "671cd3df6b14c65a5537b3b3",
    "imageUrl": null
}
```
In this case you should get the image with Endpoint /images/transformedImage/jobId

### 5. get transformed Image from redis
this api is to get the image buffer from the redis directly

Method : GET

Endpoint : /images/transformedImage/JobId


## Queueing System
The project uses RabbitMQ to queue image transformation tasks. The consumer listens to the image_transformation_queue and processes transformations asynchronously. The consumer is started when the backend starts.

## Redis Caching
Transformed images are cached in Redis for faster access. Cached images will only be saved to S3 when saveImage is set to true.

## Docker Commands
```bash
Start all services: docker-compose up
Stop all services: docker-compose down
Rebuild the backend service: docker-compose up --build backend
```

## Future Improvements
- Add real-time notifications when image transformation is complete using WebSockets.
- Implement image version control to allow undo/redo operations.
- Introduce user roles and permissions for enhanced security.
- Migrate from RabbitMQ to Kafka for more robust message streaming.

## Contributing
Feel free to submit issues and pull requests for new features, bug fixes, or improvements. Make sure to update tests as appropriate.

## License
This project is licensed under the MIT License - see the LICENSE file for details.









