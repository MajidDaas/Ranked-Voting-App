const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// File paths
const votesFile = path.join(__dirname, "votes.json");
const linksFile = path.join(__dirname, "links.json");
const candidatesFile = path.join(__dirname, "candidates.json");

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "supersecret";

// Helpers
function readJSON(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// GET candidates
app.get("/api/candidates", (req, res) => {
  res.json(readJSON(candidatesFile));
});

// POST vote with single-use link
app.post("/api/vote", (req, res) => {
  const { ballot, linkID } = req.body;

  if (!linkID) return res.status(400).json({ error: "Missing voting link" });

  const links = readJSON(linksFile);
  const link = links.find(l => l.id === linkID);

  if (!link) return res.status(403).json({ error: "Invalid link" });
  if (link.used) return res.status(403).json({ error: "Link already used" });

  if (!Array.isArray(ballot) || ballot.length !== 14 || new Set(ballot).size !== ballot.length) {
    return res.status(400).json({ error: "Invalid ballot" });
  }

  // Save vote
  const votes = fs.existsSync(votesFile) ? readJSON(votesFile) : [];
  votes.push({ ballot, timestamp: Date.now() });
  writeJSON(votesFile, votes);

  // Mark link as used
  link.used = true;
  writeJSON(linksFile, links);

  res.json({ message: "Vote recorded successfully" });
});

// Admin: get raw votes
app.get("/api/raw-votes", (req, res) => {
  if (req.query.admin !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });
  res.json(fs.existsSync(votesFile) ? readJSON(votesFile) : []);
});

// Admin: get results (ranked-choice, 14 winners)
app.get("/api/results", (req, res) => {
  if (req.query.admin !== ADMIN_PASSWORD) return res.status(403).json({ error: "Unauthorized" });
  const candidates = readJSON(candidatesFile);
  const votes = fs.existsSync(votesFile) ? readJSON(votesFile) : [];
  let elected = [];
  let eliminated = [];

  function countFirstChoices() {
    const tally = {};
    candidates.forEach(c => { if (!eliminated.includes(c) && !elected.includes(c)) tally[c] = 0; });
    votes.forEach(v => {
      for (const choice of v.ballot) {
        if (!eliminated.includes(choice) && !elected.includes(choice)) {
          tally[choice]++;
          break;
        }
      }
    });
    return tally;
  }

  while (elected.length < 14 && elected.length + eliminated.length < candidates.length) {
    const tally = countFirstChoices();
    const entries = Object.entries(tally);
    if (!entries.length) break;
    const [topCandidate] = entries.reduce((a,b)=>a[1]>b[1]?a:b);
    const [bottomCandidate] = entries.reduce((a,b)=>a[1]<b[1]?a:b);
    elected.push(topCandidate);
    eliminated.push(bottomCandidate);
  }

  res.json({ winners: elected.slice(0,14) });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

