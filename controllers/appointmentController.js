const Appointment = require("../models/appointmentModel");
const Service = require("../models/serviceModel");
const User = require("../models/userModel");
const Business = require("../models/businessModel");
const Staff = require("../models/staffModel");
const Transaction = require("../models/transactionModel");
const LoyaltyProgram = require("../models/loyaltyProgramModel");
const LoyaltyPoints = require("../models/loyaltyPointsModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// calculate booking price
const calculateBookingPrice = (service, selectedAddOns = [], business) => {
  let basePrice = service.price;

  if (
    service.discount &&
    service.discount.isActive &&
    new Date() >= service.discount.startDate &&
    new Date() <= service.discount.endDate
  ) {
    const discountAmount = (basePrice * service.discount.percentage) / 100;
    basePrice = basePrice - discountAmount;
  }

  // add selected add-ons prices
  const addOnsTotal = selectedAddOns.reduce(
    (sum, addOn) => sum + (addOn.price || 0),
    0,
  );

  const subtotal = basePrice + addOnsTotal;

  // tax calculations
  const salesTaxRate = business?.paymentAccount?.salesTaxRate ?? 7;
  const vatRate = business?.paymentAccount?.vatRate ?? 17;

  // convert percentage to decimal for calculation
  const salesTax = Math.round(subtotal * (salesTaxRate / 100) * 100) / 100;
  const vat = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const totalPrice = Math.round((subtotal + salesTax + vat) * 100) / 100;

  return { subtotal, salesTax, vat, totalPrice };
};

// booking summary
exports.getBookingSummary = catchAsync(async (req, res, next) => {
  const { serviceId, selectedAddOns = [] } = req.body;

  if (!serviceId) {
    return next(new AppError("Please provide service ID", 400));
  }

  const service = await Service.findById(serviceId).populate(
    "business",
    "businessName location phone",
  );

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  const business = await Business.findById(service.business);
  const pricing = calculateBookingPrice(service, selectedAddOns, business);

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      service: {
        name: service.name,
        duration: service.duration,
        business: service.business,
      },
      selectedAddOns,
      ...pricing,
    },
  });
});

// create booking
exports.createBooking = catchAsync(async (req, res, next) => {
  const {
    serviceId,
    staffId,
    date,
    timeSlot,
    selectedAddOns,
    specialNote,
    reminderEnabled,
    paymentMethod,
  } = req.body;

  if (!serviceId || !date || !timeSlot || !paymentMethod) {
    return next(
      new AppError(
        "Service, date, time slot and payment method are required",
        400,
      ),
    );
  }

  const service = await Service.findById(serviceId);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // prevent double booking!
  const existingBooking = await Appointment.findOne({
    service: serviceId,
    date: new Date(date),
    timeSlot,
    status: { $in: ["pending", "confirmed"] },
  });

  if (existingBooking) {
    return next(
      new AppError(
        "This time slot is already booked. Please choose another.",
        400,
      ),
    );
  }

  // check staff availability (if client selected staff)
  if (staffId) {
    const staffBooking = await Appointment.findOne({
      staff: staffId,
      date: new Date(date),
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (staffBooking) {
      return next(
        new AppError("Selected staff is not available at this time.", 400),
      );
    }
  }

  // calculate price
  const business = await Business.findById(service.business);
  const pricing = calculateBookingPrice(
    service,
    selectedAddOns || [],
    business,
  );

  const appointment = await Appointment.create({
    client: req.user.id,
    business: service.business,
    service: serviceId,
    staff: staffId || null,
    date: new Date(date),
    timeSlot,
    selectedAddOns: selectedAddOns || [],
    specialNote: specialNote || "",
    reminderEnabled: reminderEnabled || false,
    paymentMethod,
    paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
    ...pricing,
    status: "pending",
  });

  // create transaction record (E-receipt)
  await Transaction.create({
    appointment: appointment._id,
    client: req.user.id,
    business: service.business,
    ...pricing,
    paymentMethod,
    status: "success",
    receiptData: {
      businessName: (await Business.findById(service.business))?.businessName,
      serviceName: service.name,
      bookingDate: new Date(date),
      bookingTime: timeSlot,
    },
  });

  // Owner gets notified of new booking
  await Notification.create({
    recipient: (await Business.findById(service.business))?.owner,
    title: "New Booking Request",
    body: `You have a new booking request for ${service.name}`,
    type: "new_booking",
    referenceId: appointment._id,
  });

  // populate for response
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("service", "name duration price coverImage")
    .populate("business", "businessName location phone profilePhoto")
    .populate("staff", "name profilePhoto");

  res.status(201).json({
    success: true,
    status: 201,
    message: "Booking created successfully! Waiting for confirmation.",
    data: { appointment: populatedAppointment },
  });
});

// get my appointments (client)
exports.getMyAppointments = catchAsync(async (req, res, next) => {
  const { status } = req.query;

  const filter = { client: req.user.id };

  // filter by tab selected (upcoming = pending + confirmed)
  if (status === "upcoming") {
    filter.status = { $in: ["pending", "confirmed"] };
  } else if (status === "completed") {
    filter.status = "completed";
  } else if (status === "cancelled") {
    filter.status = "cancelled";
  }

  const appointments = await Appointment.find(filter)
    .populate("service", "name duration price coverImage")
    .populate("business", "businessName location profilePhoto")
    .populate("staff", "name profilePhoto")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: appointments.length,
    data: { appointments },
  });
});

// single appointment detail
exports.getAppointmentById = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("service", "name duration price coverImage description")
    .populate("business", "businessName location phone profilePhoto")
    .populate("staff", "name profilePhoto rating")
    .populate("client", "firstName lastName profilePhoto");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // verify this appointment belongs to the requesting user
  const isClient = appointment.client._id.toString() === req.user.id;
  const business = await Business.findOne({ owner: req.user.id });
  const isOwner =
    business && appointment.business._id.toString() === business._id.toString();

  if (!isClient && !isOwner) {
    return next(new AppError("Permission denied", 403));
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: { appointment },
  });
});

// cancel appointment (client)
exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError("Please provide a cancellation reason", 400));
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // verify this is client's appointment
  if (appointment.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  if (!["pending", "confirmed"].includes(appointment.status)) {
    return next(
      new AppError("Only upcoming appointments can be cancelled", 400),
    );
  }

  appointment.status = "cancelled";
  appointment.cancelReason = reason;
  appointment.cancelledBy = "client";
  await appointment.save();

  // notify business owner
  const business = await Business.findById(appointment.business);
  await Notification.create({
    recipient: business?.owner,
    title: "Booking Cancelled",
    body: `A client has cancelled their booking`,
    type: "booking_cancelled",
    referenceId: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Appointment cancelled successfully",
    data: { appointment },
  });
});

// re-book appointment
exports.reBook = catchAsync(async (req, res, next) => {
  const { date, timeSlot, paymentMethod } = req.body;

  if (!date || !timeSlot || !paymentMethod) {
    return next(
      new AppError("Date, time slot and payment method required", 400),
    );
  }

  const oldAppointment = await Appointment.findById(req.params.id);

  if (!oldAppointment) {
    return next(new AppError("Appointment not found", 404));
  }

  if (oldAppointment.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  const service = await Service.findById(oldAppointment.service);

  if (!service || !service.isActive) {
    return next(new AppError("Service no longer available", 400));
  }

  // check new slot availability
  const existingBooking = await Appointment.findOne({
    service: oldAppointment.service,
    date: new Date(date),
    timeSlot,
    status: { $in: ["pending", "confirmed"] },
  });

  if (existingBooking) {
    return next(new AppError("This slot is already booked", 400));
  }

  const business = await Business.findById(oldAppointment.business);
  const pricing = calculateBookingPrice(
    service,
    oldAppointment.selectedAddOns,
    business,
  );

  const newAppointment = await Appointment.create({
    client: req.user.id,
    business: oldAppointment.business,
    service: oldAppointment.service,
    staff: oldAppointment.staff,
    date: new Date(date),
    timeSlot,
    selectedAddOns: oldAppointment.selectedAddOns,
    specialNote: oldAppointment.specialNote,
    reminderEnabled: oldAppointment.reminderEnabled,
    paymentMethod,
    paymentStatus: "pending",
    ...pricing,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Re-booking created successfully",
    data: { appointment: newAppointment },
  });
});

// get appointments (owner)
exports.getOwnerAppointments = catchAsync(async (req, res, next) => {
  const { status, date, view = "list" } = req.query;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const filter = { business: business._id };

  // filter by status
  if (status === "upcoming") {
    filter.status = { $in: ["pending", "confirmed"] };
  } else if (status === "cancelled") {
    filter.status = "cancelled";
  } else if (status === "completed") {
    filter.status = "completed";
  } else if (status === "pending") {
    // waiting for acceptance
    filter.status = "pending";
  }

  // filter by specific date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const appointments = await Appointment.find(filter)
    .populate("client", "firstName lastName profilePhoto phone")
    .populate("service", "name duration price")
    .populate("staff", "name profilePhoto")
    .sort("date");

  res.status(200).json({
    success: true,
    status: 200,
    results: appointments.length,
    data: { appointments },
  });
});

// accept appointments (owner)
exports.acceptAppointment = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // verify appointment belongs to this business
  if (appointment.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  if (appointment.status !== "pending") {
    return next(new AppError("Only pending appointments can be accepted", 400));
  }

  appointment.status = "confirmed";
  await appointment.save();

  // notify client
  await Notification.create({
    recipient: appointment.client,
    title: "Booking Confirmed!",
    body: `Your booking has been confirmed by ${business.businessName}`,
    type: "booking_confirmed",
    referenceId: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Appointment accepted successfully",
    data: { appointment },
  });
});

// decline appointment (owner)
exports.declineAppointment = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  if (appointment.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  if (appointment.status !== "pending") {
    return next(new AppError("Only pending appointments can be declined", 400));
  }

  appointment.status = "cancelled";
  appointment.cancelReason = reason || "Declined by business";
  appointment.cancelledBy = "business";
  await appointment.save();

  // notify client
  await Notification.create({
    recipient: appointment.client,
    title: "Booking Declined",
    body: `Your booking at ${business.businessName} was declined`,
    type: "booking_cancelled",
    referenceId: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Appointment declined",
    data: { appointment },
  });
});

// mark appointment as complete (owner)
exports.markComplete = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  if (appointment.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  if (appointment.status !== "confirmed") {
    return next(
      new AppError("Only confirmed appointments can be marked complete", 400),
    );
  }

  appointment.status = "completed";
  appointment.paymentStatus = "paid";
  await appointment.save();

  // add loyalty points if program exists
  const loyaltyProgram = await LoyaltyProgram.findOne({
    business: business._id,
    service: appointment.service,
    isActive: true,
  });

  if (loyaltyProgram) {
    // find or create loyalty points record for this client
    let loyaltyPoints = await LoyaltyPoints.findOne({
      client: appointment.client,
      business: business._id,
    });

    if (loyaltyPoints) {
      loyaltyPoints.points += loyaltyProgram.pointsPerBooking;
    } else {
      loyaltyPoints = new LoyaltyPoints({
        client: appointment.client,
        business: business._id,
        points: loyaltyProgram.pointsPerBooking,
        discountPercent: loyaltyProgram.rewardPercent,
      });
    }

    await loyaltyPoints.save();
  }

  // notify client
  await Notification.create({
    recipient: appointment.client,
    title: "Service Completed!",
    body: `Your appointment at ${business.businessName} is complete. Please leave a review!`,
    type: "booking_completed",
    referenceId: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Appointment marked as complete",
    data: { appointment },
  });
});

// cancel appointment (owner)
exports.cancelByOwner = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new AppError("Please provide cancellation reason", 400));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  if (appointment.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  if (!["pending", "confirmed"].includes(appointment.status)) {
    return next(new AppError("This appointment cannot be cancelled", 400));
  }

  appointment.status = "cancelled";
  appointment.cancelReason = reason;
  appointment.cancelledBy = "business";
  await appointment.save();

  // notify client
  await Notification.create({
    recipient: appointment.client,
    title: "Booking Cancelled by Business",
    body: `Your booking at ${business.businessName} has been cancelled`,
    type: "booking_cancelled",
    referenceId: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Appointment cancelled",
    data: { appointment },
  });
});

// add manual booking
exports.addManualBooking = catchAsync(async (req, res, next) => {
  const {
    clientName,
    clientPhone,
    serviceId,
    staffId,
    date,
    timeSlot,
    paymentMethod,
  } = req.body;

  if (!clientName || !serviceId || !date || !timeSlot) {
    return next(
      new AppError(
        "Client name, service, date and time slot are required",
        400,
      ),
    );
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const service = await Service.findById(serviceId);

  if (!service || !service.isActive) {
    return next(new AppError("Service not found", 404));
  }

  // check slot availability
  const existingBooking = await Appointment.findOne({
    service: serviceId,
    date: new Date(date),
    timeSlot,
    status: { $in: ["pending", "confirmed"] },
  });

  if (existingBooking) {
    return next(new AppError("This slot is already booked", 400));
  }

  const pricing = calculateBookingPrice(service, [], business);

  const appointment = await Appointment.create({
    client: req.user.id, // owner's id as placeholder
    business: business._id,
    service: serviceId,
    staff: staffId || null,
    date: new Date(date),
    timeSlot,
    paymentMethod: paymentMethod || "cash",
    paymentStatus: "pending",
    isManualBooking: true,
    manualClientName: clientName,
    manualClientPhone: clientPhone || null,
    status: "confirmed",
    ...pricing,
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Manual booking added successfully",
    data: { appointment },
  });
});

// get E-Reciept
exports.getEReceipt = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("service", "name duration price")
    .populate("business", "businessName location phone")
    .populate("client", "firstName lastName");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // verify ownership
  const isClient = appointment.client._id.toString() === req.user.id;
  const business = await Business.findOne({ owner: req.user.id });
  const isOwner =
    business && appointment.business._id.toString() === business._id.toString();

  if (!isClient && !isOwner) {
    return next(new AppError("Permission denied", 403));
  }

  // get transaction for payment details
  const transaction = await Transaction.findOne({
    appointment: appointment._id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      receipt: {
        businessName: appointment.business.businessName,
        businessAddress: appointment.business.location?.address,
        businessPhone: appointment.business.phone,
        clientName: appointment.isManualBooking
          ? appointment.manualClientName
          : `${appointment.client.firstName} ${appointment.client.lastName}`,
        serviceName: appointment.service.name,
        bookingDate: appointment.date,
        bookingTime: appointment.timeSlot,
        subtotal: appointment.subtotal,
        salesTax: appointment.salesTax,
        vat: appointment.vat,
        total: appointment.totalPrice,
        paymentMethod: appointment.paymentMethod,
        paymentStatus: appointment.paymentStatus,
        transactionId: transaction?._id,
      },
    },
  });
});

// get client databse
exports.getClientDatabase = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // get all unique clients who booked with this business
  const clientIds = await Appointment.distinct("client", {
    business: business._id,
    isManualBooking: false,
  });

  let clientFilter = { _id: { $in: clientIds } };

  if (search) {
    clientFilter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const clients = await User.find(clientFilter).select(
    "firstName lastName email profilePhoto",
  );

  // for each client get their last appointment
  const clientsWithLastBooking = await Promise.all(
    clients.map(async (client) => {
      const lastAppointment = await Appointment.findOne({
        client: client._id,
        business: business._id,
      })
        .sort("-createdAt")
        .populate("service", "name");

      return {
        ...client.toJSON(),
        lastAppointment: lastAppointment
          ? {
              date: lastAppointment.date,
              service: lastAppointment.service?.name,
              status: lastAppointment.status,
            }
          : null,
      };
    }),
  );

  res.status(200).json({
    success: true,
    status: 200,
    total: clientsWithLastBooking.length,
    data: { clients: clientsWithLastBooking },
  });
});

// get client detail (owner)
exports.getClientDetail = catchAsync(async (req, res, next) => {
  const { tab = "info" } = req.query;

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const User = require("../models/userModel");
  const client = await User.findById(req.params.clientId).select(
    "firstName lastName email profilePhoto location",
  );

  if (!client) {
    return next(new AppError("Client not found", 404));
  }

  let tabData = {};

  if (tab === "appointments") {
    tabData.appointments = await Appointment.find({
      client: req.params.clientId,
      business: business._id,
    })
      .populate("service", "name price")
      .sort("-date");
  } else if (tab === "payments") {
    tabData.payments = await Transaction.find({
      client: req.params.clientId,
      business: business._id,
    }).sort("-createdAt");
  } else if (tab === "preferences") {
    const preferredService = await Appointment.aggregate([
      {
        $match: {
          client: client._id,
          business: business._id,
          status: "completed",
        },
      },
      { $group: { _id: "$service", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const preferredStaff = await Appointment.aggregate([
      {
        $match: {
          client: client._id,
          business: business._id,
          status: "completed",
          staff: { $ne: null },
        },
      },
      { $group: { _id: "$staff", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    tabData.preferences = {
      preferredService: preferredService[0]?._id || null,
      preferredStaff: preferredStaff[0]?._id || null,
    };
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      client,
      ...tabData,
    },
  });
});
