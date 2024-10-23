const Job = require('../models/Job');

const getJobStatus = async (req, res) => {
    const  jobId  = req.params.id;

    const job = await Job.findById(jobId);

    if (!job) {
        console.log('job:',job);
        return res.status(404).json({ message: 'Job not found' });
    }
    
    if (job.status === 'completed') {
        return res.status(200).json({ status: job.status, imageId: job.imageId,imageUrl: job.transformedImageUrl });
    }

    return res.status(200).json({ status: job.status });
};
module.exports = getJobStatus;