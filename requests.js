import http from "http";

const my_api_addr = "http://localhost:2000/";
const ai_api_addr = "http://192.168.3.152:2222/";

class Requests {
  async ai_rephrase(query) {
    let prompt =
      "Rephrase the following text as if it was said by a delusional and malfuncitoning robot. It must be said from the first person in two sentances or less. Do not include quotes";
    let url = `${ai_api_addr}/?question=${prompt}:${query}"`;

    return new Promise(function (resolve, reject) {
      http
        .request(url, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            resolve(data);
          });
        })
        .on("error", (err) => {
          reject(err);
        })
        .end();
    });
    console.log(req);
  }

  async song_request(query) {
    console.log(query);
    const req = await this.async_http_request(
      `${my_api_addr}spa/search?q=${query}`,
    );
    return await this.ai_rephrase(
      `Added ${req.song_name} by ${req.artists}, to the Queue.`,
    );
  }

  async now_playing() {
    const req = await this.async_http_request(`${my_api_addr}spa/now_playing`);
    const song_name = req.song_name;
    //const song_link = req.song_link;
    //const playlist_link = req.playlist_link;
    const artists = req.artists;
    return await this.ai_rephrase(`Now playing ${song_name} by ${artists}.`);
  }

  async skip_song() {
    await this.async_http_request(`${my_api_addr}spa/skip_song`);
    return await this.ai_rephrase(`Skipped song. ${await this.now_playing()}`);
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
