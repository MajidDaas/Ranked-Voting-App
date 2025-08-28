const form = document.getElementById("votingForm");
const container = document.getElementById("rankingContainer");
const numRanks = 14;
const API_URL = "https://ranked-voting-app.onrender.com/"; // replace with your backend URL

let candidates = [];

// Read single-use link from URL
const urlParams = new URLSearchParams(window.location.search);
const linkID = urlParams.get("link");
if (!linkID) {
  alert("No voting link provided.");
  document.body.innerHTML = "<h2>Invalid voting link</h2>";
}

// Load candidates and create dropdowns
async function loadCandidates() {
  const res = await fetch(`${API_URL}/api/candidates`);
  candidates = await res.json();

  for (let i = 1; i <= numRanks; i++) {
    const div = document.createElement("div");
    div.className = "rank-card";
    div.innerHTML = `
      <label for="rank${i}">Rank ${i}</label>
      <select id="rank${i}" required>
        <option value="">--Select Candidate--</option>
      </select>
    `;
    container.appendChild(div);
  }

  updateDropdowns(); // populate options initially
}

// Update all dropdowns to remove already selected candidates
function updateDropdowns() {
  const selected = new Set();
  for (let i = 1; i <= numRanks; i++) {
    const val = document.getElementById(`rank${i}`).value;
    if (val) selected.add(val);
  }

  for (let i = 1; i <= numRanks; i++) {
    const select = document.getElementById(`rank${i}`);
    const currentVal = select.value;

    // Clear all options except placeholder
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "--Select Candidate--";
    select.innerHTML = "";
    select.appendChild(placeholder);

    // Add candidates not selected elsewhere OR current value
    candidates.forEach(c => {
      if (!selected.has(c) || c === currentVal) {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === currentVal) opt.selected = true;
        select.appendChild(opt);
      }
    });
  }
}

// Listen for changes to update dropdowns dynamically
form.addEventListener("change", updateDropdowns);

// Submit vote
form.addEventListener("submit", async e => {
  e.preventDefault();
  const ballot = [];
  for (let i = 1; i <= numRanks; i++) {
    const val = document.getElementById(`rank${i}`).value;
    ballot.push(val);
  }

  if (ballot.includes("")) return alert("All 14 ranks must be selected!");
  if (new Set(ballot).size !== ballot.length) return alert("No duplicate candidates allowed!");

  const res = await fetch(`${API_URL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ballot, linkID })
  });

  const data = await res.json();
  alert(data.message || data.error);
});

loadCandidates();

const fs = require("fs");

app.get("/api/results", (req, res) => {
  const { admin } = req.query;
  if (admin !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  // Load votes
  let votes = [];
  if (fs.existsSync("votes.json")) {
    votes = JSON.parse(fs.readFileSync("votes.json", "utf-8"));
  }

  // Compute simple ranked-choice points
  const points = {}; // {candidateName: totalPoints}
  votes.forEach(ballot => {
    ballot.forEach((candidate, index) => {
      // Higher rank = more points
      points[candidate] = (points[candidate] || 0) + (votes[0].length - index);
    });
  });

  // Sort results
  const rankedResults = Object.keys(points)
    .map(name => ({ name, points: points[name] }))
    .sort((a, b) => b.points - a.points);

  res.json({ rawVotes: votes, rankedResults });
});

