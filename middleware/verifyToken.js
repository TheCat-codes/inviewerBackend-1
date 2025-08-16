import jwt, {} from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, 'jhjhjhjhjhkhyjfbtuftfty', (err, decoded) => {
        if (err)
            return res.status(403).json({ message: 'Failed to authenticate token' });
        req.user = decoded;
        next();
    });
};
//# sourceMappingURL=verifyToken.js.map