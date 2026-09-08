import assert from "node:assert/strict";
import test from "node:test";
import { prepareAutomaticPublication } from "../auto-publish";

test("imports the first Pexels result before publishing", async () => {
  const calls: Array<string | null> = [];
  const result = await prepareAutomaticPublication(
    async () => ["first", "second"],
    async (photo) => { calls.push(photo); return "stored-image"; },
    async (image) => { calls.push(image); },
  );
  assert.deepEqual(calls, ["first", "stored-image"]);
  assert.deepEqual(result, { image: "stored-image", imageError: null });
});

test("publishes without an image when no Pexels result is found", async () => {
  const calls: Array<string | null> = [];
  const result = await prepareAutomaticPublication(
    async () => [],
    async () => { assert.fail("must not import"); },
    async (image) => { calls.push(image); },
  );
  assert.deepEqual(calls, [null]);
  assert.equal(result.image, null);
  assert.ok(result.imageError);
  assert.match(result.imageError, /No Pexels image/);
});

test("publishes without an image when image storage fails", async () => {
  const calls: Array<string | null> = [];
  const result = await prepareAutomaticPublication(
    async () => ["first"],
    async () => { throw new Error("storage unavailable"); },
    async (image) => { calls.push(image); },
  );
  assert.deepEqual(calls, [null]);
  assert.equal(result.image, null);
  assert.ok(result.imageError);
  assert.match(result.imageError, /storage unavailable/);
});

test("does not hide publication failures", async () => {
  await assert.rejects(prepareAutomaticPublication(
    async () => [],
    async () => { assert.fail("must not import"); },
    async () => { throw new Error("database unavailable"); },
  ), /database unavailable/);
});
