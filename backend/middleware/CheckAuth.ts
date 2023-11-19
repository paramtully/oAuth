import jwt, {JwtPayload, Secret, VerifyErrors} from "jsonwebtoken";
require("dotenv").config();

export default function checkAuth(req: any, res: any, next: any) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, process.env.JWT_PUBLIC_KEY as Secret, (err: VerifyErrors | null, decoded: any) => {
        console.log(err?.message);
        if (err) return res.sendStatus(401);
        if (decoded) req.body.email = decoded["email"];
        next();
    });
}