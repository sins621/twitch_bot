import http from "http";

class Requests {
  request(url) {
    // TODO: Find out a better way to do this
    http
      .request(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        // Ending the response
        res.on("end", () => {
          var body = JSON.parse(data);
          return body;
        });
      })
      .on("error", (err) => {
        console.log("Error: ", err);
      })
      .end();
  }
}

const requests = new Requests();

let result = requests.request("http://localhost:2000/spa/now_playing");
console.log(result);

export default Requests;
