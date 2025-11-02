import jwt from 'jsonwebtoken'

const JWT_SECRET = 'your_jwt_secret'

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'Token no enviado' })

  const token = authHeader.split(' ')[1]
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' })
    req.user = user
    next()
  })
}

export default verifyToken
