const stripe = require('stripe')("sk_test_51R0PabHGa0qYa3MxsUNoGXdfG4R74i4ij32MotFNxWToObdzUQWT69IAqJ3qzwAVjiGafQEGKUDpkJ4hjZRgQ0Ue00PwT0qfqX");
const Payment = require('../models/Payment');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
    try {
      const { amount, currency = 'usd', description } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        description,
        metadata: { integration_check: 'accept_a_payment' }
      });
  
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // Confirm and Save Payment
  const confirmPayment = async (req, res) => {
    try {
      const { paymentId, amount, metadata } = req.body;
      
      const payment = new Payment({
        paymentId,
        amount: amount / 100, // Store in dollars
        currency: 'usd',
        customerName: metadata.name,
        customerEmail: metadata.email,
        description: metadata.description
      });
  
      await payment.save();
  
      res.json({ success: true, payment });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
module.exports = {createPaymentIntent, confirmPayment }

