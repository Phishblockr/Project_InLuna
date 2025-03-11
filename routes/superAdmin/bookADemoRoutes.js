import express from "express";
import { availableTimeslots, bookDemo, getAllAppointments } from "../../controllers/superAdmin/bookADemoController.js";

const router = express.Router();

router.get("/availableTimeslots", availableTimeslots);
router.post("/bookDemo", bookDemo)
router.get("/fetchAppointments", getAllAppointments);

export default router;