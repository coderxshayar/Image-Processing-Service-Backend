const amqp = require('amqplib/callback_api');
const processTransformationJob = require('./ImgTransformation');
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

let channel;
let isConnected = false;

const amqpUrl = `amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
// Helper function to retry connection
const connectToRabbitMQ = (retries = 5) => {
    amqp.connect(amqpUrl, (error, connection) => {
        if (error) {
            console.error('Error connecting to RabbitMQ:', error);
            if (retries > 0) {
                console.log(`Retrying in 5 seconds... (${retries} retries left)`);
                setTimeout(() => connectToRabbitMQ(retries - 1), 5000); // Retry after 5 seconds
            } else {
                console.error('Failed to connect to RabbitMQ after multiple attempts.');
            }
            return;
        }
        connection.createChannel((err, ch) => {
            if (err) {
                console.error('Error creating channel:', err);
                throw err;
            }
            channel = ch;
            isConnected = true;
            const queue = 'image_transformation_queue';
            channel.assertQueue(queue, { durable: true });
            console.log('Connected to RabbitMQ, queue:', queue);
        });
    });
};


connectToRabbitMQ();

// Producer function
const sendToQueue = async (JobId, imageId, saveImage, transformations) => {
    // Check if connection is established before sending to queue
    if (!isConnected) {
        console.error('RabbitMQ is not connected yet. Cannot send to queue.');
        return;
    }

    const message = JSON.stringify({ JobId, imageId, saveImage, transformations });
    channel.sendToQueue('image_transformation_queue', Buffer.from(message), { persistent: true });
    console.log('Sent job to queue:', message);

};


//consumer
amqp.connect(amqpUrl, (error, connection) => {
    if (error) throw error;
    connection.createChannel((err, channel) => {
        if (err) throw err;
        const queue = 'image_transformation_queue';

        channel.assertQueue(queue, { durable: true });
        console.log('Waiting for messages in queue:', queue);

        channel.consume(queue, async (job) => {
            try {
                await processTransformationJob(job);
                channel.ack(job); // Acknowledge successful processing
                console.log('Job processed:', job.content.toString());
            } catch (error) {
                console.error('Error processing job:', error);
                 
            }
        },{ noAck: false });
    });
});



module.exports = {
    sendToQueue
};
