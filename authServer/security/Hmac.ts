import Hash from "./Hash";
import {createHmac, randomBytes, BinaryLike} from "crypto";
require("dotenv").config();

// hashes strings with the hmac algorithm.
// Includes extra security from salting and peppering the subject string.
// The hash is prepended to the output string
export default class Hmac implements Hash {

    // hashes string with given salt. creates a unique salt if none specified
    // returns the hashed subject and string, prepending the salt with '$' as a delimiter
    public hash(subject: string, salt: string = ''): string {
        if (salt === '') salt = randomBytes(16).toString("base64");
        const hashedSubject: string = createHmac("sha256", process.env.SECRET_KEY as BinaryLike)
            .update(salt + process.env.SECRET_PEPPER + subject)
            .digest("base64");
        return `${salt}$${hashedSubject}`;
    }

    // gets the salt from a hashed password
    public getSalt(hashed: string): string {
        return hashed.split("$")[0];
    }

    // returns if the given password matches a hashed password
    public isMatch(subject: string, hashed: string): boolean {
        const hash: string = this.getSalt(hashed);
        return this.hash(subject, hash) === hashed;
    }
}