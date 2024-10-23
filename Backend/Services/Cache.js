const Redis = require('ioredis');

// Use the correct host and port from environment variables or default to 'redis'
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'redis',  // 'redis' refers to the Docker service name
    port: process.env.REDIS_PORT || 6379      // Default Redis port
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});
const cacheImage = async (imageID, buffer) => {
    try {
        // Passing EX (expiry) as a separate argument
        await redisClient.set(imageID, buffer.toString('base64'), 'EX', 60 * 60 * 24); // Cache for 24 hours
    } catch (error) {
        console.error('Error caching image:', error);
    }
};


const getCachedImage = async (imageID) => {
    try {
        const cachedImage = await redisClient.get(imageID);
        if (cachedImage) {
            return Buffer.from(cachedImage, 'base64'); // Redis stores string, so convert to buffer
        }
        return null;
    } catch (error) {
        console.error('Error fetching from Redis:', error);
        return null;
    }
};



module.exports={cacheImage,getCachedImage,redisClient};
