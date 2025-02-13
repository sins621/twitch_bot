import Requests from "./requests.js";

const requests = new Requests();

console.log(await requests.ai_request("Take the text 'Added 'the real slim shady' by eminem to the queue' and make it sound like a distopian robot"));
