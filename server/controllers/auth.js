const { connect } = require("getstream");
const bcrypt = require("bcrypt");
const StreamChat = require("stream-chat").StreamChat;
const crypto = require("crypto");

require("dotenv").config();

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;
const app_id = process.env.STREAM_APP_ID;

const signup = async (req, res) => {
  try {
    // getting data from the frontend
    const { fullName, username, password, phoneNumber } = req.body;
    // Creating a random and unique user ID
    const userId = crypto.randomBytes(16).toString("hex");
    // making connection to the Stream
    const serverClient = connect(api_key, api_secret, app_id);
    // creating a hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    // creating a user token
    const token = serverClient.createUserToken(userId);
    // return the data to the front end
    res
      .status(200)
      .json({ token, fullName, username, userId, hashedPassword, phoneNumber });
  } catch (error) {
    console.log(error);
    res.send(500).json({ message: error });
  }
};

const login = async (req, res) => {
  try {
    // getting data from the front end
    const { username, password } = req.body;
    // making connection to the Stream
    const serverClient = connect(api_key, api_secret, app_id);
    // making an instance of the Stream chat to query all the users and match
    const client = StreamChat.getInstance(api_key, api_secret);
    // quering all the users and finding the target user
    const { users } = await client.queryUsers({ name: username });
    // if no user is found
    if (!users.length)
      return res.status(400).json({ message: "User not found" });
    // if user exists, checking the password
    const success = await bcrypt.compare(password, users[0].hashedPassword);
    // creating a new token for the user
    const token = serverClient.createUserToken(users[0].id);
    // if user exists, sending back all the data to the front end
    if (success) {
      res.status(200).json({
        token,
        fullName: users[0].fullName,
        username,
        userId: users[0].id,
      });
    } else {
      res.status(500).json({ message: "Incorrect Password" });
    }
  } catch (error) {
    console.log(error);
    res.send(500).json({ message: error });
  }
};

module.exports = { login, signup };
