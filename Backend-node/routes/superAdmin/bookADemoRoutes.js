import express from "express";
import { approveAppointments, availableTimeslots, bookDemo, getAllAppointments } from "../../controllers/superAdmin/bookADemoController.js";
import salesTeamAccess from "../../middlewares/salesTeamAccess.js";

const router = express.Router();

router.get("/availableTimeslots", availableTimeslots);
router.post("/bookDemo", bookDemo)
router.get("/fetchAppointments", salesTeamAccess, getAllAppointments);
router.put("/approveAppointment/:id", salesTeamAccess, approveAppointments)

export default router;