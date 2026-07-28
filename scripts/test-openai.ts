import "./load-env";

const key = process.env.OPENAI_API_KEY;
console.log("Key loaded:", key ? "sk-proj-..." + key.slice(-8) : "NONE");

async function main() {
  if (!key) {
    console.log("✗ OPENAI_API_KEY not in env");
    return;
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: "Modern minimalist logo for a mobile mechanic business. Bold icon, black on white, professional, no text.",
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });
  const d = await res.json();
  if (d.error) {
    console.log("✗ Error:", d.error.message);
    return;
  }
  if (!d.data?.[0]) {
    console.log("Unexpected:", JSON.stringify(d).slice(0, 400));
    return;
  }
  const item = d.data[0];
  console.log("✓ Works! Response keys:", Object.keys(item).join(", "));
  if (item.url) {
    console.log("URL:", item.url);
  } else if (item.b64_json) {
    const { writeFileSync } = await import("node:fs");
    const buf = Buffer.from(item.b64_json, "base64");
    writeFileSync("test-logo.png", buf);
    console.log(`Saved ${buf.length} bytes to test-logo.png`);
  }
  if (d.usage) console.log("Usage:", JSON.stringify(d.usage));
}

main().catch((e) => console.log("✗ Network:", e.message));
