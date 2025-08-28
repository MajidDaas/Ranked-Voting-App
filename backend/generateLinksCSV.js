const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const linksFile = path.join(__dirname, "links.json");
const csvFile = path.join(__dirname, "links.csv");

// How many links to generate
const NUM_LINKS = 50;

// Generate links
let links = [];
for (let i = 0; i < NUM_LINKS; i++) {
  links.push({ id: uuidv4(), used: false });
}

// Save to links.json
fs.writeFileSync(linksFile, JSON.stringify(links, null, 2));
console.log(`Generated ${NUM_LINKS} links in ${linksFile}`);

// Export to CSV
let csvContent = "linkID,used\n";
links.forEach(link => {
  csvContent += `${link.id},${link.used}\n`;
});

fs.writeFileSync(csvFile, csvContent);
console.log(`CSV file created at ${csvFile}`);

