import http from "http";

const hostname = "http://localhost:2000/";

class Requests {
  async now_playing() {
    const req = await this.async_http_request(`${hostname}spa/now_playing`);
    const song_name = req.song_name;
    const song_link = req.song_link;
    const playlist_link = req.playlist_link;
    const artists = req.artists;
    return `Now playing ${song_name} by ${artists}.`;
  }

  async skip_song() {
    await this.async_http_request(`${hostname}spa/skip_song`);
    return `Skipped song. ${await this.now_playing()}`;
  }

  async_http_request(url) {
    return new Promise(function (resolve, reject) {
      http
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
