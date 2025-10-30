const express = require('express');
const bodyParser = require('body-parser');
const { 
  bookBusinessService, 
  listBusinessServices, 
  getBusinessInfo 
} = require('./booking-tools');

// Create Express router
const router = express.Router();

// Middleware
router.use(bodyParser.json());

// Route handlers
router.post('/book_business_service', bookBusinessService);
router.get('/list_business_services', listBusinessServices);
router.get('/get_business_info', getBusinessInfo);

// Error handler
router.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = router; 