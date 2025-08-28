const form = document.getElementById("votingForm");
const container = document.getElementById("rankingContainer");
const numRanks = 14;
const API_URL = "https://ranked-voting-app.onrender.com"; // backend URL

let candidates = [];

// Read single-use link from URL
const urlParams = new URLSearchParams(window.location.search);
const linkID = urlParams.get("link");
if (!linkID) {
  alert("No voting link provided.");
  document.body.innerHTML = "<h2>Invalid voting link</h2>";
}

// Load candidates from backend
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

  updateDropdowns();
}

function updateDropdowns() {
  const selected = new Set();
  for (let i = 1; i <= numRanks; i++) {
    const val = document.getElementById(`rank${i}`).value;
    if (val) selected.add(val);
  }

  for (let i = 1; i <= numRanks; i++) {
    const select = document.getElementById(`rank${i}`);
    const currentVal = select.value;
    select.innerHTML = `<option value="">--Select Candidate--</option>`;
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

form.addEventListener("change", updateDropdowns);

form.addEventListener("submit", async e => {
  e.preventDefault();
  const ballot = [];
  for (let i = 1; i <= numRanks; i++) ballot.push(document.getElementById(`rank${i}`).value);

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
