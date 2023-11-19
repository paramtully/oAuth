import jwt from "jsonwebtoken";
import DataEntry from "./resources/DataEntry";

// database interface for storing user credentials
// the database is not responsible for formatting data (ex encrypting & decrypting password)
export default interface DB {
    addUser(dataEntry: DataEntry): void;
    deleteUser(email: string): void;
    updateUser(dataEntry: DataEntry): void;
    getUser(email: string): DataEntry;
    resetDB(): void;

}