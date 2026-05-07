const Staff = require("../models/staffModel");
const Business = require("../models/businessModel");
const Service = require("../models/serviceModel");
const Appointment = require("../models/appointmentModel");
const { getOwnerLimits } = require("./ownerSubscriptionController");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// add staff
exports.addStaff = catchAsync(async (req, res, next) => {
  const { name, description, availability, assignedServices } = req.body;
  if (!name) {
    return next(new AppError("Staff name is required", 400));
  }
  const business = await Business.findOne({ owner: req.user.id });
  if (!business) {
    return next(new AppError("Business profile not found", 404));
  }

  // parse availability if sent as JSON string from form-data
  let parsedAvailability = [];
  if (availability) {
    parsedAvailability =
      typeof availability === "string"
        ? JSON.parse(availability)
        : availability;
  }

  // parse assignedServices if sent as JSON string
  let parsedServices = [];
  if (assignedServices) {
    parsedServices =
      typeof assignedServices === "string"
        ? JSON.parse(assignedServices)
        : assignedServices;
  }

  // profile photo and work photos via multer
  let profilePhoto = null;
  let workPhotos = [];
  if (req.files) {
    if (req.files["profilePhoto"]) {
      profilePhoto = req.files["profilePhoto"][0].filename;
    }
    if (req.files["workPhotos"]) {
      workPhotos = req.files["workPhotos"].map((f) => f.filename);
    }
  }

  // check plan limits
  const { limits, subscription } = await getOwnerLimits(req.user.id);

  const currentStaffCount = await Staff.countDocuments({
    business: business._id,
    isActive: true,
  });

  if (currentStaffCount >= limits.maxStaff) {
    return next(
      new AppError(
        `Your ${subscription.plan} plan allows maximum ${limits.maxStaff} staff members. ` +
          `You currently have ${currentStaffCount}. Please upgrade to Premium plan to add more!`,
        403,
      ),
    );
  }

  const staff = await Staff.create({
    business: business._id,
    name,
    description,
    profilePhoto,
    workPhotos,
    availability: parsedAvailability,
    assignedServices: parsedServices,
  });
  res.status(201).json({
    success: true,
    status: 201,
    message: "Staff added successfully",
    data: { staff },
  });
});

// get all staff (owner)
exports.getMyStaff = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });
  if (!business) {
    return next(new AppError("Business profile not found", 404));
  }
  const staff = await Staff.find({
    business: business._id,
    isActive: true,
  }).populate("assignedServices", "name price duration");
  res.status(200).json({
    success: true,
    status: 200,
    results: staff.length,
    data: { staff },
  });
});

// get single staff profile
exports.getStaffById = catchAsync(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id).populate(
    "assignedServices",
    "name price duration category",
  );
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }
  res.status(200).json({
    success: true,
    status: 200,
    data: { staff },
  });
});

// update staff
exports.updateStaff = catchAsync(async (req, res, next) => {
  const { name, description, availability, assignedServices } = req.body;
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }
  // verify ownership
  const business = await Business.findOne({ owner: req.user.id });
  if (!business || staff.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }
  if (name) staff.name = name;
  if (description) staff.description = description;
  if (availability) {
    staff.availability =
      typeof availability === "string"
        ? JSON.parse(availability)
        : availability;
  }
  if (assignedServices) {
    staff.assignedServices =
      typeof assignedServices === "string"
        ? JSON.parse(assignedServices)
        : assignedServices;
  }
  if (req.files) {
    if (req.files["profilePhoto"]) {
      staff.profilePhoto = req.files["profilePhoto"][0].filename;
    }
    if (req.files["workPhotos"]) {
      staff.workPhotos = req.files["workPhotos"].map((f) => f.filename);
    }
  }
  await staff.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Staff updated successfully",
    data: { staff },
  });
});

// update staff availability
exports.updateAvailability = catchAsync(async (req, res, next) => {
  const { availability } = req.body;
  if (!availability || availability.length === 0) {
    return next(new AppError("Please provide availability slots", 400));
  }
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }
  const business = await Business.findOne({ owner: req.user.id });
  if (!business || staff.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }
  staff.availability = availability;
  await staff.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Availability updated successfully",
    data: { availability: staff.availability },
  });
});

// assign services to staff
exports.assignServices = catchAsync(async (req, res, next) => {
  const { serviceIds } = req.body;
  if (!serviceIds || serviceIds.length === 0) {
    return next(new AppError("Please provide service IDs", 400));
  }
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }

  // verify ownership
  const business = await Business.findOne({ owner: req.user.id });
  if (!business || staff.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }
  // verify all services belong to this business
  const services = await Service.find({
    _id: { $in: serviceIds },
    business: business._id,
  });
  if (services.length !== serviceIds.length) {
    return next(
      new AppError("One or more services not found in your business", 400),
    );
  }
  staff.assignedServices = serviceIds;
  await staff.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Services assigned successfully",
    data: { assignedServices: staff.assignedServices },
  });
});
// remove staff
exports.removeStaff = catchAsync(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }
  const business = await Business.findOne({ owner: req.user.id });
  if (!business || staff.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }
  staff.isActive = false;
  await staff.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Staff removed successfully",
  });
});

// get staff schedule
exports.getStaffSchedule = catchAsync(async (req, res, next) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff || !staff.isActive) {
    return next(new AppError("Staff member not found", 404));
  }
  const { status } = req.query;
  const filter = { staff: staff._id };
  // filter by status if provided
  if (status) filter.status = status;
  const appointments = await Appointment.find(filter)
    .populate("client", "firstName lastName profilePhoto")
    .populate("service", "name duration price")
    .sort("date");
  res.status(200).json({
    success: true,
    status: 200,
    results: appointments.length,
    data: { appointments },
  });
});

// get staff for a business (client side)
exports.getBusinessStaff = catchAsync(async (req, res, next) => {
  const { businessId } = req.params;
  const staff = await Staff.find({
    business: businessId,
    isActive: true,
  }).populate("assignedServices", "name price duration");
  res.status(200).json({
    success: true,
    status: 200,
    results: staff.length,
    data: { staff },
  });
});
