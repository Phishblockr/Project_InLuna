import asyncHandler from "../../middlewares/asyncHandler.js";
import { getBookADemoModel } from "../../models/superAdmin/bookADemoModel.js";

// Define all possible timeslots (you can adjust these as needed)
const ALL_TIMESLOTS = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "02:00 PM",
    "03:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
];

export const availableTimeslots = asyncHandler(async (req, res) => {
    const Appointment = await getBookADemoModel();
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: "Date query parameter is required." })
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const appointments = await Appointment.find({
        appointmentDate: { $gte: start, $lt: end }
    });

    const bookedTimeslots = appointments.map(a => a.timeslot);
    const availableTimeslots = ALL_TIMESLOTS.filter(slot => !bookedTimeslots.includes(slot));

    return res.json({ availableTimeslots })
});

export const bookDemo = asyncHandler(async (req, res) => {
    const Appointment = await getBookADemoModel();

    const { appointmentDate, timeslot, name, email } = req.body;

    if (!appointmentDate || !timeslot || !name || !email) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    const dateObj = new Date(appointmentDate);
    const start = new Date(appointmentDate);
    const end = new Date(appointmentDate);
    end.setDate(end.getDate() + 1);

    const existingAppointment = await Appointment.findOne({
        appointmentDate: { $gte: start, $lt: end },
        timeslot: timeslot
    })
    if (existingAppointment) {
        return res.status(400).json({ message: "This timeslot is already booked." });
    }

    const existingEmailAppointment = await Appointment.findOne({
        appointmentDate: { $gte: start, $lt: end },
        email: email
    });
    
    if (existingEmailAppointment) {
        return res.status(400).json({ message: "This email has already booked a slot for this date." });
    }

    const appointment = new Appointment({
        appointmentDate: dateObj,
        timeslot,
        name,
        email,
    });

    await appointment.save();

    return res.status(201).json({ message: "Appointment booked successfully." });
})