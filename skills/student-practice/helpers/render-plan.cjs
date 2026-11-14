const fs = require("node:fs");

function escapeXml(text) {
  return text.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function render(nodes) {
  if (!Array.isArray(nodes) || nodes.length < 2 || nodes.length > 5) {
    throw new Error("План должен содержать от двух до пяти узлов.");
  }
  const positions = [];
  const rows = new Map();
  const links = [];
  for (const [index, node] of nodes.entries()) {
    if (!node || typeof node.label !== "string" || !node.label.trim() ||
        node.label.length > 26 || !Array.isArray(node.after) ||
        new Set(node.after).size !== node.after.length ||
        node.after.some(parent => !Number.isInteger(parent) || parent < 1 || parent > index)) {
      throw new Error("У каждого узла нужны label длиной до 26 символов и after с номерами предыдущих узлов.");
    }
    const level = node.after.reduce((depth, parent) => Math.max(depth, positions[parent - 1].level + 1), 0);
    const row = rows.get(level) ?? 0;
    rows.set(level, row + 1);
    const point = { level, x: 20 + 248 * row, y: 20 + 88 * level };
    positions.push(point);
    const parents = node.after.map(parent => positions[parent - 1]).sort((a, b) => a.x - b.x);
    for (const [portIndex, parent] of parents.entries()) {
      links.push([parent, point, 228 * (portIndex + 1) / (parents.length + 1)]);
    }
  }
  if (!links.length) throw new Error("Укажи хотя бы одну зависимость.");
  const width = 248 * Math.max(...rows.values());
  const height = 88 * rows.size;
  const arrows = links.map(([from, to, port]) => {
    const endX = to.x + port;
    return `<path d="M${from.x + 114} ${from.y + 40} C${from.x + 114} ${from.y + 58},${endX} ${to.y - 20},${endX} ${to.y - 4}" fill="none" stroke="#52637a" marker-end="url(#arrow)"/>`;
  });
  const boxes = nodes.map((node, index) => {
    const { x, y } = positions[index];
    return `<rect x="${x}" y="${y}" width="228" height="40" rx="6" fill="#eaf1fa" stroke="#52637a"/><text x="${x + 114}" y="${y + 25}" text-anchor="middle" fill="#132740" font-family="sans-serif" font-size="14">${escapeXml(node.label.trim())}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 20} ${height}" role="img" aria-label="Предпосылки учебного плана"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#52637a"/></marker></defs>${arrows.join("")}${boxes.join("")}</svg>\n`;
}

try {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output?.endsWith(".svg") || extra.length) {
    throw new Error("Usage: render-plan.cjs <plan.json> <plan.svg>");
  }
  const nodes = JSON.parse(fs.readFileSync(input, "utf8"));
  fs.writeFileSync(output, render(nodes), { flag: "wx" });
  console.log(output);
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
