import { describe, it, expect } from "vitest";
import { IndentationStructureParser } from "../../src/parser/indentation-structure-parser.js";

const parser = new IndentationStructureParser();

describe("IndentationStructureParser", () => {
  it("parses flat nodes (no indentation)", () => {
    const nodes = parser.parse("alpha\nbeta\ngamma");
    expect(nodes).toHaveLength(3);
    expect(nodes[0].name).toBe("alpha");
    expect(nodes[1].name).toBe("beta");
    expect(nodes[2].name).toBe("gamma");
  });

  it("parses single parent with children", () => {
    const nodes = parser.parse("parent\n  child1\n  child2");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].name).toBe("parent");
    expect(nodes[0].childNodes).toHaveLength(2);
    expect(nodes[0].childNodes[0].name).toBe("child1");
    expect(nodes[0].childNodes[1].name).toBe("child2");
  });

  it("parses deeply nested hierarchy (3 levels)", () => {
    const nodes = parser.parse("root\n  mid\n    leaf");
    expect(nodes[0].childNodes[0].childNodes[0].name).toBe("leaf");
  });

  it("treats tabs as 4 spaces", () => {
    const nodes = parser.parse("parent\n\tchild");
    expect(nodes[0].childNodes[0].name).toBe("child");
  });

  it("skips comment lines (starting with #)", () => {
    const nodes = parser.parse("# comment\nnode1\n# another\nnode2");
    expect(nodes).toHaveLength(2);
    expect(nodes[0].name).toBe("node1");
  });

  it("skips blank lines", () => {
    const nodes = parser.parse("node1\n\n\nnode2");
    expect(nodes).toHaveLength(2);
  });

  it("throws SyntaxError for inconsistent indentation among siblings", () => {
    // child1 at 4 spaces sets parent.childIndentation=4
    // child2 at 2 spaces pops back to parent, but 2 !== 4 → error
    expect(() =>
      parser.parse("parent\n    child1\n  child2"),
    ).toThrow();
  });

  it("handles mixed content (comments, blanks, nested)", () => {
    const text = `# header
parent
  # child comment
  child1

  child2
    grandchild`;
    const nodes = parser.parse(text);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].childNodes).toHaveLength(2);
    expect(nodes[0].childNodes[1].childNodes[0].name).toBe("grandchild");
  });

  it("attaches correct Place to each node", () => {
    const nodes = parser.parse("# comment\nfirst\nsecond", "test.gspec");
    expect(nodes[0].place?.lineNumber).toBe(2);
    expect(nodes[1].place?.lineNumber).toBe(3);
    expect(nodes[0].place?.filePath).toBe("test.gspec");
  });

  it("uses custom source name in Place", () => {
    const nodes = parser.parse("node", "my-file.gspec");
    expect(nodes[0].place?.filePath).toBe("my-file.gspec");
  });
});
