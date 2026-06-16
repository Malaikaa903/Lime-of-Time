const Business = require("../models/businessModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const Review = require("../models/reviewModel");
const Service = require("../models/serviceModel");
const Category = require("../models/categoryModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

//helper func.
//unique clients (owner dashboard+ business statistics)
const getUniqueClientsCount = async (businessId, startDate = null) => {
  const filter = { business: businessId };
  if (startDate) filter.date = { $gte: startDate };
  const clients = await Appointment.distinct("client", filter);
  return clients.length;
};

//earning calculations (wner dashboard+ business statistics)
const getEarnings = async (businessId, startDate, endDate = null) => {
  const matchFilter = {
    business: businessId,
    status: "completed",
    date: { $gte: startDate },
  };
  if (endDate) matchFilter.date.$lte = endDate;
  const result = await Appointment.aggregate([
    { $match: matchFilter },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  return result[0]?.total || 0;
};

// Owner Profile Creation
exports.createBusinessProfile = catchAsync(async (req, res, next) => {
  const {
    businessName,
    category,
    description,
    phone,
    email,
    website,
    address,
    coordinates,
    workingHours,
    bankName,
    accountTitle,
    accountNumber,
    iban,
    branchName,
    acceptsFullPayment,
    acceptsPartialPayment,
    acceptsCash,
    salesTaxRate,
    vatRate,
    subscriptionPlan,
    firstService,
  } = req.body;

  // required fields only
  if (!businessName || !category || !description) {
    return next(
      new AppError("Business name, category and description are required", 400),
    );
  }

  // check if already exists
  const existingBusiness = await Business.findOne({ owner: req.user.id });
  if (existingBusiness) {
    return next(
      new AppError(
        "Business profile already exists. Use update endpoint.",
        400,
      ),
    );
  }

  // build business object
  const businessData = {
    owner: req.user.id,
    businessName,
    category,
    description,
    phone: phone || null,
    email: email || null,
    website: website || null,
    profilePhoto: req.file ? req.file.filename : null,
    setupComplete: true,
    setupStep: 6,
  };

  // location
  if (address) {
    businessData.location = {
      type: "Point",
      address,
      coordinates: coordinates
        ? typeof coordinates === "string"
          ? JSON.parse(coordinates)
          : coordinates
        : [0, 0],
    };
  }

  // working hours
  if (workingHours) {
    businessData.workingHours =
      typeof workingHours === "string"
        ? JSON.parse(workingHours)
        : workingHours;
  }

  // payment account
  if (bankName && accountTitle && accountNumber) {
    businessData.paymentAccount = {
      bankName,
      accountTitle,
      accountNumber,
      iban: iban || null,
      branchName: branchName || null,
      acceptsFullPayment:
        acceptsFullPayment !== undefined ? acceptsFullPayment : true,
      acceptsPartialPayment: acceptsPartialPayment || false,
      acceptsCash: acceptsCash || false,
      salesTaxRate: salesTaxRate !== undefined ? Number(salesTaxRate) : 7,
      vatRate: vatRate !== undefined ? Number(vatRate) : 17,
    };
  }

  // create business
  const business = await Business.create(businessData);

  // mark user profile complete
  await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });

  // create subscription plan if provided
  let createdPlan = null;
  if (subscriptionPlan) {
    const planData =
      typeof subscriptionPlan === "string"
        ? JSON.parse(subscriptionPlan)
        : subscriptionPlan;

    if (planData.planName && planData.timePeriod && planData.amount) {
      createdPlan = await SubscriptionPlan.create({
        business: business._id,
        planName: planData.planName,
        timePeriod: planData.timePeriod,
        amount: planData.amount,
        facilities: planData.facilities || "",
      });
    }
  }

  // create first service
  let createdService = null;
  if (firstService) {
    const serviceData =
      typeof firstService === "string"
        ? JSON.parse(firstService)
        : firstService;

    if (serviceData.name && serviceData.price && serviceData.duration) {
      createdService = await Service.create({
        business: business._id,
        name: serviceData.name,
        description: serviceData.description || "",
        category: serviceData.category || category,
        price: Number(serviceData.price),
        duration: Number(serviceData.duration),
        breakTime: serviceData.breakTime ? Number(serviceData.breakTime) : 0,
        addOns: serviceData.addOns || [],
      });
    }
  }

  res.status(201).json({
    success: true,
    status: 201,
    message: "Business profile created successfully! ",
    data: {
      business,
      subscriptionPlan: createdPlan,
      firstService: createdService,
    },
  });
});

// update business (owner)
exports.updateMyBusiness = catchAsync(async (req, res, next) => {
  const {
    businessName,
    category,
    description,
    phone,
    email,
    website,
    address,
    coordinates,
    workingHours,
    bankName,
    accountTitle,
    accountNumber,
    iban,
    branchName,
    acceptsFullPayment,
    acceptsPartialPayment,
    acceptsCash,
    salesTaxRate,
    vatRate,
  } = req.body;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // update only fields that were sent
  if (businessName) business.businessName = businessName;
  if (category) business.category = category;
  if (description) business.description = description;
  if (phone) business.phone = phone;
  if (email) business.email = email;
  if (website) business.website = website;
  if (req.file) business.profilePhoto = req.file.filename;

  // update location
  if (address) {
    business.location = {
      type: "Point",
      address,
      coordinates: coordinates
        ? typeof coordinates === "string"
          ? JSON.parse(coordinates)
          : coordinates
        : business.location?.coordinates || [0, 0],
    };
  }

  // update working hours
  if (workingHours) {
    business.workingHours =
      typeof workingHours === "string"
        ? JSON.parse(workingHours)
        : workingHours;
  }

  // update payment account
  if (bankName || accountTitle || accountNumber) {
    business.paymentAccount = {
      ...business.paymentAccount?.toObject(),
      bankName: bankName || business.paymentAccount?.bankName,
      accountTitle: accountTitle || business.paymentAccount?.accountTitle,
      accountNumber: accountNumber || business.paymentAccount?.accountNumber,
      iban: iban || business.paymentAccount?.iban,
      branchName: branchName || business.paymentAccount?.branchName,
      acceptsFullPayment:
        acceptsFullPayment !== undefined
          ? acceptsFullPayment
          : business.paymentAccount?.acceptsFullPayment,
      acceptsPartialPayment:
        acceptsPartialPayment !== undefined
          ? acceptsPartialPayment
          : business.paymentAccount?.acceptsPartialPayment,
      acceptsCash:
        acceptsCash !== undefined
          ? acceptsCash
          : business.paymentAccount?.acceptsCash,
      salesTaxRate:
        salesTaxRate !== undefined
          ? Number(salesTaxRate)
          : business.paymentAccount?.salesTaxRate || 7,
      vatRate:
        vatRate !== undefined
          ? Number(vatRate)
          : business.paymentAccount?.vatRate || 17,
    };
  }

  await business.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Business updated successfully",
    data: { business },
  });
});

// get business (owner)
exports.getMyBusiness = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business profile not found", 404));
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: { business },
  });
});

//toggle business status
exports.toggleBusinessStatus = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  business.isActive = !business.isActive;
  await business.save();

  res.status(200).json({
    success: true,
    message: `Business is now ${business.isActive ? "active" : "temporarily closed"}`,
    data: { isActive: business.isActive },
  });
});

// client side (dashboard + explore)
exports.getAllBusinesses = catchAsync(async (req, res, next) => {
  const { search, category, rating, sort, page = 1, limit = 10 } = req.query;

  // only show active businesses to clients
  let filterQuery = { isActive: true, setupComplete: true };

  // search by business name
  if (search) {
    filterQuery.$or = [
      { businessName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // filter by category
  if (category) {
    filterQuery.category = { $regex: category, $options: "i" };
  }

  // filter by minimum rating
  if (rating) {
    filterQuery.rating = { $gte: Number(rating) };
  }

  // sort options
  let sortQuery = {};
  if (sort === "rating") sortQuery = { rating: -1 };
  else if (sort === "newest") sortQuery = { createdAt: -1 };
  else if (sort === "recommended") sortQuery = { rating: -1, totalReviews: -1 };
  else sortQuery = { isPinned: -1, rating: -1 };

  // Pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const businesses = await Business.find(filterQuery)
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum);

  const total = await Business.countDocuments(filterQuery);

  res.status(200).json({
    success: true,
    status: 200,
    results: businesses.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: { businesses },
  });
});

// business detailed screen (client side)
exports.getBusinessById = catchAsync(async (req, res, next) => {
  const business = await Business.findById(req.params.id);
  if (!business || !business.isActive) {
    return next(new AppError("Business not found", 404));
  }
  res.status(200).json({
    success: true,
    status: 200,
    data: { business },
  });
});

//nearby businesses
exports.getNearbyBusinesses = catchAsync(async (req, res, next) => {
  const { lat, lng, distance = 10 } = req.query;

  if (!lat || !lng) {
    return next(
      new AppError("Please provide your location (lat and lng)", 400),
    );
  }

  const radius = Number(distance) / 6378.1;

  const businesses = await Business.find({
    isActive: true,
    setupComplete: true,
    location: {
      $geoWithin: {
        $centerSphere: [[Number(lng), Number(lat)], radius],
      },
    },
  });

  res.status(200).json({
    success: true,
    status: 200,
    results: businesses.length,
    data: { businesses },
  });
});

//client home screen (categories, special offers, recommendations)
exports.getHomeData = catchAsync(async (req, res, next) => {
  const categories = await Category.find({
    isActive: true,
  }).sort("name");

  // Special offers = pinned businesses
  const specialOffers = await Business.find({
    isActive: true,
    setupComplete: true,
    isPinned: true,
  }).limit(5);

  // Recommended = highest rated businesses
  const recommended = await Business.find({
    isActive: true,
    setupComplete: true,
  })
    .sort({ rating: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      categories,
      specialOffers,
      recommended,
    },
  });
});

// business reviews
exports.getBusinessReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ business: req.params.id })
    .populate("client", "firstName lastName profilePhoto")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: reviews.length,
    data: { reviews },
  });
});

// owner dashboard stats
exports.getOwnerDashboardStats = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // appointments (today)
  const todayAppointments = await Appointment.countDocuments({
    business: business._id,
    date: { $gte: today, $lte: todayEnd },
    status: { $ne: "cancelled" },
  });

  // appointments (yearly)
  const yearAppointments = await Appointment.countDocuments({
    business: business._id,
    date: { $gte: startOfYear },
    status: { $ne: "cancelled" },
  });

  //earnings (today)
  const todayEarnings = await getEarnings(business._id, today, todayEnd);
  //earning (yealy)
  const yearEarnings = await getEarnings(business._id, startOfYear);
  //unique clients
  const totalClients = await getUniqueClientsCount(business._id);

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      appointments: {
        today: todayAppointments,
        year: yearAppointments,
      },
      earnings: {
        today: todayEarnings,
        year: yearEarnings,
      },
      totalClients,
      business,
    },
  });
});

// business statistics
exports.getBusinessStatistics = catchAsync(async (req, res, next) => {
  const { period = "7days" } = req.query;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate;

  if (period === "7days") {
    startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "30days") {
    startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // appointments chart data (grouped by date)
  const appointmentsChart = await Appointment.aggregate([
    {
      $match: {
        business: business._id,
        date: { $gte: startDate },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" },
        },
        count: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Total revenue
  const revenueResult = await Appointment.aggregate([
    {
      $match: {
        business: business._id,
        status: "completed",
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
        totalExpenses: { $sum: "$vat" },
      },
    },
  ]);

  const revenue = revenueResult[0] || { totalRevenue: 0, totalExpenses: 0 };

  // Staff performance
  const staffPerformance = await Appointment.aggregate([
    {
      $match: {
        business: business._id,
        status: "completed",
        date: { $gte: startDate },
        staff: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$staff",
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    {
      $lookup: {
        from: "staffs",
        localField: "_id",
        foreignField: "_id",
        as: "staffInfo",
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  // top services
  const topServices = await Appointment.aggregate([
    {
      $match: {
        business: business._id,
        status: "completed",
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$service",
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "_id",
        as: "serviceInfo",
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
  ]);

  // Total clients
  const totalClients = await getUniqueClientsCount(business._id, startDate);

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      period,
      appointmentsChart,
      revenue: {
        total: revenue.totalRevenue,
        expenses: revenue.totalExpenses,
        netProfit: revenue.totalRevenue - revenue.totalExpenses,
      },
      totalClients,
      staffPerformance,
      topServices,
    },
  });
});
