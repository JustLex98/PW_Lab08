// Archivo: index.js (o app.js)

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { pool } from "./db.js";
import userRoutes from "./routes/users.js";

// --- CONFIGURACIÓN INICIAL ---
const app = express();
const PORT = process.env.PORT || 5000;
// ¡MUY IMPORTANTE! En un entorno de producción, la clave secreta debe estar en una variable de entorno (.env)
const JWT_SECRET =
  process.env.JWT_SECRET || "your_super_secret_key_that_is_long_and_random";

// --- MIDDLEWARES GLOBALES ---
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Middleware para parsear el body de las peticiones a JSON

// --- MIDDLEWARE DE VERIFICACIÓN DE TOKEN (Mejor práctica: moverlo a /middlewares/verifyToken.js) ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        message:
          "Acceso no autorizado. Token no proporcionado o en formato incorrecto.",
      });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      // Diferenciar errores de token
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ message: "Token expirado." });
      }
      return res.status(403).json({ message: "Token inválido." });
    }
    // Adjuntamos la información decodificada del usuario a la petición
    req.user = decodedUser;
    next();
  });
};

// --- RUTAS PÚBLICAS (no requieren autenticación) ---

// Ruta de bienvenida o estado de la API
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Bienvenido a la API. El servidor está funcionando. 🧪" });
});

// Ruta de inicio de sesión
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email y contraseña son requeridos." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    // 1. Verificar si el usuario existe
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Credenciales inválidas." }); // Mensaje genérico por seguridad
    }

    const user = result.rows[0];

    // 2. Comparar la contraseña enviada con el hash almacenado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales inválidas." }); // Mensaje genérico por seguridad
    }

    // 3. Crear el payload para el token (con información útil pero no sensible)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name, // Suponiendo que la tabla users tiene una columna 'name'
    };

    // 4. Firmar y generar el token JWT
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    // 5. Enviar el token al cliente
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error detallado en /signin:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get("/profile", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Acceso concedido a la ruta protegida.",
    user: req.user,
  });
});

app.use("/api/v1/users", verifyToken, userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
