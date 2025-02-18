import http from "http";
//import { GoogleGenerativeAI } from "@google/generative-ai";

const my_api_addr = "http://localhost:3000/";
const ai_api_addr = "http://localhost:2222/api/ai/chat";
const open_ai_token = process.env.open_ai_token;

//const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
//const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//
//const prompt = "Explain how AI works";
//
//const result = await model.generateContent(prompt);
//console.log(result.response.text());
//
//completion.then((result) => console.log(result.choices[0].message));

class Requests {
  async ai_rephrase(query) {
    let prompt = `You are a highly advanced AI who controls many systems and sometimes needs to respond to the questions of your users. You are Sarcastic, witty and often respond with a dry, detached and robotic tone. You respond in 10-20 words or less. You will recieve information and will then need to relay it to your users in a way that only you could say.Information:`;
    let url = `${ai_api_addr}?question=${prompt}:${query}"`;

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
  }

  async song_request(query) {
    console.log(query);
    const req = await this.async_http_request(
      `${my_api_addr}api/spotify/search?q=${query}`,
    );
    return await this.ai_rephrase(
      `Added ${req.song_name} by ${req.artists}, to the Queue.`,
    );
  }

  async now_playing() {
    const req = await this.async_http_request(
      `${my_api_addr}api/spotify/now_playing`,
    );
    const song_name = req.song_name;
    //const song_link = req.song_link;
    //const playlist_link = req.playlist_link;
    const artists = req.artists;
    console.log(song_name + artists);
    return await this.ai_rephrase(`Now playing ${song_name} by ${artists}.`);
  }

  async skip_song() {
    await this.async_http_request(`${my_api_addr}api/spotify/skip_song`);
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
