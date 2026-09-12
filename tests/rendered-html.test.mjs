import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const workerPromise = import(workerUrl.href).then((module) => module.default);

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", {status: 404}),
  },
};

const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function request(path, init) {
  const worker = await workerPromise;
  return worker.fetch(new Request("http://localhost" + path, init), env, context);
}

test("renders the conversion-first homepage and canonical metadata", async () => {
  const response = await request("/", {headers: {accept: "text/html"}});
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /<meta[^>]+name=["']codex-preview["'][^>]+content=["']development["']/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/seti96\.ru\/"/i);
  assert.match(html, /<main>/i);
  assert.match(html, /Промывка систем отопления, котлов и теплообменников/);
  assert.match(html, /Оставьте номер — уточним задачу и рассчитаем стоимость/);
  assert.match(html, /<input type="tel"/i);
  assert.match(html, /111900032/);
});

test("renders unique article content and metadata", async () => {
  const firstResponse = await request("/materialy/statya-1", {headers: {accept: "text/html"}});
  const lastResponse = await request("/materialy/statya-12", {headers: {accept: "text/html"}});
  const firstHtml = await firstResponse.text();
  const lastHtml = await lastResponse.text();

  assert.equal(firstResponse.status, 200);
  assert.equal(lastResponse.status, 200);
  assert.match(firstHtml, /Когда системе отопления действительно нужна промывка/);
  assert.match(lastHtml, /Как накипь влияет на котёл и теплообменник/);
  assert.match(lastHtml, /https:\/\/seti96\.ru\/materialy\/statya-12/);
  assert.notEqual(firstHtml, lastHtml);
});

test("publishes robots and sitemap on the canonical domain", async () => {
  const robots = await (await request("/robots.txt")).text();
  const sitemap = await (await request("/sitemap.xml")).text();

  assert.match(robots, /Sitemap: https:\/\/seti96\.ru\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/admin/);
  assert.match(sitemap, /https:\/\/seti96\.ru\/materialy\/statya-12/);
  assert.doesNotMatch(robots + sitemap, /сети96\.рф/i);
});

test("rejects an invalid phone and silently ignores the honeypot", async () => {
  const invalid = await request("/api/leads", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({phone: "+7", clientType: "Частный дом"}),
  });
  const honeypot = await request("/api/leads", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({website: "bot"}),
  });

  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), {error: "Проверьте номер телефона"});
  assert.equal(honeypot.status, 200);
  assert.deepEqual(await honeypot.json(), {ok: true});
});
