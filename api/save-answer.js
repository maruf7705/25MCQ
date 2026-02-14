import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER || 'maruf7705';
const REPO = process.env.GITHUB_REPO || '25MCQ';
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "answers.json";

/**
 * Generate a unique student name by checking existing submissions
 * and appending numeric suffixes if duplicates exist
 */
function getUniqueStudentName(desiredName, existingSubmissions) {
  // Get all existing student names
  const existingNames = existingSubmissions.map(sub => sub.studentName);

  // If the desired name doesn't exist, use it as-is
  if (!existingNames.includes(desiredName)) {
    return desiredName;
  }

  // Find all names that match the pattern: desiredName, desiredName_1, desiredName_2, etc.
  const namePattern = new RegExp(`^${desiredName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(_\\d+)?$`);
  const matchingNames = existingNames.filter(name => namePattern.test(name));

  // Extract suffix numbers from matching names
  const suffixNumbers = matchingNames.map(name => {
    const match = name.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  });

  // Find the next available suffix
  const nextSuffix = Math.max(...suffixNumbers) + 1;
  return `${desiredName}_${nextSuffix}`;
}

async function saveLocally(data) {
  // Dynamic imports to avoid Vercel crash
  const fs = await import("fs/promises");
  const path = await import("path");

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

  // Generate unique student name before saving
  const uniqueName = getUniqueStudentName(data.studentName, currentData);
  const dataToSave = { ...data, studentName: uniqueName };

  currentData.push(dataToSave);
  await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));

  return { originalName: data.studentName, savedName: uniqueName };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  if (!body.studentName) {
    return res.status(400).json({ error: "studentName required" });
  }

  if (!process.env.VERCEL_ENV) {
    try {
      const result = await saveLocally(body);
      console.log(`Saved submission: "${result.originalName}" as "${result.savedName}"`);
      return res.status(200).json({
        success: true,
        savedName: result.savedName,
        wasRenamed: result.originalName !== result.savedName
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save answer locally" });
    }
  }

  if (!TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN configuration" });
  }

  try {
    const { content, sha } = await fetchFile();
    const list = Array.isArray(content) ? content : [];

    // Generate unique student name before saving
    const uniqueName = getUniqueStudentName(body.studentName, list);
    const dataToSave = { ...body, studentName: uniqueName };

    list.push(dataToSave);

    const updated = JSON.stringify(list, null, 2);
    await updateFile(updated, sha);

    console.log(`Saved submission: "${body.studentName}" as "${uniqueName}"`);
    return res.status(200).json({
      success: true,
      savedName: uniqueName,
      wasRenamed: body.studentName !== uniqueName
    });
  } catch (err) {
    console.error(err);
    const statusCode = err.message.includes('GitHub Token Invalid') ? 401 : 500;
    return res.status(statusCode).json({
      error: "Failed to save answer",
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
      message: "chore: append exam submission",
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
