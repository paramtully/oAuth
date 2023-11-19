
export default class InvalidCredentialError extends Error {
    constructor() {
        super();
        this.message = "Invalid login credentials";
    }
};