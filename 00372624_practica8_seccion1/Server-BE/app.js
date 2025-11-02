// Archivo: app.js

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { pool } from "./db.js";
import userRoutes from "./routes/users.js";

// --- CONFIGURACIÓN ---
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Acceso no autorizado. Token no proporcionado." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido." });
    }
    req.user = decodedUser;
    next();
  });
};

// --- RUTAS PÚBLICAS ---
app.get("/", (req, res) => {
  res.status(200).json({ message: "API funcionando. 🧪" });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son requeridos." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Credenciales inválidas." });
    }

    const user = result.rows[0];

    // --- VALIDACIÓN DE CONTRASEÑA OMITIDA PARA PRUEBAS ---
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = true; // Permite el acceso con cualquier contraseña.

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas." });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Inicio de sesión exitoso (modo de prueba).",
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error("Error detallado en /signin:", error); 
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- RUTAS PROTEGIDAS ---
app.use("/api/v1/users", verifyToken, userRoutes);

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});