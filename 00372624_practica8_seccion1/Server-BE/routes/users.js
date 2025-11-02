// Archivo: routes/users.js

import { Router } from "express";
import { pool } from "../db.js";

const router = Router();
const displayHome = (req, res) => {
  res.send("Rutas de usuario funcionando 🧪");
};

const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users"); // No envíes la contraseña
    res.json(result.rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener usuarios", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el usuario", error: error.message });
  }
};

const createUser = async (req, res) => {
  // Nota: La creación de usuario (signup) normalmente es una ruta pública,
  // pero aquí la mantenemos protegida como el resto.
  try {
    const { name, email, password } = req.body;
    // ¡IMPORTANTE! Nunca guardes contraseñas en texto plano. Deberías hashearla.
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, password] // En producción: [name, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al crear el usuario", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const result = await pool.query(
      "UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING id, name, email",
      [name, email, id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Usuario no encontrado para actualizar" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al actualizar el usuario",
        error: error.message,
      });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Usuario no encontrado para eliminar" });
    }
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar el usuario", error: error.message });
  }
};

// --- DEFINICIÓN DE RUTAS ---

// Ruta para obtener todos los usuarios (GET /api/v1/users/)
router.get("/", getUsers);

// Ruta para crear un nuevo usuario (POST /api/v1/users/)
router.post("/", createUser);

// Ruta para obtener un usuario por ID (GET /api/v1/users/:id)
router.get("/:id", getUserById);

// Ruta para actualizar un usuario por ID (PUT /api/v1/users/:id)
router.put("/:id", updateUser);

// Ruta para eliminar un usuario por ID (DELETE /api/v1/users/:id)
router.delete("/:id", deleteUser);

export default router;
