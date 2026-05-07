const Service = require("../models/serviceModel");
const Business = require("../models/businessModel");
const Staff = require("../models/staffModel");
const Appointment = require("../models/appointmentModel");
const { getOwnerLimits } = require("./ownerSubscriptionController");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// helper func. (generate time slots)
const generateTimeSlots = (openTime, closeTime, slotDuration) => {
  const slots = [];

  // convert "09:00" to minutes
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  // keep generating slots until we reach closing time
  while (currentMinutes + slotDuration <= closeMinutes) {
    // convert minutes back to "HH:MM" format
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

    slots.push(timeString);
    currentMinutes += slotDuration;
  }

  return slots;
};

// create service
exports.createService = catchAsync(async (req, res, next) => {
  const { name, description, category, price, duration, breakTime, addOns } =
    req.body;
  if (!name || !price || !duration || !category) {
    return next(
      new AppError("Name, category, price and duration are required", 400),
    );
  }

  const business = await Business.findOne({ owner: req.user.id });
  if (!business) {
    return next(new AppError("Business profile not found", 404));
  }
  let parsedAddOns = [];
  if (addOns) {
    parsedAddOns = typeof addOns === "string" ? JSON.parse(addOns) : addOns;
  }

  let serviceImages = [];
  let coverImage = null;
  let categoryCoverImage = null;

  if (req.files) {
    if (req.files["serviceImages"]) {
      serviceImages = req.files["serviceImages"].map((f) => f.filename);
    }
    if (req.files["coverImage"]) {
      coverImage = req.files["coverImage"][0].filename;
    }
    if (req.files["categoryCoverImage"]) {
      categoryCoverImage = req.files["categoryCoverImage"][0].filename;
    }
  }

  // check plan limits
  const { limits, subscription } = await getOwnerLimits(req.user.id);

  const currentServiceCount = await Service.countDocuments({
    business: business._id,
    isActive: true,
  });

  if (currentServiceCount >= limits.maxServices) {
    return next(
      new AppError(
        `Your ${subscription.plan} plan allows maximum ${limits.maxServices} services. ` +
          `You currently have ${currentServiceCount}. Please upgrade to Premium plan to add more!`,
        403,
      ),
    );
  }

  const service = await Service.create({
    business: business._id,
    name,
    description,
    category,
    price: Number(price),
    duration: Number(duration),
    breakTime: breakTime ? Number(breakTime) : 0,
    serviceImages,
    coverImage,
    categoryCoverImage,
    addOns: parsedAddOns,
  });

  if (!business.setupComplete) {
    business.setupComplete = true;
    business.setupStep = 6;
    await business.save();
  }
  res.status(201).json({
    success: true,
    status: 201,
    message: "Service created successfully",
    data: { service },
  });
});

// get my services (owner)
exports.getMyServices = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business profile not found", 404));
  }

  const { category } = req.query;

  const filter = {
    business: business._id,
    isActive: true,
  };

  if (category) {
    filter.category = { $regex: category, $options: "i" };
  }
  const services = await Service.find(filter).sort("-createdAt");
  res.status(200).json({
    success: true,
    status: 200,
    results: services.length,
    data: { services },
  });
});

// get services by businesses (business detailed screen)
exports.getServicesByBusiness = catchAsync(async (req, res, next) => {
  const { businessId } = req.params;
  const { category } = req.query;

  const filter = {
    business: businessId,
    isActive: true,
  };

  if (category) {
    filter.category = { $regex: category, $options: "i" };
  }
  const services = await Service.find(filter).sort("-createdAt");
  res.status(200).json({
    success: true,
    status: 200,
    results: services.length,
    data: { services },
  });
});

// get single service (service detail screen )
exports.getServiceById = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id).populate(
    "business",
    "businessName location phone profilePhoto rating",
  );
  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }
  res.status(200).json({
    success: true,
    status: 200,
    data: { service },
  });
});

//update service (owner)
exports.updateService = catchAsync(async (req, res, next) => {
  const { name, description, category, price, duration, breakTime } = req.body;

  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // verify this service belongs to owner's business
  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (price) updateData.price = Number(price);
  if (duration) updateData.duration = Number(duration);
  if (breakTime !== undefined) updateData.breakTime = Number(breakTime);

  if (req.files) {
    if (req.files["serviceImages"]) {
      updateData.serviceImages = req.files["serviceImages"].map(
        (f) => f.filename,
      );
    }
    if (req.files["coverImage"]) {
      updateData.coverImage = req.files["coverImage"][0].filename;
    }
    if (req.files["categoryCoverImage"]) {
      updateData.categoryCoverImage =
        req.files["categoryCoverImage"][0].filename;
    }
  }
  const updatedService = await Service.findByIdAndUpdate(
    req.params.id,
    updateData,
    { returnDocument: "after", runValidators: true },
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Service updated successfully",
    data: { service: updatedService },
  });
});

// addOns to service (owner)
exports.addAddOns = catchAsync(async (req, res, next) => {
  const { addOns } = req.body;

  if (!addOns || addOns.length === 0) {
    return next(new AppError("Please provide add-ons", 400));
  }

  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // verify ownership
  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  // adds multiple items to array
  await Service.findByIdAndUpdate(req.params.id, {
    $push: { addOns: { $each: addOns } },
  });

  const updatedService = await Service.findById(req.params.id);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Add-ons added successfully",
    data: { addOns: updatedService.addOns },
  });
});

// remove addOn (owner)
exports.removeAddOn = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // verify ownership
  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  // $pull removes item from array
  await Service.findByIdAndUpdate(req.params.id, {
    $pull: { addOns: { _id: req.params.addOnId } },
  });

  const updatedService = await Service.findById(req.params.id);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Add-on removed successfully",
    data: { addOns: updatedService.addOns },
  });
});

// add discount to servie (owner)
exports.addDiscount = catchAsync(async (req, res, next) => {
  const { percentage, startDate, endDate } = req.body;

  if (!percentage || !startDate || !endDate) {
    return next(
      new AppError("Percentage, start date and end date are required", 400),
    );
  }

  if (percentage < 1 || percentage > 100) {
    return next(new AppError("Percentage must be between 1 and 100", 400));
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return next(new AppError("End date must be after start date", 400));
  }
  if (new Date(endDate) < new Date()) {
    return next(new AppError("End date must be a future date", 400));
  }

  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // verify ownership
  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  service.discount = {
    percentage,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    isActive: true,
  };

  await service.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Discount added successfully",
    data: { discount: service.discount },
  });
});

// remove discount (owner)
exports.removeDiscount = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }
  service.discount = null;
  await service.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Discount removed successfully",
  });
});

// remove service
exports.removeService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business || service.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  service.isActive = false;
  await service.save();
  res.status(200).json({
    success: true,
    status: 200,
    message: "Service removed successfully",
  });
});

// get available slots
exports.getAvailableSlots = catchAsync(async (req, res, next) => {
  const { date, staffId } = req.query;

  if (!date) {
    return next(new AppError("Please provide a date", 400));
  }

  const service = await Service.findById(req.params.id);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  const business = await Business.findById(service.business);

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // day on selected date
  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  // find working hours for this day
  const daySchedule = business.workingHours.find((d) => d.day === dayName);

  // business closed on this day
  if (!daySchedule || !daySchedule.isOpen) {
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Business is closed on this day",
      data: { availableSlots: [] },
    });
  }

  // generate all slots between open and close time
  // service duration + break time = total time per slot
  const slotDuration = service.duration + service.breakTime;

  const slots = generateTimeSlots(
    daySchedule.openTime,
    daySchedule.closeTime,
    slotDuration,
  );

  // get already booked slots for this date
  const bookedAppointments = await Appointment.find({
    service: service._id,
    date: {
      $gte: new Date(date),
      $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
    },
    status: { $in: ["pending", "confirmed"] },
  });

  const bookedSlots = bookedAppointments.map((a) => a.timeSlot);

  // check availability of specific staff
  let staffBusySlots = [];
  if (staffId) {
    const staff = await Staff.findById(staffId);

    if (staff) {
      // get staff availability for this day
      const staffDayAvail = staff.availability.find((a) => a.day === dayName);

      if (staffDayAvail) {
        // get appointments where this staff is already booked
        const staffAppointments = await Appointment.find({
          staff: staffId,
          date: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
          },
          status: { $in: ["pending", "confirmed"] },
        });

        staffBusySlots = staffAppointments.map((a) => a.timeSlot);
      }
    }
  }

  // combine all busy slots
  const allBusySlots = [...new Set([...bookedSlots, ...staffBusySlots])];

  // available slots
  const availableSlots = slots.filter((slot) => !allBusySlots.includes(slot));

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      date,
      dayName,
      serviceDuration: service.duration,
      availableSlots,
    },
  });
});
