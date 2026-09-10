import assert from "node:assert/strict";
import test from "node:test";
import { toCsv } from "../csv";

test("quotes CSV fields and escapes embedded quotes", () => {
  assert.equal(toCsv([["Name", "Note"], ["Example, Inc.", 'A "quoted" value']]),
    '"Name","Note"\r\n"Example, Inc.","A ""quoted"" value"');
});

test("neutralizes values that spreadsheet apps could interpret as formulas", () => {
  assert.equal(toCsv([["=IMPORTXML(A1)", "+1", "@command", "-2"]]),
    '"\'=IMPORTXML(A1)","\'+1","\'@command","\'-2"');
});
