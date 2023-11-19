
export default class TokenPayload {
    email: string;
    duration: string;
    privilege: string;
    publicKey: string | undefined; // normally would contain info to retrieve from a JWK (JSON Web Key) provider instead
}