const Transaction = require("../models/transactionModel");
const Business = require("../models/businessModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// get my transactions (client)
exports.getMyTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction.find({ client: req.user.id })
    .populate("appointment", "date timeSlot status")
    .populate("business", "businessName profilePhoto")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: transactions.length,
    data: { transactions },
  });
});

// get business transactions-history (owner)
exports.getBusinessTransactions = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    Transaction.find({ business: business._id })
      .populate("client", "firstName lastName profilePhoto")
      .populate("appointment", "date timeSlot")
      .sort("-createdAt")
      .skip(skip)
      .limit(limitNum),
    Transaction.countDocuments({ business: business._id }),
  ]);

  // calculate total revenue from all successful transactions
  const revenueResult = await Transaction.aggregate([
    {
      $match: {
        business: business._id,
        status: "success",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  res.status(200).json({
    success: true,
    status: 200,
    results: transactions.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    totalRevenue,
    data: { transactions },
  });
});

// get single transaction
exports.getTransactionById = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("client", "firstName lastName profilePhoto")
    .populate("business", "businessName profilePhoto location phone")
    .populate("appointment", "date timeSlot status paymentMethod");

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  // verify ownership
  const isClient = transaction.client._id.toString() === req.user.id;
  const business = await Business.findOne({ owner: req.user.id });
  const isOwner =
    business && transaction.business._id.toString() === business._id.toString();

  if (!isClient && !isOwner) {
    return next(new AppError("Permission denied", 403));
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: { transaction },
  });
});
