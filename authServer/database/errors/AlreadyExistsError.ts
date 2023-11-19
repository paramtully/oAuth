
export default class AlreadyExistsError extends Error {
    constructor() {
        super();
        this.message = "User already exists";
    }
}