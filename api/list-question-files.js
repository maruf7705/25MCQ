import fs from 'fs'
import path from 'path'

const GITHUB_REPO = 'Marufceoai/25MCQ'
const GITHUB_BRANCH = 'main'

// Generate display name from filename
function getDisplayName(fileName) {
    if (fileName === 'questions.json') {
        return 'Default Question Set'
    }

    const nameWithoutExt = fileName.replace('.json', '')

    if (/^questions-\d+/.test(nameWithoutExt)) {
        const match = nameWithoutExt.match(/^questions-(\d+)/)
        return `Question Set ${match[1]}`
    } else if (/^questions-/.test(nameWithoutExt)) {
        const version = nameWithoutExt.replace('questions-', '')
        return version.charAt(0).toUpperCase() + version.slice(1) + ' Question Set'
    } else if (/^chemistry/i.test(nameWithoutExt)) {
        const match = nameWithoutExt.match(/^chemistry(\d+)?/i)
        return (match && match[1]) ? `Chemistry ${match[1]}` : 'Chemistry'
    } else {
        return nameWithoutExt
            .replace(/([a-zA-Z])(\d)/g, '$1 $2')
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
}

// System files that should never appear in the question file list
const EXCLUDE_FILES = [
    'manifest.json',
    'question-files.json',
    'vercel.json',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'jsconfig.json',
    'next.config.js'
]

function isQuestionFile(fileName) {
    const name = fileName.toLowerCase()
    return name.endsWith('.json') && !EXCLUDE_FILES.includes(name)
}

function formatFileList(files) {
    const questionFiles = files.filter(f => isQuestionFile(f.name))

    const fileList = questionFiles.map(file => ({
        name: file.name,
        displayName: getDisplayName(file.name),
        size: file.size || 0,
        lastModified: new Date().toISOString()
    }))

    fileList.sort((a, b) => {
        if (a.name === 'questions.json') return -1
        if (b.name === 'questions.json') return 1
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    })

    return fileList
}

// Strategy 1: Local filesystem (dev mode)
function getFilesFromFilesystem() {
    const publicDir = path.join(process.cwd(), 'public')
    const dirFiles = fs.readdirSync(publicDir)
    return dirFiles.map(name => ({
        name,
        type: 'file',
        size: fs.statSync(path.join(publicDir, name)).size
    }))
}

// Strategy 2: GitHub Contents API (production, with or without token)
async function getFilesFromGitHubAPI() {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const githubUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/public?ref=${GITHUB_BRANCH}`

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': '25MCQ-App'
    }
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
    }

    const response = await fetch(githubUrl, { headers })

    if (!response.ok) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining')
        throw new Error(
            `GitHub API error: ${response.status} (rate-limit-remaining: ${rateLimitRemaining})`
        )
    }

    return await response.json()
}

// Strategy 3: Fallback - fetch question-files.json from raw GitHub
async function getFilesFromFallback() {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/public/question-files.json`
    const response = await fetch(rawUrl)

    if (!response.ok) {
        throw new Error(`Fallback fetch failed: ${response.status}`)
    }

    const data = await response.json()
    // question-files.json has { questionFiles: [{ name, displayName }] }
    if (data.questionFiles && Array.isArray(data.questionFiles)) {
        return data.questionFiles.map(f => ({
            name: f.name,
            type: 'file',
            size: 0
        }))
    }

    throw new Error('Invalid question-files.json format')
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const isDev = !process.env.VERCEL
        let files = []

        if (isDev) {
            files = getFilesFromFilesystem()
        } else {
            // Try GitHub Contents API first, fall back to raw question-files.json
            try {
                files = await getFilesFromGitHubAPI()
            } catch (apiError) {
                console.warn('GitHub API failed, using fallback:', apiError.message)
                files = await getFilesFromFallback()
            }
        }

        const fileList = formatFileList(files)

        return res.status(200).json({ files: fileList })

    } catch (error) {
        console.error('Error listing question files:', error)
        return res.status(500).json({
            error: 'Failed to list question files',
            details: error.message
        })
    }
}
