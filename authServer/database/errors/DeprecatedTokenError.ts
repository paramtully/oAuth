
export default class DeprecatedTokenError extends Error {
    constructor() {
        super();
        this.message = "Token is no longer valid";
    }
}