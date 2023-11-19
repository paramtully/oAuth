import {useState} from "react";
import auth from "../api/auth.js";
import SignUpButton from "./SignUpButton.jsx";

function Login({onLogin, isLoading, children}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        setEmail("");
        setPassword("");
        onLogin(email, password);
    }

    return (
        <form onSubmit={handleSubmit}>
            {children}
            <input type="text" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="text" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="submit" value="Submit" disabled={!email.length || !password.length || isLoading }/>
        </form>
    );
}

export default function Auth({ cookies, setCookie, setAccessToken }) {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    function handleAuth(email, password, uri) {
        setIsLoading(true);
        return auth.post(uri, {
            email: email,
            password: password
        }).then((res) => {
            // console.log(res.data);
            const cookieOptions = {
                secure: true,
                // httpOnly: true
            }
            setCookie("accessToken", res.data["accessToken"], cookieOptions);
            setCookie("refreshToken", res.data["refreshToken"], cookieOptions);
            setAccessToken(cookies.accessToken);
        }).catch((e) => {
            // console.log(e);
            setError(e.message);
        }).finally(() => {
            setIsLoading(false);
        });
    }

    function handleLogin(email, password) {
        const uri = "/auth/login";
        return handleAuth(email, password, uri);
    }

    function handleSignUp(email, password) {
        const uri = "/auth/signUp";
        return handleAuth(email, password, uri);
    }

    return (
        <div>
            <SignUpButton isSigningUp={isSigningUp} setIsSigningUp={setIsSigningUp} />
            {   isSigningUp ? <Login onLogin={handleSignUp} children={<label>Sign Up </label>}/> :
                <Login onLogin={handleLogin} isLoading={isLoading} children={<label>Log In </label>}/>
            }
            <h4>{error}</h4>
        </div>
    );
}