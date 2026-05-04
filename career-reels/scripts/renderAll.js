const { execSync } = require("child_process");
const path = require("path");

const reels = [1, 2, 3, 4, 5, 6];

console.log("Starting batch render for all 6 reels...\n");

reels.forEach((id) => {
  const outPath = path.join(__dirname, "..", "output", `reel-${id}.mp4`);
  const cmd = `npx remotion render src/index.jsx Reel-${id} ${outPath}`;
  console.log(`Rendering Reel ${id}/6...`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`Reel ${id} done → output/reel-${id}.mp4\n`);
  } catch (err) {
    console.error(`Reel ${id} failed:`, err.message);
  }
});

console.log("All reels rendered. Check the /output folder.");
