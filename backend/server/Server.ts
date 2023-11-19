import express, {Express, urlencoded} from "express"
import helmet from "helmet";
import checkAuth from "../middleware/CheckAuth";
import cors from "cors";
import * as path from "path";

const allowedOrigins = ["http://localhost:5173", "http://localhost:8000", "http://localhost:3000"];

const app: Express = express();
const PORT: Number = Number(process.env.BACKEND_BASE_URL) || 3000;
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: [...allowedOrigins, "'self'"]
        }
    }
}));
app.use(urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({
    origin: function(origin, callback){
        // allow requests with no origin
        // (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/generalData", (req, res) => {
    res.status(200).json({ generalData: 'Welcome to your home page!'});
});

app.get("/api/userData", checkAuth, (req, res) => {
    res.status(200).json({ userData: `your email is ${req.body.email}`});
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))





