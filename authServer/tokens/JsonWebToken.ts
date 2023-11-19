import jwt, {Secret, SignOptions} from 'jsonwebtoken';
import TokenPayload from "./resources/TokenPayload";
require('dotenv').config();

// handles creation and validation of jwt
export default class JsonWebToken {

    // creates a jsw with a RS256 signature
    public create(email: string, privilege: string, duration: string): string {
        const options: SignOptions = {
            algorithm: 'RS256',
            expiresIn: duration,
        }

        const payload: TokenPayload = {
            email: email,
            duration: duration,
            privilege: privilege,
            publicKey: process.env.JWT_PUBLIC_KEY
        }

        return jwt.sign(payload, process.env.JWT_PRIVATE_KEY as Secret, options);
    }

    // validates a jsw token signed with RS256
    // caller must handle thrown error in the case the jwt is invalid
    public validate(token: string): void {
        const options: SignOptions = {
            algorithm: 'RS256'
        }
        jwt.verify(token, process.env.JWT_PUBLIC_KEY as Secret, options);
    }

    public getPayload(token: string): TokenPayload {
        const options: SignOptions = {
            algorithm: 'RS256'
        }
        return jwt.verify(token, process.env.JWT_PUBLIC_KEY as Secret, options) as TokenPayload;
    }

}