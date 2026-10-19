import { writeFile } from "node:fs/promises";

const BASE = "http://127.0.0.1:9333";
const PAGE_URL = "file:///D:/lin-an-home/index.html";
const OUT = "C:/Users/临/Documents/deepseek-harness/default-workspace";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const target = await fetch(`${BASE}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
const send = (method, params = {}) => {
  const current = ++id;
  return new Promise((resolve, reject) => {
    pending.set(current, { resolve, reject });
    ws.send(JSON.stringify({ id: current, method, params }));
  });
};
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const shot = async (path) => {
  const result = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false
  });
  await writeFile(path, Buffer.from(result.data, "base64"));
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844
});
await send("Page.navigate", { url: PAGE_URL });
await sleep(2400);

const checks = {
  innerWidth: await evaluate("window.innerWidth"),
  overflow: await evaluate("document.documentElement.scrollWidth - window.innerWidth"),
  navAbout: await evaluate("document.querySelector('.primary-nav a')?.innerText"),
  nowTitle: await evaluate("document.querySelector('#now-title')?.innerText")
};
await shot(`${OUT}/mobile-profile-top.png`);

await evaluate(
  `(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(".profile-summary");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72);
  })()`
);
await sleep(400);
await shot(`${OUT}/mobile-profile-summary.png`);

await evaluate(
  `(() => {
    const el = document.querySelector("#now");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72);
  })()`
);
await sleep(400);
await shot(`${OUT}/mobile-now.png`);

console.log(JSON.stringify(checks, null, 2));
ws.close();
