import DataEntry from "../database/resources/DataEntry";
import AlreadyExistsError from "../database/errors/AlreadyExistsError";
import FileDB from "../database/FileDB";
import RefreshToken from "../tokens/RefreshToken";
import AccessToken from "../tokens/AccessToken";
import Hmac from "../security/Hmac";
import NotFoundError from "../database/errors/NotFoundError";
import TokenPayload from "../tokens/resources/TokenPayload";
import DeprecatedTokenError from "../database/errors/DeprecatedTokenError";
import {TokenExpiredError} from "jsonwebtoken";
import express, {Express, Router, urlencoded} from "express";
import InvalidCredentialError from "../database/errors/InvalidCredentialError";
import Hash from "../security/Hash";
import DB from "../database/DB";
import helmet from "helmet";
import cors from "cors";

export default class AuthController {
    static rt: RefreshToken = new RefreshToken();
    static at: AccessToken = new AccessToken();
    static hash: Hash = new Hmac();
    static gmailSuffix = "@gmail.com";
    static allowedOrigins = ["http://localhost:5173", "http://localhost:8000", "http://localhost:3000"];


    // Helper function that checks if email and password is valid
    static isValidCredentials(req: any): boolean {
        // Note: !!<call chain> returns false for null, undefined, 0, 000, "", false for the resulting value
        return (
            req.body.email?.trim().toLowerCase().includes(AuthController.gmailSuffix) &&
            req.body.email?.trim().length > AuthController.gmailSuffix.length &&
            req.body.password?.trim()
        );
    }

    static signUp(req: any, res: any) {
        try {
            const db: DB = req.db;
            // validate user credentials
            if (!AuthController.isValidCredentials(req)) throw new InvalidCredentialError();

            // attempt to add user
            const privilege: string = "user";
            const refreshToken: string = AuthController.rt.create(req.body.email, privilege);
            const entry: DataEntry = {
                email: req.body.email.trim().toLowerCase(),
                password: AuthController.hash.hash(req.body.password.trim()),
                privilege: privilege,
                refreshToken: refreshToken
            };
            db.addUser(entry);

            // generate and return tokens to user
            res.status(201).json({
                refreshToken: refreshToken,
                accessToken: AuthController.at.create(entry.email, privilege)
            });
        } catch (e: any) {
            if (e instanceof AlreadyExistsError) res.status(400).end();
            else if (e instanceof InvalidCredentialError) res.status(406).end();
            else res.status(500).json({error: e.message}).end();
        }
    }

    static login(req: any, res: any) {
        try {
            const db: DB = req.db;
            // login if refresh token is invalid and must be generated again
            const user: DataEntry = db.getUser(req.body.email);
            if (AuthController.hash.isMatch(req.body.password, user.password)) {
                const refreshToken: string = AuthController.rt.create(user.email, user.privilege);
                db.updateUser({...user, refreshToken: refreshToken});
                res.status(202).json({
                    refreshToken: refreshToken,
                    accessToken: AuthController.at.create(user.email, user.privilege)
                });
            }

            // case: login credentials are invalid
            else throw new InvalidCredentialError();
        } catch (e: any) {
            if (e instanceof NotFoundError) res.status(400).end();
            else if (e instanceof InvalidCredentialError) res.status(401).end();
            else res.status(500).json({error: e.message}).end();
        }
    }

    // same vulnerability as refresh with using url params to pass a token
    static logout(req: any, res: any) {
        const db: DB = req.db;
        let user: DataEntry | null = null;
        try {
            // get user
            const refreshToken = req.body["refreshToken"];
            const payload: TokenPayload = AuthController.rt.getPayload(refreshToken);
            user = db.getUser(payload.email);

            // expire user's active refresh token
            db.updateUser({...user, refreshToken: null});
            res.status(200).end();
        } catch (e: any) {
            // case user doesn't exist
            if (e instanceof NotFoundError) {
                res.status(400).end();
            }

            // case: other server error
            else res.status(500).json({error: e.message}).end();
        }
    }

    // takes in refresh token as url param but in actual application, a post request would be more secure
    static refresh(req: any, res: any) {
        const db: DB = req.db;
        let user: DataEntry | null = null;
        try {
            // validate token
            const refreshToken: string = req.body["refreshToken"];
            const payload: TokenPayload = AuthController.rt.getPayload(refreshToken);

            user = db.getUser(payload.email);
            if (!user?.refreshToken || user.refreshToken !== refreshToken) throw new DeprecatedTokenError();

            // case: user has a valid refresh token
            const updatedRefreshToken = AuthController.rt.create(user.email, user.privilege);
            db.updateUser({...user, refreshToken: updatedRefreshToken});
            res.status(202).json({
                refreshToken: updatedRefreshToken,
                accessToken: AuthController.at.create(user.email, user.privilege)
            });
        } catch (e: any) {
            // case: user has expired refresh token & must log in again
            if (e instanceof TokenExpiredError) res.status(401).end();

            // case: potential attacker provided deprecated refresh token
            else if (e instanceof DeprecatedTokenError) {
                if (user) db.updateUser({...user, refreshToken: null});
                res.status(409).end();
            }

            // case user doesn't exist
            else if (e instanceof NotFoundError) {
                res.status(400).end();
            }

            // case: other server error
            else res.status(500).json({error: e.message}).end();
        }
    }

    // wrapped middleware function to init DB in express context
    static initDB(filename: string | null) {
        return function (req: any, res: any, next: any) {
            if (filename) req.db = new FileDB(filename);
            else req.db = new FileDB();
            next();
        }
    }

    static getRoutes(): Router {
        const routes: Router = Router();
        routes.post("/signUp", AuthController.signUp);
        routes.post("/login", AuthController.login);
        routes.post("/refresh", AuthController.refresh);
        routes.delete("/logout", AuthController.logout);
        return routes;
    }

    static createExpressApp(filename: string | null = null): Express {

        const app: Express = express();
        // app.use(helmet());
        app.use(express.json());
        app.use(urlencoded({extended: false}));
        app.use(cors({
            origin: function(origin, callback){
                // allow requests with no origin
                // (like mobile apps or curl requests)
                if(!origin) return callback(null, true);
                if(AuthController.allowedOrigins.indexOf(origin) === -1){
                    var msg = 'The CORS policy for this site does not ' +
                        'allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            }
        }));
        app.use(AuthController.initDB(filename));
        app.use("/auth", AuthController.getRoutes());
        return app;
    }
}