// 다이나믹 홈페이지용 비주얼 방향 샘플 3종 (flux-1.1-pro 고품질) → public/img/samples/
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(process.cwd());
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const TOKEN = (ENV.match(/REPLICATE_API_TOKEN=(.+)/) || [])[1]?.trim();
const OUT = path.join(ROOT, "public/img/samples");
fs.mkdirSync(OUT, { recursive: true });

async function flux(prompt, aspect = "16:9") {
  let r = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
    { method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: aspect, output_format: "png", safety_tolerance: 5, prompt_upsampling: true } }) }
  );
  let j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  const geturl = j.urls?.get;
  while (j.status && !["succeeded","failed","canceled"].includes(j.status)) {
    await new Promise(s=>setTimeout(s,1500));
    j = await (await fetch(geturl,{headers:{Authorization:`Bearer ${TOKEN}`}})).json();
  }
  if (j.status==="failed") throw new Error("failed "+JSON.stringify(j.error));
  return Array.isArray(j.output)?j.output[0]:j.output;
}
async function dl(url,dest){const b=Buffer.from(await(await fetch(url)).arrayBuffer());fs.writeFileSync(dest,b);console.log("  ✓",path.basename(dest),(b.length/1024).toFixed(0)+"K");}

const SAMPLES = [
  ["a1-chrome", "a flowing liquid chrome metal abstract sculpture, iridescent reflective surface, mercury-like, suspended in dark void, dramatic studio rim lighting, ultra high detail, cinematic 3D render, motion frozen"],
  ["a2-glass", "translucent frosted glass organic blob shapes floating in space, soft holographic gradient light passing through, minimal, dark background, dreamy, high-end 3D product render, depth of field"],
  ["a3-silk", "dynamic swirl of flowing silk fabric caught mid-motion, deep terracotta and cream colors, elegant folds, dark background, dramatic cinematic lighting, ultra detailed, frozen movement"],
];
console.log("flux-1.1-pro 샘플", SAMPLES.length, "장 생성...");
for (const [n,p] of SAMPLES){ console.log("[sample]",n); const u=await flux(p); if(u) await dl(u,path.join(OUT,`${n}.png`)); }
console.log("=== DONE ===");
