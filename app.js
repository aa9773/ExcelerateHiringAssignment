const express = require("express");
const app = express();
const { testMagentoFlows } = require("./Assignment/MagentoFlows");

app.get("/", async (req, res) => {
  // nykaa();
  await testMagentoFlows();
  res.send("Hii");
});

app.listen(8000, () => {
  console.log("Server is listening on 8000");
});
