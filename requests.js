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
    let prompt = `Rephrase the following text in around 10 words or less as if it were said by a highly advanced AI who has a dry, sarcastic wit who delivers cutting remarks with a detached robotic tone. Do not include Double Quotes. Phrase:`;
    let url = `${ai_api_addr}?question=${prompt}:${query}"`;

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
