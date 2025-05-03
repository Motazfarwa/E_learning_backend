const stripe = require('stripe')("sk_test_51R0PabHGa0qYa3MxsUNoGXdfG4R74i4ij32MotFNxWToObdzUQWT69IAqJ3qzwAVjiGafQEGKUDpkJ4hjZRgQ0Ue00PwT0qfqX");
const Payment = require('../models/Payment');

// Create Payment Intent
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      description,
      payment_method_types: ['card'],
      metadata: { integration_check: 'accept_a_payment' },
    });
    console.log('Created Payment Intent:', JSON.stringify(paymentIntent, null, 2));
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
};

// Confirm and Save Payment
const confirmPayment = async (req, res) => {
  try {
    const { paymentId, amount, metadata } = req.body;
    if (!paymentId || !amount || !metadata) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify Payment Intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Save to database
    const payment = new Payment({
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customerName: metadata.name,
      customerEmail: metadata.email,
      description: metadata.description,
    });
    await payment.save();
    console.log('Payment saved:', payment);

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Error confirming payment:', err);
    res.status(500).json({ error: err.message });
  }
};
// Get Payment Statistics
const getPaymentStats = async (req, res) => {
  try {
    const totalStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    const statusStats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const stats = {
      totalAmount: totalStats[0]?.totalAmount || 0,
      totalCount: totalStats[0]?.totalCount || 0,
      averageAmount: totalStats[0]?.averageAmount || 0,
      statusDistribution: statusStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      monthlyData: monthlyStats.map(item => ({
        year: item._id.year,
        month: item._id.month,
        totalAmount: item.totalAmount,
        count: item.count
      }))
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }); // Trier par date décroissante
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createPaymentIntent, confirmPayment, getPaymentStats, getPayments };