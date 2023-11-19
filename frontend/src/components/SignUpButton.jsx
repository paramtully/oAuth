import React from "react";

export default function SignUpButton({ isSigningUp, setIsSigningUp }) {
    return (
        <button onClick={() => setIsSigningUp(!isSigningUp)}>{isSigningUp ? "Log In" : "Sign Up"}</button>
    );
}