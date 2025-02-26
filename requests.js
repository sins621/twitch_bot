import http from "http";
import https from "https";

const SPOTIFY_ENDPOINT = "https://www.sins621.com/ai/spotify";
const LOCAL_AI_ENDPOINT = "http://localhost:2222/api/ai/chat";

class Requests {
  async ai_rephrase(query) {
    let prompt = `Rephrase the following text in around 10 words or less as if it were said by a highly advanced AI who has a dry, sarcastic wit who delivers cutting remarks with a detached robotic tone. Do not include Double Quotes. Phrase:`;
    let url = `${LOCAL_AI_ENDPOINT}?question=${prompt}:${query}"`;

    return new Promise(function (resolve, reject) {
      http
        .request(url, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (typeof data === "string") {
              let no_quotes = data;
              if (no_quotes[0] === '"') {
                no_quotes = no_quotes.replace(no_quotes.charAt(0), "");
              }
              if (no_quotes[no_quotes.length - 1] === '"') {
                no_quotes = no_quotes.replace(/.$/, "");
              }
              console.log(data);
              resolve(no_quotes);
            }
            resolve(data);
          });
        })
        .on("error", (err) => {
          reject(err);
        })
        .end();
    });
  }

  async song_request(query) {
    console.log(query);
    const req = await this.async_https_request(
      `${SPOTIFY_ENDPOINT}api/spotify/search?q=${query}`,
    );
    return await this.ai_rephrase(
      `Added ${req.song_name} by ${req.artists}, to the Queue.`,
    );
  }

  async now_playing() {
    const req = await this.async_https_request(
      `${SPOTIFY_ENDPOINT}api/spotify/now_playing`,
    );
    const song_name = req.song_name;
    const artists = req.artists;
    console.log(song_name + artists);
    return await this.ai_rephrase(`Now playing ${song_name} by ${artists}.`);
  }

  async skip_song() {
    await this.async_https_request(`${SPOTIFY_ENDPOINT}api/spotify/skip_song`);
    return await this.ai_rephrase(`Skipped song. ${await this.now_playing()}`);
  }

  async_https_request(url) {
    return new Promise(function (resolve, reject) {
      https
        .request(url, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(JSON.parse(data));
          });
        })
        .on("error", (err) => {
          reject(err);
        })
        .end();
    });
  }
}

export default Requests;
