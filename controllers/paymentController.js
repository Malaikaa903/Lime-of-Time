const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Transaction = require("../models/transactionModel");
const Appointment = require("../models/appointmentModel");
const Business = require("../models/businessModel");
const Service = require("../models/serviceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// CREATE PAYMENT INTENT
exports.createPaymentIntent = catchAsync(async (req, res, next) => {
  const { amount, currency = "usd", appointmentId } = req.body;

  if (!amount || !appointmentId) {
    return next(new AppError("Amount and appointment ID are required", 400));
  }

  // amount in cents (Stripe requires smallest currency unit)
  // $50.00 → 5000 cents
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: {
      appointmentId,
      userId: req.user.id,
    },
  });

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});

// CONFIRM PAYMENT
exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId, appointmentId } = req.body;

  if (!paymentIntentId || !appointmentId) {
    return next(
      new AppError("Payment intent ID and appointment ID are required", 400),
    );
  }

  // verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return next(
      new AppError(
        `Payment not successful. Status: ${paymentIntent.status}`,
        400,
      ),
    );
  }

  // update appointment payment status
  const appointment = await Appointment.findById(appointmentId)
    .populate("service", "name")
    .populate("business", "name")
    .populate("client", "name email");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  appointment.paymentStatus = "paid";
  appointment.paymentMethod = "card";
  await appointment.save();

  // update transaction record
  await Transaction.findOneAndUpdate(
    { appointment: appointmentId },
    {
      status: "success",
      stripePaymentIntentId: paymentIntentId,
    },
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Payment confirmed successfully! ",
    data: { appointment },
  });
});

// REFUND PAYMENT
exports.refundPayment = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    return next(new AppError("Appointment ID is required", 400));
  }

  const transaction = await Transaction.findOne({
    appointment: appointmentId,
  });

  if (!transaction || !transaction.stripePaymentIntentId) {
    return next(new AppError("No payment found for this appointment", 404));
  }

  // create refund via Stripe
  const refund = await stripe.refunds.create({
    payment_intent: transaction.stripePaymentIntentId,
  });

  // update transaction
  transaction.status = "refunded";
  await transaction.save();

  // update appointment
  await Appointment.findByIdAndUpdate(appointmentId, {
    paymentStatus: "refunded",
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Payment refunded successfully",
    data: { refund },
  });
});

// GET PAYMENT STATUS
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
  const { paymentIntentId } = req.params;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    },
  });
});

// HELPER FUNCTION TO GET TRANSACTION DATA

const getTransactionData = async (
  appointmentId,
  userId,
  amount,
  currency,
  paymentIntentId,
  status,
) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("business", "_id")
    .populate("client", "_id");

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return {
    appointment: appointmentId,
    client: appointment.client._id,
    business: appointment.business._id,
    totalAmount: amount,
    currency: currency,
    status: status,
    stripePaymentIntentId: paymentIntentId,
    paymentMethod: "card",
  };
};

// TESTING FUNCTIONS (For Postman/Development)

// Complete payment
exports.testCompletePayment = catchAsync(async (req, res, next) => {
  const { amount, appointmentId, currency = "usd" } = req.body;

  if (!amount || !appointmentId) {
    return next(new AppError("Amount and appointment ID are required", 400));
  }

  try {
    // First get appointment data to ensure it exists and get client/business info
    const appointment = await Appointment.findById(appointmentId)
      .populate("business", "_id")
      .populate("client", "_id");

    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    // Create and confirm payment in one step using Stripe's test card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method: "pm_card_visa",
      confirm: true,
      payment_method_types: ["card"],
      metadata: {
        appointmentId,
        userId: req.user.id,
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return next(
        new AppError(
          `Payment not successful. Status: ${paymentIntent.status}`,
          400,
        ),
      );
    }

    // Update appointment payment status
    appointment.paymentStatus = "paid";
    appointment.paymentMethod = "card";
    await appointment.save();

    // Create transaction record with all required fields
    await Transaction.create({
      appointment: appointmentId,
      client: appointment.client._id,
      business: appointment.business._id,
      totalAmount: amount,
      paymentMethod: "card",
      status: "success",
      stripePaymentIntentId: paymentIntent.id,

      subtotal: amount,
      salesTax: 0,
      vat: 0,
    });

    // Get updated appointment with populated fields for response
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("service", "name")
      .populate("business", "name")
      .populate("client", "name email");

    res.status(200).json({
      success: true,
      status: 200,
      message: "Payment successful! ",
      data: {
        paymentIntent,
        appointment: updatedAppointment,
      },
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

//Simulate payment confirmation with test card
exports.testConfirmPayment = catchAsync(async (req, res, next) => {
  const { paymentIntentId, appointmentId } = req.body;

  if (!paymentIntentId || !appointmentId) {
    return next(
      new AppError("Payment intent ID and appointment ID are required", 400),
    );
  }

  try {
    // First get appointment data
    const appointment = await Appointment.findById(appointmentId)
      .populate("business", "_id")
      .populate("client", "_id");

    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }

    // Attach payment method to payment intent
    await stripe.paymentIntents.update(paymentIntentId, {
      payment_method: "pm_card_visa",
    });

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return next(
        new AppError(
          `Payment not successful. Status: ${paymentIntent.status}`,
          400,
        ),
      );
    }

    // Update appointment
    appointment.paymentStatus = "paid";
    appointment.paymentMethod = "card";
    await appointment.save();

    // Create/Update transaction with all required fields
    await Transaction.findOneAndUpdate(
      { appointment: appointmentId },
      {
        appointment: appointmentId,
        client: appointment.client._id,
        business: appointment.business._id,
        totalAmount: paymentIntent.amount / 100,
        paymentMethod: "card",
        status: "success",
        stripePaymentIntentId: paymentIntentId,
        subtotal: paymentIntent.amount / 100,
        salesTax: 0,
        vat: 0,
      },
      { upsert: true, new: true },
    );

    // Get updated appointment with populated fields
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("service", "name")
      .populate("business", "name")
      .populate("client", "name email");

    res.status(200).json({
      success: true,
      status: 200,
      message: "Payment confirmed successfully! ",
      data: {
        paymentIntent,
        appointment: updatedAppointment,
      },
    });
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
});

// Create payment intent and get client secret (For frontend testing)
exports.testCreatePaymentIntent = catchAsync(async (req, res, next) => {
  const { amount, currency = "usd", appointmentId } = req.body;

  if (!amount || !appointmentId) {
    return next(new AppError("Amount and appointment ID are required", 400));
  }

  // First get appointment data
  const appointment = await Appointment.findById(appointmentId)
    .populate("business", "_id")
    .populate("client", "_id");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // Create payment intent without confirming
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    payment_method_types: ["card"],
    metadata: {
      appointmentId,
      userId: req.user.id,
    },
  });

  // Create a transaction record with pending status
  await Transaction.create({
    appointment: appointmentId,
    client: appointment.client._id,
    business: appointment.business._id,
    totalAmount: amount,
    paymentMethod: "card",
    status: "pending",
    stripePaymentIntentId: paymentIntent.id,
    subtotal: amount,
    salesTax: 0,
    vat: 0,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Payment intent created for testing",
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
});
