import "dotenv/config";
import { getFirstActiveQRCode } from "./server/controllers/redemption.controller.js";

const req = {};
const res = {
  code: 200,
  status(code) {
    this.code = code;
    return this;
  },
  json(payload) {
    console.log("STATUS", this.code);
    console.log(JSON.stringify(payload, null, 2));
  },
};

await getFirstActiveQRCode(req, res);
