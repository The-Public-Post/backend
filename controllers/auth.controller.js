// controllers/auth.controller.js
import { registerUser, loginUser } from "../services/auth.service.js";

// =======================
// REGISTER CONTROLLER
// =======================
export const register = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =======================
// LOGIN CONTROLLER
// =======================
export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
