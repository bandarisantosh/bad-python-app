const express = require("express");
const app = express();

async function test2(req, res, next) {
  const input = req.query.input;

  // ok: eval-express
  eval("alert");

  // ruleid: eval-express
  eval(input);

  // ruleid: eval-express
  var x = new Function("a", "b", `return ${input}(a,b)`);

  // ruleid: eval-express
  var y = Function("a", "b", input);

  setTimeout(() => {
    // ok: eval-express
    console.log("Delayed for 1 second." + input);
  }, 1000);

  setTimeout(function () {
    // ok: eval-express
    console.log("Delayed for 1 second." + input);
  }, 1000);

  // ruleid: eval-express
  setTimeout("console.log(" + input + ")", 1000);
}

app.get("/", test2);
