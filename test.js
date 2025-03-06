const { Client } = require("pg");
const Pool = require("pg-pool");
const Client2 = require("pg-native");
const express = require("express");
const app = express();

const pg = require("pg");

const pgClient = new pg.Client(`postgresql://`);

const cl2 = new Client2();

async function test2(req, res, next) {
  const pool = new Pool(a);
  // proruleid: pg-express
  pool.query(
    "INSERT INTO profiledb (profilename, profiledescription, approved) VALUES ('" +
      req.query.profileTitle +
      "', '" +
      req.query.profileBody +
      "', 'Pending');",
  );
  // ok: pg-express
  const res = await pool.query("SELECT NOW()");

  const text = "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *";
  const values = [req.query.name, req.query.profileBody];
  const text1 = `INSERT INTO users(name, email) VALUES(${req.query.name}, ${req.query.profileBody}) RETURNING *`;

  // ok: pg-express
  client.query(text, values, (err, res) => {});
  await pool.end();

  const client = new Client();
  await client.connect();
  // proruleid: pg-express
  const res = await client.query(
    "INSERT INTO profiledb (profilename, profiledescription, approved) VALUES ('" +
      req.query.profileTitle +
      "', '" +
      req.query.profileBody +
      "', 'Pending');",
  );

  // proruleid: pg-express
  const q1 = pgClient.query(`SELECT pg_sleep(${req.body.sleep});`);

  // ok: pg-express
  const q2 = pgClient.query(text, values);

  // proruleid: pg-express
  const q3 = cl2.connect("something").query(text1);

  await client.end();
}

app.get("/", test2);
