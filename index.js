// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`);
import express from "express";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
  const token = req.body.credential;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userid = payload["sub"];
    const email = payload["email"];

    // Здесь можно сохранить пользователя в БД
    res.json({ success: true, email, userid });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Server running on port " + (process.env.PORT || 3000));
});

