// Flux(dev)로 브루탈리즘 편집톤 실사 이미지 생성 → public/img/
// 통일감: 전부 어두운 배경 + 고대비 + 시네마틱 그레인. HTML에서 CSS로 흑백/듀오톤 처리.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const TOKEN = (ENV.match(/REPLICATE_API_TOKEN=(.+)/) || [])[1]?.trim();
const OUT = path.join(ROOT, "public/img");
fs.mkdirSync(OUT, { recursive: true });

const STYLE =
  "dramatic single-source studio lighting, very high contrast, deep charcoal black background, " +
  "cinematic, subtle 35mm film grain, editorial art photography, sharp focus, minimal, no text, no logo";

async function flux(prompt, aspect = "4:3") {
  // create
  let r = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: aspect, output_format: "png", num_outputs: 1, guidance: 3, num_inference_steps: 30 },
      }),
    }
  );
  let j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  // poll if not done
  const geturl = j.urls?.get;
  while (j.status && !["succeeded", "failed", "canceled"].includes(j.status)) {
    await new Promise((s) => setTimeout(s, 1500));
    j = await (await fetch(geturl, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (j.status === "failed") throw new Error("prediction failed: " + JSON.stringify(j.error));
  return Array.isArray(j.output) ? j.output[0] : j.output;
}

async function dl(url, dest) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log("  ✓", path.basename(dest), (buf.length / 1024).toFixed(0) + "K");
}

const JOBS = [
  ["work-valhalla", "4:3",
   "a dramatic 3D fantasy warrior knight in ornate armor, dynamic heroic pose, glowing sword, cinematic game key art"],
  ["work-catch", "4:3",
   "a retro arcade machine joystick and glossy buttons, macro close-up, playful bold composition"],
  ["work-farm", "4:3",
   "fresh organic vegetables and fruit dramatically arranged, water droplets, luxurious food photography"],
  ["work-999", "4:3",
   "an abstract liquid chrome metal sphere, mercury-like reflective surface, macro, concept of purity and perfection"],
  ["about-studio", "3:2",
   "a designer's hands working on a tactile paper prototype and bold typography prints on a dark desk, craft, analog"],
];

console.log("REPLICATE flux-dev generating", JOBS.length, "images...");
for (const [name, aspect, prompt] of JOBS) {
  console.log("[gen]", name);
  const url = await flux(`${prompt}, ${STYLE}`, aspect);
  if (url) await dl(url, path.join(OUT, `${name}.png`));
}
console.log("=== DONE ===");
