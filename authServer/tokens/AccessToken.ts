import JsonWebToken from "./JsonWebToken";

// handles creation and validation of access token
export default class AccessToken extends JsonWebToken {
    private duration: string = '10s';

    public create(email: string, privilege: string): string {
        return super.create(email, privilege, this.duration);
    }

}