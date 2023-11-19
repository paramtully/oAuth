
import {useState} from 'react'
import './App.css'
import {CookiesProvider, useCookies} from "react-cookie";
import Home from "./components/Home.jsx";
import Auth from "./components/Login.jsx";
import UserContent from "./components/UserContent.jsx";

function App() {
    const [cookies, setCookie, removeCookie] = useCookies(["accessToken", "refreshToken"]);
    const [accessToken, setAccessToken] = useState(null);

    return (
        <CookiesProvider>
            <Home />
            {   accessToken || cookies.refreshToken ? <UserContent cookies={cookies} setCookie={setCookie} setAccessToken={setAccessToken} /> :
                <Auth cookies={cookies} setCookie={setCookie} setAccessToken={setAccessToken} />
            }
        </CookiesProvider>
    );
}

export default App;
