import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";
import JSZip from "jszip";
import * as XLSX from "xlsx";

// Point pdf.js at its worker script via CDN to avoid bundler config headaches.
// IMPORTANT: the worker version MUST match the installed pdfjs-dist version exactly,
// and pdf.js v4+ ships its worker as an ES module (.mjs), not the old .min.js.
// We use jsDelivr (mirrors npm directly, no publishing lag) and the "legacy" build
// path to match the "pdfjs-dist/legacy/build/pdf" import above. Deriving the URL
// from pdfjsLib.version means this stays correct even after `npm update pdfjs-dist`.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

const MAX_ZIP_ENTRIES = 30; // guardrail so a huge/zip-bomb-y archive can't hang the browser
const MAX_ZIP_DEPTH = 2; // allow a zip-within-a-zip, but not infinitely nested

export async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText.trim();
}

export async function extractDocxText(arrayBuffer) {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// PowerPoint (.pptx) is a zip of XML. Each slide's text runs live inside <a:t> tags.
export async function extractPptxText(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
      return na - nb;
    });

  const slideTexts = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    const matches = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    if (matches.length) {
      const slideNum = path.match(/slide(\d+)\.xml$/)[1];
      slideTexts.push(`--- Slide ${slideNum} ---\n${matches.join(" ")}`);
    }
  }
  return slideTexts.join("\n\n").trim();
}

// Excel (.xlsx) — dump every sheet to CSV-ish text so numbers/headers stay readable.
export async function extractXlsxText(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const parts = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `--- Sheet: ${name} ---\n${csv.trim()}`;
  });
  return parts.join("\n\n").trim();
}

function getExtension(name = "") {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

// Routes a (name, arrayBuffer) pair to the right extractor. Used directly for
// top-level files and recursively for files found inside a zip.
async function extractByNameAndBuffer(name, arrayBuffer, depth) {
  const ext = getExtension(name);
  if (ext === "pdf") return extractPdfText(arrayBuffer);
  if (ext === "docx") return extractDocxText(arrayBuffer);
  if (ext === "pptx") return extractPptxText(arrayBuffer);
  if (ext === "xlsx") return extractXlsxText(arrayBuffer);
  if (ext === "zip") return extractZipText(arrayBuffer, depth + 1);
  if (ext === "txt" || ext === "md" || ext === "csv" || ext === "json") {
    return new TextDecoder().decode(arrayBuffer);
  }
  return null; // unsupported type
}

const SUPPORTED_ZIP_EXTENSIONS = new Set([
  "pdf", "docx", "pptx", "xlsx", "zip", "txt", "md", "csv", "json",
]);

export async function extractZipText(arrayBuffer, depth = 0) {
  if (depth > MAX_ZIP_DEPTH) {
    return "[Skipped a nested zip — too many levels deep]";
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const entries = Object.keys(zip.files)
    .filter((path) => {
      if (zip.files[path].dir) return false;
      const base = path.split("/").pop();
      if (!base || base.startsWith(".")) return false; // .DS_Store etc.
      if (path.startsWith("__MACOSX/")) return false;
      return true;
    })
    .slice(0, MAX_ZIP_ENTRIES);

  const parts = [];
  for (const path of entries) {
    const ext = getExtension(path);
    if (!SUPPORTED_ZIP_EXTENSIONS.has(ext)) {
      parts.push(`--- File: ${path} ---\n[Unsupported file type — skipped]`);
      continue; // never decompress files we can't use (videos, audio, images, etc.)
    }
    try {
      const buf = await zip.files[path].async("arraybuffer");
      const text = await extractByNameAndBuffer(path, buf, depth);
      parts.push(`--- File: ${path} ---\n${text || "[Could not extract text]"}`);
    } catch (err) {
      parts.push(`--- File: ${path} ---\n[Could not read this file: ${err.message}]`);
    }
  }

  return parts.join("\n\n").trim();
}

export async function extractFileText(file) {
  const arrayBuffer = await file.arrayBuffer();
  return extractByNameAndBuffer(file.name, arrayBuffer, 0);
}