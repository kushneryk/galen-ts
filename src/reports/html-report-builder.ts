import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { LayoutReport } from "./layout-report.js";
import { JsonReportBuilder } from "./json-report-builder.js";

export class HtmlReportBuilder {
  private readonly jsonBuilder = new JsonReportBuilder();

  build(report: LayoutReport, outputDir: string): void {
    mkdirSync(outputDir, { recursive: true });

    const reportData = this.jsonBuilder.build(report);
    const jsonString = JSON.stringify(reportData, null, 2);

    // Write JSON file
    writeFileSync(
      join(outputDir, "report.json"),
      jsonString,
      "utf-8",
    );

    // Write HTML file
    const html = this.generateHtml(reportData, jsonString);
    writeFileSync(join(outputDir, "report.html"), html, "utf-8");

    // Write screenshot if available
    if (report.screenshot) {
      writeFileSync(
        join(outputDir, "screenshot.png"),
        report.screenshot,
      );
    }
  }

  private generateHtml(
    report: ReturnType<JsonReportBuilder["build"]>,
    jsonData: string,
  ): string {
    const stats = report.statistics;
    const statusClass =
      stats.errors > 0 ? "error" : stats.warnings > 0 ? "warning" : "passed";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Galen Layout Report${report.title ? ` - ${report.title}` : ""}</title>
<style>
${CSS}
</style>
</head>
<body>
<div id="app">
  <header>
    <h1>Galen Layout Report</h1>
    ${report.title ? `<h2>${this.escapeHtml(report.title)}</h2>` : ""}
    <div class="statistics ${statusClass}">
      <span class="stat passed">${stats.passed} passed</span>
      <span class="stat warnings">${stats.warnings} warnings</span>
      <span class="stat errors">${stats.errors} errors</span>
      <span class="stat total">${stats.total} total</span>
    </div>
    ${report.includedTags.length > 0 ? `<div class="tags">Tags: ${report.includedTags.join(", ")}</div>` : ""}
  </header>
  <main id="report-content"></main>
</div>
<script>
const REPORT_DATA = ${jsonData};

function renderReport() {
  const main = document.getElementById('report-content');
  main.innerHTML = REPORT_DATA.sections.map(renderSection).join('');
}

function renderSection(section) {
  const objects = section.objects.map(renderObject).join('');
  const subsections = section.sections.map(renderSection).join('');
  return '<div class="section">'
    + (section.name ? '<h3 class="section-name">' + escapeHtml(section.name) + '</h3>' : '')
    + objects + subsections
    + '</div>';
}

function renderObject(obj) {
  const specs = obj.specs.map(renderSpec).join('');
  return '<div class="object">'
    + '<div class="object-name">' + escapeHtml(obj.name) + '</div>'
    + '<div class="specs">' + specs + '</div>'
    + '</div>';
}

function renderSpec(spec) {
  const cls = 'spec ' + spec.status;
  const icon = spec.status === 'passed' ? '✓' : spec.status === 'error' ? '✗' : '⚠';
  let html = '<div class="' + cls + '">'
    + '<span class="icon">' + icon + '</span> '
    + '<span class="spec-name">' + escapeHtml(spec.name) + '</span>';

  if (spec.errors && spec.errors.length > 0) {
    html += '<div class="error-messages">'
      + spec.errors.map(function(e) { return '<div class="error-msg">' + escapeHtml(e) + '</div>'; }).join('')
      + '</div>';
  }
  if (spec.warnings && spec.warnings.length > 0) {
    html += '<div class="warning-messages">'
      + spec.warnings.map(function(w) { return '<div class="warning-msg">' + escapeHtml(w) + '</div>'; }).join('')
      + '</div>';
  }
  html += '</div>';
  return html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

renderReport();
</script>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
header { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
h1 { font-size: 24px; margin-bottom: 8px; }
h2 { font-size: 16px; color: #666; margin-bottom: 12px; }
.statistics { display: flex; gap: 16px; font-size: 14px; }
.stat { padding: 4px 12px; border-radius: 4px; }
.stat.passed { background: #e6f4ea; color: #1e7e34; }
.stat.warnings { background: #fff3cd; color: #856404; }
.stat.errors { background: #f8d7da; color: #721c24; }
.stat.total { background: #e2e3e5; color: #383d41; }
.tags { margin-top: 8px; font-size: 13px; color: #666; }
.section { background: #fff; border-radius: 8px; margin-bottom: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.section-name { font-size: 16px; margin-bottom: 12px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.object { margin-bottom: 12px; }
.object-name { font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #555; }
.specs { padding-left: 16px; }
.spec { padding: 4px 0; font-size: 13px; display: flex; flex-wrap: wrap; align-items: flex-start; gap: 4px; }
.spec.passed .icon { color: #28a745; }
.spec.error .icon { color: #dc3545; }
.spec.warning .icon { color: #ffc107; }
.spec-name { font-family: monospace; }
.error-messages, .warning-messages { width: 100%; padding-left: 24px; }
.error-msg { color: #dc3545; font-size: 12px; }
.warning-msg { color: #856404; font-size: 12px; }
`;
