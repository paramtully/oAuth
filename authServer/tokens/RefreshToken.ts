import jwt from "jsonwebtoken";
import JsonWebToken from "./JsonWebToken";

// handles creation and validation of refresh tokens
export default class RefreshToken extends JsonWebToken {
    private duration: string = '60s';

    public create(email: string, privilege: string): string {
        return super.create(email, privilege, this.duration);
    }
}