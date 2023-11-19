import {expect} from "chai";
import JsonWebToken from "../tokens/JsonWebToken";
import {JwtPayload} from "jsonwebtoken";

describe("Testing token functionality", function() {
    describe("Testing creation of tokens", function() {
        const jwt: JsonWebToken = new JsonWebToken();
        const email: string = "johndoe@example.com";
        const privilege: string  = "admin";
        const duration: string = "1h";
        let token: string;

        it("should successfully create a jwt token", function() {
            try {
                token = jwt.create(email, privilege, duration);
            } catch(e: any) {
                expect.fail("token failed to be created.\n" + e);
            }
        });

        it("should create a valid token", function() {
            try {
                token = jwt.create(email, privilege, duration);
                jwt.validate(token);
            } catch (e) {
                expect.fail("token was expected to be valid.\n" + e);
            }
        });

        it("should create a token with the expected payload", function() {
            try {
                token = jwt.create(email, privilege, duration);
                const payload: JwtPayload = jwt.getPayload(token);
                console.log(payload);

                expect(payload).to.not.be.null;
                expect(payload.email).to.eq(email);
                expect(payload.privilege).to.eq(privilege);
                expect(payload.duration).to.eq(duration);
                expect(payload.publicKey).to.eq(process.env.JWT_PUBLIC_KEY);

                expect(payload.exp).to.not.be.undefined;
                expect(payload.iat).to.not.be.undefined;

                if (payload.exp !== undefined && payload.iat !== undefined) {
                    expect(payload.exp - payload.iat).to.eq(3600);
                }

            } catch (e) {
                expect.fail("token was expected to be valid.\n" + e);
            }
        });

        it("should produce different tokens when created at different times",(done) => {
            const duration: string = "20s";
            token = jwt.create(email, privilege, duration);

            setTimeout(() => {
                const issuedLaterToken: string = jwt.create(email, privilege, duration);
                expect(issuedLaterToken).to.not.equal(token);
                done();
            }, 1500);
        });

        it("should catch an expired token", function() {
            try {
                token = jwt.create(email, privilege, '-1h');
                jwt.validate(token);
                expect.fail('expected expired token to be invalid');
            } catch (e: any) {
                // pass case
            }
        });
    });
});