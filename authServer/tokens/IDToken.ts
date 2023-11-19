
/*
- this jwt would contain a different payload than a refresh token/access token.
    -> specifically user info meant to be displayed on the client side.
- the target of the ID token is the client, the target of access tokens is the backend server, and the target
  of the refresh token is this auth server
 */

// this application doesn't need this user info so the id token is not created here