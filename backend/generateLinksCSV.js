const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Config
const FRONTEND_URL = "https://rankedvotingapp.netlify.app"; // <-- replace with your live frontend URL
const TOKEN_FILE = "links.json"; // no data folder
const CSV_FILE = "links.csv";
const NUM_TOKENS = 50; // number of tokens/links to generate

// Load existing tokens if the file exists
let existingTokens = [];
if (fs.existsSync(TOKEN_FILE)) {
  existingTokens = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
}

// Generate new tokens
const newTokens = [];
for (let i = 0; i < NUM_TOKENS; i++) {
  const token = {
    value: uuidv4(),
    used: false // mark as not used
  };
  newTokens.push(token);
}

// Save all tokens back to tokens.json
const allTokens = [...existingTokens, ...newTokens];
fs.writeFileSync(TOKEN_FILE, JSON.stringify(allTokens, null, 2));

// Convert tokens to full voting links
const links = newTokens.map(token => `${FRONTEND_URL}/?link=${token.value}`);

// Write CSV in root
fs.writeFileSync(CSV_FILE, links.join("\n"));

console.log(`✅ Generated ${NUM_TOKENS} single-use voting links!`);
console.log(`Saved CSV at: ${CSV_FILE}`);
console.log("Example link:", links[0]);
