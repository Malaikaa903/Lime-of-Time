const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/userModel");
const Business = require("../models/businessModel");
const Staff = require("../models/staffModel");
const Service = require("../models/serviceModel");
const Appointment = require("../models/appointmentModel");
const Review = require("../models/reviewModel");
const Transaction = require("../models/transactionModel");
const SubscriptionPlan = require("../models/subscriptionPlanModel");
const ClientSubscription = require("../models/clientSubscriptionModel");
const LoyaltyProgram = require("../models/loyaltyProgramModel");
const LoyaltyPoints = require("../models/loyaltyPointsModel");
const Category = require("../models/categoryModel");
const Notification = require("../models/notificationModel");

const connectDB = require("../utils/db");
connectDB();

// ─── IMPORT DATA ──────────────────────────────────
const importData = async () => {
  try {
    console.log("🗑️  Deleting old data...");
    await User.deleteMany();
    await Business.deleteMany();
    await Staff.deleteMany();
    await Service.deleteMany();
    await Appointment.deleteMany();
    await Review.deleteMany();
    await Transaction.deleteMany();
    await SubscriptionPlan.deleteMany();
    await ClientSubscription.deleteMany();
    await LoyaltyProgram.deleteMany();
    await LoyaltyPoints.deleteMany();
    await Category.deleteMany();
    await Notification.deleteMany();
    console.log("✅ Old data deleted!");

    // hash password once for all users
    // same as Jonas Schmedtmann approach!
    const password = "test1234";
    // ─── USERS ────────────────────────────────────
    console.log("👤 Creating users...");
    const users = await User.create([
      // CLIENTS
      {
        firstName: "Hassan",
        lastName: "Ahmed",
        email: "hassan@test.com",
        password,
        passwordConfirm: password,
        role: "client",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3587, 31.5204],
          address: "Gulberg III, Lahore",
        },
      },
      {
        firstName: "Sophia",
        lastName: "Khan",
        email: "sophia@test.com",
        password,
        passwordConfirm: password,
        role: "client",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3683, 31.5497],
          address: "DHA Phase 5, Lahore",
        },
      },
      {
        firstName: "Ali",
        lastName: "Raza",
        email: "ali@test.com",
        password,
        passwordConfirm: password,
        role: "client",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3294, 31.4697],
          address: "Model Town, Lahore",
        },
      },
      // BUSINESS OWNERS
      {
        firstName: "Sarah",
        lastName: "Malik",
        email: "owner1@test.com",
        password,
        passwordConfirm: password,
        role: "business_owner",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3587, 31.5204], // Add coordinates (longitude, latitude)
          address: "Some address in Lahore", // Optional but recommended
        },
      },
      {
        firstName: "Ahmed",
        lastName: "Siddiqui",
        email: "owner2@test.com",
        password,
        passwordConfirm: password,
        role: "business_owner",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3683, 31.5497], // Add coordinates
          address: "Another address in Lahore",
        },
      },
      // ADMIN
      {
        firstName: "Admin",
        lastName: "Lime",
        email: "admin@limeofttime.com",
        password,
        passwordConfirm: password,
        role: "admin",
        isVerified: true,
        profileCompleted: true,
        location: {
          type: "Point",
          coordinates: [74.3683, 31.5497], // Add coordinates
          address: "Another address in Lahore",
        },
      },
    ]);

    const client1 = users[0]; // Hassan
    const client2 = users[1]; // Sophia
    const client3 = users[2]; // Ali
    const owner1 = users[3]; // Sarah
    const owner2 = users[4]; // Ahmed
    console.log("✅ Users created!");

    // ─── CATEGORIES ───────────────────────────────
    console.log("📂 Creating categories...");
    await Category.create([
      { name: "Hair & Beauty", isActive: true, createdBy: "admin" },
      { name: "Massage Therapy", isActive: true, createdBy: "admin" },
      { name: "Fitness Training", isActive: true, createdBy: "admin" },
      { name: "Nail Care", isActive: true, createdBy: "admin" },
      { name: "Skin Care", isActive: true, createdBy: "admin" },
      { name: "Barber Services", isActive: true, createdBy: "admin" },
    ]);
    console.log("✅ Categories created!");

    // ─── BUSINESSES ───────────────────────────────
    console.log("🏢 Creating businesses...");
    const businesses = await Business.create([
      {
        owner: owner1._id,
        businessName: "Lime Touch Spa",
        category: "Hair & Beauty",
        description:
          "Premium hair and beauty services in Lahore. Expert stylists for all hair types.",
        phone: "+923001234567",
        email: "limetouchspa@test.com",
        location: {
          type: "Point",
          coordinates: [74.3587, 31.5204],
          address: "2400 US-30 Suite 106, Gulberg, Lahore",
        },
        workingHours: [
          {
            day: "Monday",
            isOpen: true,
            openTime: "09:00",
            closeTime: "18:00",
          },
          {
            day: "Tuesday",
            isOpen: true,
            openTime: "09:00",
            closeTime: "18:00",
          },
          {
            day: "Wednesday",
            isOpen: true,
            openTime: "09:00",
            closeTime: "18:00",
          },
          {
            day: "Thursday",
            isOpen: true,
            openTime: "09:00",
            closeTime: "18:00",
          },
          {
            day: "Friday",
            isOpen: true,
            openTime: "09:00",
            closeTime: "17:00",
          },
          {
            day: "Saturday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "16:00",
          },
          { day: "Sunday", isOpen: false, openTime: null, closeTime: null },
        ],
        paymentAccount: {
          bankName: "HBL",
          accountTitle: "Lime Touch Spa",
          accountNumber: "1234567890",
          iban: "PK36SCBL0000001123456702",
          acceptsFullPayment: true,
          acceptsPartialPayment: false,
          acceptsCash: true,
          salesTaxRate: 7,
          vatRate: 17,
        },
        rating: 4.8,
        totalReviews: 24,
        setupComplete: true,
        setupStep: 6,
        isPinned: true,
        isActive: true,
      },
      {
        owner: owner2._id,
        businessName: "Men Cave",
        category: "Barber Services",
        description:
          "Premium grooming services for men. Expert barbers for all styles.",
        phone: "+923009876543",
        email: "mencave@test.com",
        location: {
          type: "Point",
          coordinates: [74.3683, 31.5497],
          address: "DHA Phase 5, Main Boulevard, Lahore",
        },
        workingHours: [
          {
            day: "Monday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "20:00",
          },
          {
            day: "Tuesday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "20:00",
          },
          {
            day: "Wednesday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "20:00",
          },
          {
            day: "Thursday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "20:00",
          },
          {
            day: "Friday",
            isOpen: true,
            openTime: "10:00",
            closeTime: "20:00",
          },
          {
            day: "Saturday",
            isOpen: true,
            openTime: "11:00",
            closeTime: "18:00",
          },
          { day: "Sunday", isOpen: false, openTime: null, closeTime: null },
        ],
        paymentAccount: {
          bankName: "MCB",
          accountTitle: "Men Cave",
          accountNumber: "9876543210",
          acceptsFullPayment: true,
          acceptsCash: true,
          salesTaxRate: 7,
          vatRate: 17,
        },
        rating: 4.5,
        totalReviews: 18,
        setupComplete: true,
        setupStep: 6,
        isPinned: false,
        isActive: true,
      },
    ]);

    const business1 = businesses[0]; // Lime Touch Spa
    const business2 = businesses[1]; // Men Cave
    console.log("✅ Businesses created!");

    // ─── SUBSCRIPTION PLANS ───────────────────────
    console.log("💳 Creating subscription plans...");
    const plans = await SubscriptionPlan.create([
      {
        business: business1._id,
        planName: "Silver",
        timePeriod: "monthly",
        amount: 50,
        facilities: "10% discount on all services, Priority booking",
        isActive: true,
      },
      {
        business: business1._id,
        planName: "Gold",
        timePeriod: "monthly",
        amount: 90,
        facilities:
          "20% discount on all services, Priority booking, Free consultation",
        isActive: true,
      },
      {
        business: business2._id,
        planName: "Silver",
        timePeriod: "monthly",
        amount: 40,
        facilities: "10% discount, Free beard trim monthly",
        isActive: true,
      },
    ]);
    console.log("✅ Subscription plans created!");

    // ─── STAFF ────────────────────────────────────
    console.log("👨‍💼 Creating staff...");
    const staffMembers = await Staff.create([
      {
        business: business1._id,
        name: "Alex Rodriguez",
        description:
          "Expert hair stylist with 7 years experience. Specializes in modern cuts.",
        availability: [
          {
            day: "Monday",
            slots: [
              "09:00",
              "09:40",
              "10:20",
              "11:00",
              "14:00",
              "14:40",
              "15:20",
            ],
          },
          {
            day: "Tuesday",
            slots: ["09:00", "09:40", "10:20", "11:00", "14:00", "14:40"],
          },
          {
            day: "Wednesday",
            slots: ["09:00", "09:40", "10:20", "14:00", "14:40", "15:20"],
          },
          {
            day: "Thursday",
            slots: ["09:00", "09:40", "11:00", "14:00", "14:40"],
          },
          { day: "Friday", slots: ["09:00", "09:40", "10:20", "14:00"] },
          { day: "Saturday", slots: ["10:00", "10:40", "11:20", "14:00"] },
        ],
        rating: 4.9,
        totalReviews: 15,
        isActive: true,
      },
      {
        business: business1._id,
        name: "Sabina Gomez",
        description: "Specialist in hair coloring, highlights and styling.",
        availability: [
          {
            day: "Monday",
            slots: ["10:00", "10:40", "11:20", "14:00", "14:40", "15:20"],
          },
          {
            day: "Wednesday",
            slots: ["10:00", "10:40", "11:20", "14:00", "14:40"],
          },
          {
            day: "Friday",
            slots: ["10:00", "10:40", "14:00", "14:40", "15:20"],
          },
          { day: "Saturday", slots: ["10:00", "10:40", "11:20"] },
        ],
        rating: 4.7,
        totalReviews: 9,
        isActive: true,
      },
      {
        business: business2._id,
        name: "Bilal Hassan",
        description:
          "Professional barber specializing in fades and beard styling.",
        availability: [
          {
            day: "Monday",
            slots: [
              "10:00",
              "10:30",
              "11:00",
              "11:30",
              "14:00",
              "14:30",
              "15:00",
            ],
          },
          {
            day: "Tuesday",
            slots: ["10:00", "10:30", "11:00", "14:00", "14:30"],
          },
          {
            day: "Wednesday",
            slots: ["10:00", "10:30", "11:00", "14:00", "14:30", "15:00"],
          },
          { day: "Thursday", slots: ["10:00", "10:30", "14:00", "14:30"] },
          { day: "Friday", slots: ["10:00", "10:30", "11:00", "14:00"] },
          { day: "Saturday", slots: ["11:00", "11:30", "14:00", "14:30"] },
        ],
        rating: 4.6,
        totalReviews: 12,
        isActive: true,
      },
    ]);

    const staff1 = staffMembers[0]; // Alex
    const staff2 = staffMembers[1]; // Sabina
    const staff3 = staffMembers[2]; // Bilal
    console.log("✅ Staff created!");

    // ─── SERVICES ─────────────────────────────────
    console.log("💇 Creating services...");
    const services = await Service.create([
      // Lime Touch Spa services
      {
        business: business1._id,
        name: "Special Hair Cutting",
        description: "Premium hair cutting with modern styling technique",
        category: "Hair & Beauty",
        price: 50,
        duration: 30,
        breakTime: 10,
        rating: 4.8,
        totalReviews: 12,
        isActive: true,
        addOns: [
          {
            name: "Express Service",
            price: 5,
            description: "Done in 20 mins instead of 30",
          },
          {
            name: "Hair Wash",
            price: 8,
            description: "Includes premium shampoo & conditioner",
          },
        ],
      },
      {
        business: business1._id,
        name: "Layered Cut",
        description: "Beautiful layered haircut for all hair types",
        category: "Hair & Beauty",
        price: 75,
        duration: 45,
        breakTime: 10,
        rating: 4.7,
        totalReviews: 8,
        isActive: true,
        addOns: [
          {
            name: "Deep Conditioning",
            price: 12,
            description: "Extra moisture treatment",
          },
        ],
      },
      {
        business: business1._id,
        name: "Hair Coloring",
        description: "Full hair coloring with premium colors",
        category: "Hair & Beauty",
        price: 120,
        duration: 90,
        breakTime: 15,
        rating: 4.9,
        totalReviews: 4,
        isActive: true,
      },
      // Men Cave services
      {
        business: business2._id,
        name: "Classic Hair Cut",
        description: "Clean and classic haircut for men",
        category: "Barber Services",
        price: 30,
        duration: 20,
        breakTime: 5,
        rating: 4.6,
        totalReviews: 10,
        isActive: true,
        addOns: [
          { name: "Hair Styling", price: 5, description: "Blowdry and style" },
        ],
      },
      {
        business: business2._id,
        name: "Beard Trim & Shape",
        description: "Professional beard shaping and grooming",
        category: "Barber Services",
        price: 25,
        duration: 20,
        breakTime: 5,
        rating: 4.7,
        totalReviews: 8,
        isActive: true,
      },
      {
        business: business2._id,
        name: "Full Grooming Package",
        description: "Complete package: haircut + beard trim + face massage",
        category: "Barber Services",
        price: 80,
        duration: 60,
        breakTime: 15,
        rating: 4.9,
        totalReviews: 6,
        isActive: true,
        addOns: [
          {
            name: "Hot Towel Treatment",
            price: 10,
            description: "Relaxing hot towel finish",
          },
          { name: "Hair Wax", price: 5, description: "Premium styling wax" },
        ],
      },
    ]);

    // assign services to staff
    staffMembers[0].assignedServices = [services[0]._id, services[1]._id];
    staffMembers[1].assignedServices = [services[1]._id, services[2]._id];
    staffMembers[2].assignedServices = [
      services[3]._id,
      services[4]._id,
      services[5]._id,
    ];
    await staffMembers[0].save();
    await staffMembers[1].save();
    await staffMembers[2].save();

    console.log("✅ Services created and assigned to staff!");

    // ─── LOYALTY PROGRAMS ─────────────────────────
    console.log("🎁 Creating loyalty programs...");
    await LoyaltyProgram.create([
      {
        business: business1._id,
        service: services[0]._id,
        pointsPerBooking: 10,
        pointsToRedeem: 50,
        rewardPercent: 10,
        expiryDate: new Date("2026-12-31"),
        isActive: true,
      },
      {
        business: business2._id,
        service: services[3]._id,
        pointsPerBooking: 8,
        pointsToRedeem: 40,
        rewardPercent: 15,
        expiryDate: new Date("2026-12-31"),
        isActive: true,
      },
    ]);
    console.log("✅ Loyalty programs created!");

    // ─── PAST APPOINTMENTS ────────────────────────
    console.log("📅 Creating appointments...");

    // past dates for completed appointments
    const pastDates = [
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    ];

    // future dates for upcoming appointments
    const futureDates = [
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    ];

    // price calculator helper
    const calcPricing = (price) => {
      const subtotal = price;
      const salesTax = Math.round(subtotal * 0.07 * 100) / 100;
      const vat = Math.round(subtotal * 0.17 * 100) / 100;
      const totalPrice = Math.round((subtotal + salesTax + vat) * 100) / 100;
      return { subtotal, salesTax, vat, totalPrice };
    };

    // COMPLETED appointments (past)
    const completedAppointmentsData = [
      // Hassan at Lime Touch Spa
      {
        client: client1._id,
        business: business1._id,
        service: services[0]._id,
        staff: staff1._id,
        date: pastDates[0],
        timeSlot: "10:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: true,
        ...calcPricing(50),
      },
      {
        client: client1._id,
        business: business1._id,
        service: services[0]._id,
        staff: staff1._id,
        date: pastDates[2],
        timeSlot: "11:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: true,
        ...calcPricing(50),
      },
      {
        client: client1._id,
        business: business1._id,
        service: services[1]._id,
        staff: staff2._id,
        date: pastDates[4],
        timeSlot: "14:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: false,
        ...calcPricing(75),
      },
      // Sophia at Lime Touch Spa
      {
        client: client2._id,
        business: business1._id,
        service: services[2]._id,
        staff: staff2._id,
        date: pastDates[1],
        timeSlot: "10:00",
        status: "completed",
        paymentMethod: "credit_card",
        paymentStatus: "paid",
        isReviewed: true,
        ...calcPricing(120),
      },
      {
        client: client2._id,
        business: business1._id,
        service: services[0]._id,
        staff: staff1._id,
        date: pastDates[3],
        timeSlot: "09:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: false,
        ...calcPricing(50),
      },
      // Ali at Men Cave
      {
        client: client3._id,
        business: business2._id,
        service: services[3]._id,
        staff: staff3._id,
        date: pastDates[0],
        timeSlot: "10:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: true,
        ...calcPricing(30),
      },
      {
        client: client3._id,
        business: business2._id,
        service: services[5]._id,
        staff: staff3._id,
        date: pastDates[5],
        timeSlot: "14:00",
        status: "completed",
        paymentMethod: "cash",
        paymentStatus: "paid",
        isReviewed: false,
        ...calcPricing(80),
      },
    ];

    // UPCOMING appointments (future)
    const upcomingAppointmentsData = [
      {
        client: client1._id,
        business: business1._id,
        service: services[0]._id,
        staff: staff1._id,
        date: futureDates[0],
        timeSlot: "10:00",
        status: "confirmed",
        paymentMethod: "cash",
        paymentStatus: "pending",
        reminderEnabled: true,
        specialNote: "Please use mild products",
        ...calcPricing(50),
      },
      {
        client: client2._id,
        business: business1._id,
        service: services[1]._id,
        staff: staff2._id,
        date: futureDates[1],
        timeSlot: "14:00",
        status: "pending",
        paymentMethod: "cash",
        paymentStatus: "pending",
        ...calcPricing(75),
      },
      {
        client: client3._id,
        business: business2._id,
        service: services[4]._id,
        staff: staff3._id,
        date: futureDates[2],
        timeSlot: "11:00",
        status: "confirmed",
        paymentMethod: "cash",
        paymentStatus: "pending",
        ...calcPricing(25),
      },
    ];

    // CANCELLED appointment
    const cancelledAppointmentsData = [
      {
        client: client1._id,
        business: business2._id,
        service: services[3]._id,
        date: pastDates[6],
        timeSlot: "11:00",
        status: "cancelled",
        cancelReason: "Schedule Change",
        cancelledBy: "client",
        paymentMethod: "cash",
        paymentStatus: "pending",
        ...calcPricing(30),
      },
    ];

    const allAppointments = await Appointment.create([
      ...completedAppointmentsData,
      ...upcomingAppointmentsData,
      ...cancelledAppointmentsData,
    ]);

    console.log("✅ Appointments created!");

    // ─── TRANSACTIONS ─────────────────────────────
    console.log("💰 Creating transactions...");
    const transactionsData = allAppointments
      .filter((a) => a.paymentStatus === "paid")
      .map((a) => ({
        appointment: a._id,
        client: a.client,
        business: a.business,
        subtotal: a.subtotal,
        salesTax: a.salesTax,
        vat: a.vat,
        totalAmount: a.totalPrice,
        paymentMethod: a.paymentMethod,
        status: "success",
        receiptData: {
          bookingDate: a.date,
          bookingTime: a.timeSlot,
        },
      }));

    await Transaction.create(transactionsData);
    console.log("✅ Transactions created!");

    // ─── REVIEWS ──────────────────────────────────
    console.log("⭐ Creating reviews...");
    // reviews for isReviewed: true appointments
    const reviewedAppointments = allAppointments.filter(
      (a) => a.isReviewed === true,
    );

    const reviewsData = [
      {
        client: client1._id,
        business: business1._id,
        service: services[0]._id,
        appointment: reviewedAppointments[0]._id,
        staff: staff1._id,
        rating: 5,
        comment:
          "Alex is amazing! Perfect haircut every time. Highly recommend!",
      },
      {
        client: client1._id,
        business: business1._id,
        service: services[0]._id,
        appointment: reviewedAppointments[1]._id,
        staff: staff1._id,
        rating: 5,
        comment: "Always a great experience at Lime Touch Spa!",
      },
      {
        client: client2._id,
        business: business1._id,
        service: services[2]._id,
        appointment: reviewedAppointments[2]._id,
        staff: staff2._id,
        rating: 4,
        comment:
          "Sabina did an excellent job with the coloring. Very professional!",
      },
      {
        client: client3._id,
        business: business2._id,
        service: services[3]._id,
        appointment: reviewedAppointments[3]._id,
        staff: staff3._id,
        rating: 5,
        comment: "Best barber in town! Clean and precise cuts.",
      },
    ];

    await Review.create(reviewsData);
    console.log("✅ Reviews created!");

    // ─── LOYALTY POINTS ───────────────────────────
    console.log("🎁 Creating loyalty points...");
    await LoyaltyPoints.create([
      {
        client: client1._id,
        business: business1._id,
        points: 20, // Hassan has 20 points at Lime Touch Spa
        discountPercent: 10,
      },
      {
        client: client2._id,
        business: business1._id,
        points: 10,
        discountPercent: 10,
      },
      {
        client: client3._id,
        business: business2._id,
        points: 8,
        discountPercent: 15,
      },
    ]);
    console.log("✅ Loyalty points created!");

    // ─── CLIENT SUBSCRIPTIONS ─────────────────────
    console.log("📋 Creating client subscriptions...");
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await ClientSubscription.create([
      {
        client: client1._id,
        business: business1._id,
        plan: plans[0]._id, // Hassan → Silver plan at Lime Touch Spa
        subscribedOn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        nextBilling: nextMonth,
        autoRenew: true,
        status: "active",
      },
      {
        client: client2._id,
        business: business1._id,
        plan: plans[1]._id, // Sophia → Gold plan at Lime Touch Spa
        subscribedOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextBilling: nextMonth,
        autoRenew: false,
        status: "active",
      },
    ]);
    console.log("✅ Client subscriptions created!");

    // ─── NOTIFICATIONS ────────────────────────────
    console.log("🔔 Creating notifications...");
    await Notification.create([
      {
        recipient: owner1._id,
        title: "New Booking Request",
        body: "Hassan Ahmed has requested a booking for Special Hair Cutting",
        type: "new_booking",
        isRead: false,
      },
      {
        recipient: client1._id,
        title: "Booking Confirmed!",
        body: "Your booking at Lime Touch Spa has been confirmed",
        type: "booking_confirmed",
        isRead: false,
      },
      {
        recipient: client1._id,
        title: "Service Completed!",
        body: "Your appointment at Lime Touch Spa is complete. Please leave a review!",
        type: "booking_completed",
        isRead: true,
      },
      {
        recipient: owner2._id,
        title: "New Booking Request",
        body: "Ali Raza has requested a booking for Classic Hair Cut",
        type: "new_booking",
        isRead: false,
      },
      {
        recipient: client3._id,
        title: "Booking Confirmed!",
        body: "Your booking at Men Cave has been confirmed",
        type: "booking_confirmed",
        isRead: true,
      },
    ]);
    console.log("✅ Notifications created!");

    // ─── SUCCESS ──────────────────────────────────
    console.log("\n🎉 ================================");
    console.log("   ALL SEED DATA IMPORTED!");
    console.log("================================");
    console.log("\n📧 Test Accounts (password: test1234):");
    console.log("─────────────────────────────────────");
    console.log("👤 Clients:");
    console.log("   hassan@test.com     → client");
    console.log("   sophia@test.com     → client");
    console.log("   ali@test.com        → client");
    console.log("─────────────────────────────────────");
    console.log("🏢 Business Owners:");
    console.log("   owner1@test.com     → Lime Touch Spa");
    console.log("   owner2@test.com     → Men Cave");
    console.log("─────────────────────────────────────");
    console.log("🔐 Admin:");
    console.log("   admin@limeofttime.com → admin");
    console.log("─────────────────────────────────────");
    console.log("\n📊 Data Summary:");
    console.log("   Users:          6");
    console.log("   Categories:     6");
    console.log("   Businesses:     2");
    console.log("   Staff:          3");
    console.log("   Services:       6");
    console.log("   Appointments:   11 (7 completed, 3 upcoming, 1 cancelled)");
    console.log("   Reviews:        4");
    console.log("   Transactions:   7");
    console.log("   Notifications:  5");
    console.log("================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing data:", err);
    process.exit(1);
  }
};

// ─── DELETE DATA ──────────────────────────────────
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Business.deleteMany();
    await Staff.deleteMany();
    await Service.deleteMany();
    await Appointment.deleteMany();
    await Review.deleteMany();
    await Transaction.deleteMany();
    await SubscriptionPlan.deleteMany();
    await ClientSubscription.deleteMany();
    await LoyaltyProgram.deleteMany();
    await LoyaltyPoints.deleteMany();
    await Category.deleteMany();
    await Notification.deleteMany();

    console.log("✅ All data deleted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting data:", err);
    process.exit(1);
  }
};

// run based on command
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log("Usage: node dev-data/seeder.js --import");
  console.log("       node dev-data/seeder.js --delete");
  process.exit(1);
}
