import chaiHttp from "chai-http";
import chai, {expect} from "chai";
import testUserLogIns from "./resources/ServerUtil";
import AuthController from "../controller/AuthController";
import {Express} from "express";
import * as fs from "fs-extra";
import JsonWebToken from "../tokens/JsonWebToken";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.use(chaiHttp);
chai.should();

// Note: checking returned tokens may fail if run at different seconds due to iat mismatch
// - also tests are co-dependent --> users signed up in testing signup are necessary for testing login
describe("testing the auth server", async() => {
    const privilege: string = "user";
    const DB_FILE_NAME: string = "test.json";
    const app: Express = AuthController.createExpressApp(DB_FILE_NAME);
    const password: string = "dlfaJsdl123";

    after(() => {
        fs.removeSync("./persist/" + DB_FILE_NAME);
    });

    describe("testing sign up", () => {
        it("should sign up a single user with valid credentials",async() => {
            const email: string = "valid.user@gmail.com";

            return chai.request(app)
                .post("/auth/signUp")
                .send({
                    email: email,
                    password: password
                }).then((res) => {
                    expect(res).to.have.status(201);
                    expect(res.body).to.not.deep.equal({});
                    expect(res.body.refreshToken).to.equal(AuthController.rt.create(email, privilege));
                    expect(res.body.accessToken).to.equal(AuthController.at.create(email, privilege));
            });
        });

        it("should sign up multiple users with valid credentials", async() => {
            const requester = chai.request(app).keepOpen();

            // makes sign up requests for all test users then closes the api
            return Promise.all(
                testUserLogIns.map(async (lc) => {
                    return requester
                        .post("/auth/signUp")
                        .send(lc);
                })
            ).then((responses) => {
                responses.forEach((res, i) => {
                    expect(res).to.have.status(201);
                    expect(res.body).to.not.deep.equal({});
                });
                requester.close();
            });
        });

        it("should not sign up a user that already exists", async() => {
            const expectedResponse: any = {};
            return chai.request(app)
                .post("/auth/signUp")
                .send(testUserLogIns[0])
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.eq(expectedResponse);
                });
        });

        it("should not sign up a user without a gmail account",  async() => {
            const expectedResponse: any = {};
            const invalidEmail: string = "invalid.gmail@yahoo.com";

            return chai.request(app)
                .post("/auth/signUp")
                .send({
                    email: invalidEmail,
                    password: password
                }).then((res) => {
                    expect(res).to.have.status(406);
                    expect(res.body).to.deep.equal(expectedResponse);
                });
        });

        it("should not sign up a user with an invalid gmail",  async() => {
            const expectedResponse: any = {};
            const invalidGmail: string = "@yahoo.com";

            return chai.request(app)
                .post("/auth/signUp")
                .send({
                    email: invalidGmail,
                    password: password
                }).then((res) => {
                    expect(res).to.have.status(406);
                    expect(res.body).to.deep.equal(expectedResponse);
                });
        });

        it("should not sign up a user with an empty password", async() => {
            const email: string = "valid.user2@gmail.com";
            const emptyPassword: string = "";
            const expectedResult: any = {};

            return chai.request(app)
                .post("/auth/signUp")
                .send({
                    email: email,
                    password: emptyPassword
                }).then((res) => {
                    expect(res).to.have.status(406);
                    expect(res.body).to.deep.equal(expectedResult);
            });
        });

        it("should not sign up a user with whitespaces as their password", async() => {
            const email: string = "valid.user3@gmail.com";
            const whitespacePass: string = "    ";
            const expectedResult: any = {};

            return chai.request(app)
                .post("/auth/signUp")
                .send({
                    email: email,
                    password: whitespacePass
                }).then((res) => {
                    expect(res).to.have.status(406);
                    expect(res.body).to.deep.equal(expectedResult);
            });
        });
    });

    describe("testing login", () => {
        it("should log in a user that has been signed up when given correct creds", async() => {
            return chai.request(app)
                .post("/auth/login")
                .send(testUserLogIns[0]).then((res) => {
                    expect(res).to.have.status(202);
                    expect(res.body).to.not.deep.equal({});
                    expect(res.body.accessToken).to.not.be.null;
                    expect(res.body.refreshToken).to.not.be.null;
            });
        });

        it("should not log in a user that has not been signed up", async() => {
            const email: string = "not.signed.up@gmail.com";
            const password: string = "sjflsdja";

            return chai.request(app)
                .post("/auth/login")
                .send({
                    email: email,
                    password: password
                }).then((res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.error).to.not.be.null;
            });
        });

        it("should not log in a user when an incorrect password is given", async() => {
            return chai.request(app)
                .post("/auth/login")
                .send({
                    email: testUserLogIns[0].email,
                    password: "dslfjTsdk"
                }).then((res) => {
                expect(res).to.have.status(401);
                expect(res.body.error).to.not.be.null;
            });
        })

        it("should support case sensitive passwords", async() => {
            return chai.request(app)
                .post("/auth/login")
                .send({
                    email: testUserLogIns[0].email,
                    password: testUserLogIns[0].password.toLowerCase()
                }).then((res) => {
                expect(res).to.have.status(401);
                expect(res.body.error).to.not.be.null;
                });
        });
    });

    describe("testing refresh", () => {
        it("should refresh a valid refresh token for a valid user", async() => {
            return chai.request(app)
                .post("/auth/login")
                .send(testUserLogIns[0])
                .then((res) => {
                    expect(res).to.have.status(202);
                    return chai.request(app).post(`/auth/refresh/`).send({refreshToken: res.body.refreshToken});
                }).then((res) => {
                    expect(res).to.have.status(202);
                    expect(res.body.refreshToken).to.not.be.null;
                    expect(res.body.accessToken).to.not.be.null;
                });
        });

        it("should not refresh an expired refresh token", async() => {
            const refreshToken: string = new JsonWebToken().create(testUserLogIns[0].email, privilege, "-1s");
            return chai.request(app)
                .post(`/auth/refresh/`)
                .send({refreshToken: refreshToken})
                .then((res) => {
                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({});
                });
        });

        it("should not refresh a deprecated refresh token", async() => {
            const refreshToken: string = new JsonWebToken().create(testUserLogIns[1].email, privilege, "1h");
            return chai.request(app)
                .post(`/auth/refresh/`)
                .send({refreshToken: refreshToken})
                .then((res) => {
                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({});
                });
        });

        it("should not refresh a valid refresh token for an invalid user", async() => {
            const invalidUser: string = "non.existent.user@gmail.com";
            const refreshToken: string = AuthController.rt.create(invalidUser, "1h");
            return chai.request(app)
                .post(`/auth/refresh/`)
                .send({refreshToken: refreshToken})
                .then((res) => {
                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({});
                });
        });
    });
});