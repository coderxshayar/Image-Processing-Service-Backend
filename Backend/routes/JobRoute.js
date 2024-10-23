const express = require('express');
const JobRouter = express.Router();
const getJobStatus = require('../controllers/JobController');

JobRouter.get('/:id',getJobStatus);

module.exports= JobRouter;