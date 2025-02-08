import "dotenv/config";
import SpotifyWebApi from "spotify-web-api-node";
import https from "https";

const credentials = {
  clientId: process.env.spotify_id,
  clientSecret: process.env.spotify_secret,
  redirectUri: "http://www.example.com/callback",
};

const scopes = ["user-read-private", "user-read-email"],
  redirectUri = "https://www.example.com/callback",
  clientId = process.env.spotify_id,
  state = "some-state-of-my-choice";

let spotifyApi = new SpotifyWebApi(credentials);
let authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
let code;
let access_token;

console.log(authorizeURL)
https.get(authorizeURL, (resp) => {
  let data = "";
  resp.on("data", (chunk) => {
    data += chunk;
  });

  resp.on("end", () => {});
  console.log(data);
});

//spotifyApi.authorizationCodeGrant(code).then(
//  function (data) {
//    access_token = data.body["access_token"];
//    spotifyApi.setAccessToken(data.body["access_token"]);
//    spotifyApi.setRefreshToken(data.body["refresh_token"]);
//  },
//  function (err) {
//    console.log("Something went wrong!", err);
//  },
//);
//
//spotifyApi.getArtistAlbums(
//  "43ZHCT0cAZBISjO8DG9PnE",
//  { limit: 10, offset: 20 },
//  function (err, data) {
//    if (err) {
//      console.error("Something went wrong!");
//    } else {
//      console.log(data.body);
//    }
//  },
//);
