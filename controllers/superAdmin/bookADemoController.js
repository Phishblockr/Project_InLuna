import schedule from 'node-schedule';
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getBookADemoModel } from "../../models/superAdmin/bookADemoModel.js";
import { generateZoomMeetUrl } from "../../utils/generateZoomMeetUrl.js";
import { sendAppointmentApprovedEmail } from "../../utils/sendAppointmentApprovedEmail.js";
import { sendAppointmentCreatedEmail } from "../../utils/sendAppointmentCreatedEmail.js";
import { combineDateAndTime } from '../../utils/combineDateAndTime.js';
import { sendAppointmentRemainderEmail } from '../../utils/sendAppointmentRemainderEmail.js';

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
        appointmentDate: { $gte: start, $lt: end }, approved: true
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

    await sendAppointmentCreatedEmail(email, "Appointment Requested!", email, name, appointmentDate, timeslot)

    return res.status(201).json({ message: "Appointment booked successfully." });
})

export const getAllAppointments = asyncHandler(async (req, res) => {
    const { month, year } = req.query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";

    // Calculate date ranges
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const Appointment = await getBookADemoModel();

    const searchFilter = search
        ? { $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ] }
        : {};

    const statusFilter =
    status === "all"
    ? {}
    : { approved: status === "true" };

    const queryFilter = { ...searchFilter, ...statusFilter, createdAt: { $gte: startOfMonth, $lt: endOfMonth } };

    const appointmentsCount = await Appointment.countDocuments(queryFilter)

    const appointments = await Appointment.find(queryFilter)
        // .skip(skip)
        // .limit(limit);

    const now = new Date();

    const sortedAppointments = appointments.sort((a, b) => {
        const aDateTime = combineDateAndTime(a.appointmentDate, a.timeslot);
        const bDateTime = combineDateAndTime(b.appointmentDate, b.timeslot);

        const aDiff = aDateTime >= now ? aDateTime - now : Infinity;
        const bDiff = bDateTime >= now ? bDateTime - now : Infinity;

        return aDiff - bDiff
    })

    const paginatedAppointments = sortedAppointments.slice(skip, skip + limit);

    res.status(200).json({ appointments: paginatedAppointments, appointmentsCount });

})

const scheduleAppointmentRemainders = (appointment) => {
    const fullAppointmentTime = combineDateAndTime(appointment.appointmentDate, appointment.timeslot)
    const reminderTime = new Date(fullAppointmentTime.getTime() - 30 * 60 * 1000);

    if (reminderTime > new Date ()){
        schedule.scheduleJob(reminderTime, () => {
            sendAppointmentRemainderEmail(appointment.email, "Appointment Reminder", appointment.name, appointment.appointmentDate, appointment.timeslot, appointment.meetUrl);
            console.log(`Reminder email sent to ${appointment.email} at ${reminderTime}`);
        })
    }
}

export const approveAppointments = asyncHandler(async (req, res) => {
    const {id} = req.params;
    if (!id) {
        return res.status(400).json({ error: "Appointment ID is required." });
    }
    const Appointment = await getBookADemoModel();

    const appointment = await Appointment.findById(id)

    if (!appointment){
        return res.status(404).json({ error: "appointment not found for given id" });
    }

    const meetUrl = generateZoomMeetUrl()

    appointment.approved = true;
    appointment.meetUrl = meetUrl;

    const updatedAppointment = await appointment.save();


    sendAppointmentApprovedEmail(updatedAppointment.email, "Appointment Approved Email", updatedAppointment.name, updatedAppointment.appointmentDate, updatedAppointment.timeslot, updatedAppointment.meetUrl);
    scheduleAppointmentRemainders(updatedAppointment);

    const io = req.app.get("socketio");
    if (io) {
        io.emit ("appointmentStatusUpdated", updatedAppointment);
    }

    res.status(200).json(updatedAppointment);
})