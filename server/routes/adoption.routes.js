import express from "express";
import {
  getAdoptions,
  approveAdoption,
  rejectAdoption,
  deleteAdoption,
  createAdoption,
} from "../controllers/adoption.controllers.js";

const router = express.Router();

router.get("/adoptions", getAdoptions);
router.post("/adoptions", createAdoption);
router.put("/adoptions/:id/approve", approveAdoption);
router.put("/adoptions/:id/reject", rejectAdoption);
router.delete("/adoptions/:id", deleteAdoption);

export default router;
