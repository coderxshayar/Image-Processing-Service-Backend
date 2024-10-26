Image Processing Service Backend
This project is a scalable backend for an image processing service that provides functionality for image uploading, transformation (resize, crop, rotate, watermark, etc.), caching, and retrieval. It includes user authentication, task queuing, and cloud storage integration for efficient image management. The project is built using the MERN stack, with RabbitMQ for job queuing, Redis for caching, AWS S3 for storage, and Docker for containerization.

Features
Image Uploading: Users can upload images to be processed and stored.
Image Transformation: Supports various image transformations like resizing, cropping, rotating, and adding watermarks.
Job Queueing: Large or time-consuming image transformations are queued using RabbitMQ.
Image Caching: Frequently accessed images are cached in Redis for faster retrieval.
Cloud Storage: Images are stored in AWS S3 for scalable and durable storage.
Authentication: User authentication using JWT tokens.
Rate Limiting: Limits the number of requests to prevent abuse.
Polling for Job Completion: Supports polling to check the status of a job for async transformation tasks.
Dockerized: The entire backend is containerized using Docker for easy deployment.
Tech Stack
Node.js with Express.js for the backend server.
MongoDB Atlas for storing image metadata and user data.
Redis for caching images and transformation results.
RabbitMQ for asynchronous job queueing.
Sharp for performing image transformations.
AWS S3 for cloud storage.
Docker and Docker Compose for containerization.

