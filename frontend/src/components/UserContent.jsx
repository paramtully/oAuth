import auth from "../api/auth.js";
import {useEffect, useState} from "react";
import backend from "../api/backend.js";
import {render} from "react-dom";

function GeneralData() {
    const [generalData, setGeneralData] = useState('');

    useEffect(() => {
        const uri = "/api/generalData";

        backend.get(uri)
            .then((res) => {
                setGeneralData(res.data["generalData"]);
            }).catch((e) => {
                console.log(`failed to get general data:\n  ${e.message}`);
            });
    }, []);

    return <h3>{generalData}</h3>;
}

function UserData({ cookies, setCookie, setAccessToken }) {
    const [userData, setUserData] = useState('');

    useEffect(() => {

        function refresh() {
            const uri = "/auth/refresh";
            return auth.post(uri, { refreshToken: cookies.refreshToken })
                .then((res) => {
                    setCookie("accessToken", res.data["accessToken"]);
                    setCookie("refreshToken", res.data["refreshToken"]);
                }).catch(() => {
                    setCookie("accessToken", null);
                    setCookie("refreshToken", null);
                }).finally(() => {
                    setAccessToken(cookies.accessToken);
                })
        }
        const uri = "/api/userData";
        const config = {
            headers: {Authorization: `Bearer ${cookies.accessToken}`}
        }

        backend.get(uri, config)
            .then((res) => {
                setUserData(res.data.userData);
            }).catch((e) => {
                if (e.response.status === 401) {
                    return refresh();
                }
            });
    }, [cookies.refreshToken]);

    return <div>{userData}</div>;
}

function Logout({ cookies, setCookie, setAccessToken }) {
    function handleLogout() {
        const uri = "/auth/logout";
        return auth.delete(uri, { data: { refreshToken: cookies.refreshToken }})
            .then((res) => {
                // do nothing
            }).catch((e) => {
                // do nothing
            }).finally(() => {
                setCookie("accessToken", null);
                setCookie("refreshToken", null);
                setAccessToken(null);
            });
    }

    return <button onClick={handleLogout} >Log Out</button>;

}

export default function UserContent({ cookies, setCookie, setAccessToken }) {

    return (
        <div>
            <GeneralData />
            <UserData cookies={cookies} setCookie={setCookie} setAccessToken={setAccessToken} />
            <Logout cookies={cookies} setCookie={setCookie} setAccessToken={setAccessToken} />
        </div>
    );
}