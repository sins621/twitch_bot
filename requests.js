import http from "http";
import https from "https";

const SPOTIFY_ENDPOINT = "https://www.sins621.com/api/spotify";
const LOCAL_AI_ENDPOINT = "http://localhost:2222/api/ai/chat";

class Requests {
  async ai_rephrase(query) {
    return query;
  }

  async song_request(query) {
    console.log(query);
    const req = await this.async_https_request(
      `${SPOTIFY_ENDPOINT}/search?q=${query}`,
    );
    return await this.ai_rephrase(
      `Added ${req.song_name} by ${req.artists}, to the Queue.`,
    );
  }

  async now_playing() {
    const req = await this.async_https_request(`${SPOTIFY_ENDPOINT}/playing`);
    const song_name = req.song_name;
    const artists = req.artists;
    console.log(song_name + artists);
    return await this.ai_rephrase(`Now playing ${song_name} by ${artists}.`);
  }

  async skip_song() {
    await this.async_https_request(`${SPOTIFY_ENDPOINT}/skip`);
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
