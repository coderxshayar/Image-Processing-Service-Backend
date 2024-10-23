const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    imageId: String,
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    transformedImageUrl: String,
});

const Job = mongoose.model('Job', JobSchema);
module.exports=Job;
