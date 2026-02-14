import { Buffer } from "buffer";

const OWNER = process.env.GITHUB_OWNER || 'maruf7705';
const REPO = process.env.GITHUB_REPO || '25MCQ';
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const FILE_PATH = "pending-students.json";

async function removeLocally(studentName) {
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
        // File doesn't exist, nothing to remove
        return;
    }

    // Remove student from the list
    let filteredData = currentData.filter(
        item => item.studentName !== studentName
    );

    // Also cleanup expired pending students (>70 minutes)
    const now = Date.now();
    const TIMEOUT_THRESHOLD = 70 * 60 * 1000; // 70 minutes in milliseconds

    filteredData = filteredData.filter(item => {
        const timestamp = new Date(item.timestamp).getTime();
        const elapsed = now - timestamp;
        return elapsed <= TIMEOUT_THRESHOLD; // Keep only non-expired
    });

    await fs.writeFile(filePath, JSON.stringify(filteredData, null, 2));
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
            await removeLocally(body.studentName);
            return res.status(200).json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to remove pending student locally" });
        }
    }

    if (!TOKEN) {
        return res.status(500).json({ error: "Missing GITHUB_TOKEN configuration" });
    }

    try {
        const { content, sha } = await fetchFile();
        const list = Array.isArray(content) ? content : [];

        // Remove student from the list
        let filteredList = list.filter(
            item => item.studentName !== body.studentName
        );

        // Also cleanup expired pending students (>70 minutes)
        const now = Date.now();
        const TIMEOUT_THRESHOLD = 70 * 60 * 1000; // 70 minutes in milliseconds

        filteredList = filteredList.filter(item => {
            const timestamp = new Date(item.timestamp).getTime();
            const elapsed = now - timestamp;
            return elapsed <= TIMEOUT_THRESHOLD; // Keep only non-expired
        });

        const updated = JSON.stringify(filteredList, null, 2);
        await updateFile(updated, sha);

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        const statusCode = err.message.includes('GitHub Token Invalid') ? 401 : 500;
        return res.status(statusCode).json({
            error: "Failed to remove pending student",
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
            message: "chore: remove pending student",
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
