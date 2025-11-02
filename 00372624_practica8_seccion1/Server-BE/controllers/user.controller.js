import { pool } from '../database.js'

export const displayHome = (req, res) => {
  res.send('Bienvenido a la API de usuarios 🧪')
}

export const getUsers = async (req, res) => {
  const result = await pool.query('SELECT * FROM users')
  res.json(result.rows)
}

export const getUserById = async (req, res) => {
  const { id } = req.params
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  res.json(result.rows[0])
}

export const createUser = async (req, res) => {
  const { name, email, password } = req.body
  const result = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
    [name, email, password]
  )
  res.status(201).json(result.rows[0])
}

export const updateUser = async (req, res) => {
  const { id } = req.params
  const { name, email } = req.body
  const result = await pool.query(
    'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
    [name, email, id]
  )
  res.json(result.rows[0])
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  await pool.query('DELETE FROM users WHERE id = $1', [id])
  res.json({ message: 'Usuario eliminado' })
}
