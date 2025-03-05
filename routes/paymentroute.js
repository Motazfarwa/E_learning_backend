const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentcontroller');


router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/confirm_payment', paymentController.confirmPayment);

module.exports = router;
