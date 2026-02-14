import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER || 'maruf7705';
const REPO = process.env.GITHUB_REPO || '25MCQ';
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "answers.json";

async function deleteLocally(studentName, timestamp) {
  // Dynamic imports
  const fs = (await import("fs/promises")).default;
  const path = (await import("path")).default;

  const filePath = path.join(process.cwd(), FILE_PATH);
  let currentData = [];
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    currentData = JSON.parse(fileContent);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { success: false, error: "File not found" };
    }
    throw error;
  }

  const filtered = currentData.filter(
    (item) => !(item.studentName === studentName && item.timestamp === timestamp)
  );

  if (filtered.length === currentData.length) {
    return { success: false, error: "Submission not found" };
  }

  await fs.writeFile(filePath, JSON.stringify(filtered, null, 2));
  return { success: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { studentName, timestamp } = req.body || {};
  if (!studentName || !timestamp) {
    return res.status(400).json({ error: "studentName and timestamp required" });
  }

  if (!process.env.VERCEL_ENV) {
    try {
      const result = await deleteLocally(studentName, timestamp);
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete answer locally" });
    }
  }

  if (!TOKEN) {
    return res.status(500).json({ error: "Missing GitHub configuration" });
  }

  try {
    const { content, sha } = await fetchFile();
    const list = Array.isArray(content) ? content : [];

    // Remove the submission
    const filtered = list.filter(
      (item) => !(item.studentName === studentName && item.timestamp === timestamp)
    );

    if (filtered.length === list.length) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const updated = JSON.stringify(filtered, null, 2);
    await updateFile(updated, sha);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes('GitHub Token Invalid') ? 401 : 500;
    return res.status(statusCode).json({
      error: "Failed to delete answer",
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

  const data = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  const parsed = JSON.parse(decoded || "[]");
  return { content: parsed, sha: data.sha };
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
      message: "chore: delete exam submission",
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
