import bodyParser from "body-parser";
import express = require('express');
import systemConfig from "./config/system.config";

const cors = require('cors');

const app =express();

app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));
// 解决跨域问题
app.use(cors());

app.get('/', (req, res) => {
  console.log('Received request from `/`');
  res.send('OK!');
});

app.listen(systemConfig.port, () => {
  console.log(`the server is start at port ${systemConfig.port}`);
});

export default app;