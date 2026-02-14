import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER || 'maruf7705';
const REPO = process.env.GITHUB_REPO || '25MCQ';
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "pending-students.json";

async function saveLocally(data) {
  // Dynamic imports
  const fs = (await import("fs/promises")).default;
  const path = (await import("path")).default;

  const filePath = path.join(process.cwd(), FILE_PATH);
  let currentData = [];
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    currentData = JSON.parse(fileContent);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  // Check for duplicates - prevent same student from being added multiple times
  const existingIndex = currentData.findIndex(
    item => item.studentName === data.studentName
  );

  if (existingIndex === -1) {
    // Student not found, add new entry
    currentData.push(data);
    await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));
  }
  // If student already exists, don't add duplicate
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  if (!body.studentName) {
    return res.status(400).json({ error: "studentName required" });
  }

  const pendingStudent = {
    studentName: body.studentName,
    timestamp: body.timestamp || new Date().toISOString(), // Use provided timestamp or fallback to now
    status: "Pending"
  };

  if (!process.env.VERCEL_ENV) {
    try {
      await saveLocally(pendingStudent);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save pending student locally" });
    }
  }

  if (!TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN configuration" });
  }

  try {
    const { content, sha } = await fetchFile();
    const list = Array.isArray(content) ? content : [];

    // Check for duplicates
    const existingIndex = list.findIndex(
      item => item.studentName === pendingStudent.studentName
    );

    if (existingIndex === -1) {
      // Student not found, add new entry
      list.push(pendingStudent);
      const updated = JSON.stringify(list, null, 2);
      await updateFile(updated, sha);
    }
    // If student already exists, don't add duplicate

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes('GitHub Token Invalid') ? 401 : 500;
    return res.status(statusCode).json({
      error: "Failed to save pending student",
      details: err.message
    });
  }
}

async function fetchFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('GitHub Token Invalid or Expired');
    }
    if (res.status === 404) {
      return { content: [], sha: undefined };
    }
    const errorText = await res.text().catch(() => 'Could not read error');
    throw new Error(`GitHub fetch failed: ${res.status} ${errorText}`);
  }

  try {
    const data = await res.json();
    const decoded = Buffer.from(data.content, "base64").toString("utf8");
    const parsed = JSON.parse(decoded || "[]");
    return { content: parsed, sha: data.sha };
  } catch (parseErr) {
    throw parseErr;
  }
}

async function updateFile(content, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: "chore: add pending student",
      content: Buffer.from(content).toString("base64"),
      branch: BRANCH,
      sha,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      throw new Error('GitHub Token Invalid or Expired');
    }
    throw new Error(`GitHub update failed: ${res.status} ${text}`);
  }
}
