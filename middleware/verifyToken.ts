import type { NextFunction, Request, Response } from "express"
import jwt, { type JwtPayload } from "jsonwebtoken"

export const verifyToken = (req:Request, res:Response, next:NextFunction) => {
  const token = req.cookies.access_token
  if(!token) return res.status(401).json({ message: 'Unauthorized' })

  jwt.verify(token, 'jhjhjhjhjhkhyjfbtuftfty', (err: jwt.VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
    if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
    (req as any).user = decoded
    next()
  })
}