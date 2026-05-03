import { Router } from "express";
const router = Router();
import {
  loginUser,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  registerUser,
  acceptUser,
} from "../controllers/user.controller.js";

router.post("/login", loginUser);
router.post("/register", registerUser);

router.get("/users", getUsers);

router.get("/users/:id", getUser);

router.post("/users", createUser);

router.put("/users/:id", updateUser);
router.put("/users/accept/:id", acceptUser);

router.delete("/users/:id", deleteUser);

export default router;
