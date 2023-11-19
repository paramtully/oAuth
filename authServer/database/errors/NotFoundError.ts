
export default class NotFoundError extends Error {
    constructor() {
        super();
        this.message = "User does not exist";
    }
}