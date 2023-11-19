import Hmac from "../security/Hmac";
import {expect} from "chai";

describe("testing hmac implementation of hash", () => {
    const hash: Hmac = new Hmac();
    const password: string = "password123";
    const salt: string = "flsdjFLskd";
    const hashed: string = "flsdjFLskd$1noJniOaNKmlZeV3nPOjIkhMgKDR2uhnz22FXajAtIA=";

    describe("test hash method", () => {

        it("should output a unique hash when the same password is used without specifying a salt", () => {
            expect(hash.hash(password)).to.not.eq(hash.hash(password));
        });

        it("should output the same hash when the same password is used with the same salt", () => {
            const password: string = "password123";
            expect(hash.hash(password, salt)).to.equal(hash.hash(password, salt));
        });
    });

    describe("testing getHash method", () => {

        it("should get the correct salt from a hashed password", () => {
            expect(hash.getSalt(hashed)).to.eq(salt);
        });

        it("should return an empty string when no salt is present", () => {
            const hashedNoSalt: string = "$sldkfjalsdkjf";
            expect(hash.getSalt(hashedNoSalt)).to.eq("");
        });

        it("will return original string if no delimiter is found", () => {
            // this is a bug: want it to return "" because no salt is present
            const hashedNoDelim: string = "sldkfjalsdkjf";
            expect(hash.getSalt(hashedNoDelim)).to.eq(hashedNoDelim);
        });
    });

    describe("testing isMatch method", () => {

        it("should match when given the same password used to make the hash", () => {
            expect(hash.isMatch(password, hashed)).to.be.true;
        });

        it("should not match when given password is different than the one used to make the hash", () => {
            const diffPassword: string = "notPassword234";
            expect(hash.isMatch(diffPassword, salt)).to.be.false;
        });

    });
});