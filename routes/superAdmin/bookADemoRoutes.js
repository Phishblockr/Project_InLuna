import express from "express";
import { availableTimeslots, bookDemo } from "../../controllers/superAdmin/bookADemoController.js";

const router = express.Router();

router.get("/availableTimeslots", availableTimeslots);
router.post("/bookDemo", bookDemo)

export default router;