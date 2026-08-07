// 실크 테라코타 무드 통일 세트 (flux-1.1-pro 고품질) → public/img/silk/
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(process.cwd());
const ENV = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const TOKEN = (ENV.match(/REPLICATE_API_TOKEN=(.+)/) || [])[1]?.trim();
const OUT = path.join(ROOT, "public/img/silk");
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

const TONE = "terracotta rust and warm cream color palette, dark warm charcoal background, dramatic cinematic rim lighting, ultra detailed, high-end 3D render, elegant, motion frozen, 8k";
const SET = [
  ["hero", "16:9", `elegant terracotta and cream silk fabric flowing dramatically across the frame, luxurious weightless folds caught in motion, ${TONE}`],
  ["swirl", "1:1", `a single terracotta silk ribbon swirling in a graceful spiral, soft focus depth, ${TONE}`],
  ["blob", "1:1", `abstract flowing terracotta liquid wax organic blob form, matte soft surface, minimal, ${TONE}`],
  ["waves", "16:9", `layered cream and rust silk waves gently rippling, delicate translucent edges, ${TONE}`],
];
console.log("실크 테라코타 세트", SET.length, "장 생성...");
for (const [n,a,p] of SET){ console.log("[silk]",n); const u=await flux(p,a); if(u) await dl(u,path.join(OUT,`${n}.png`)); }
console.log("=== DONE ===");
