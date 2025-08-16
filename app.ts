import express from 'express'
import cors from 'cors'
import { router } from './routes/routes.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import path from 'path'

dotenv.config()
const app = express()

app.use(cors({
  origin: true,
  credentials: true
}))
app.use(express.json({
  limit: '50mb',
  type: (req) => !req.headers['content-type']?.startsWith('multipart/form-data')
}))
app.use(cookieParser())

app.use('/', router)

const PORT = 4000
app.listen(PORT, () => {
  console.log(`http://localhost:`+PORT)
})