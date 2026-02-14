export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const isDev = !process.env.VERCEL
        let files = []

        if (isDev) {
            // Local development - dynamically import fs and path
            const fs = await import('fs')
            const path = await import('path')
            const publicDir = path.join(process.cwd(), 'public')
            try {
                const dirFiles = fs.readdirSync(publicDir)
                files = dirFiles.map(name => ({
                    name,
                    type: 'file',
                    size: fs.statSync(path.join(publicDir, name)).size
                }))
            } catch (err) {
                console.error('Error reading public directory:', err)
                return res.status(500).json({ error: 'Failed to read public directory' })
            }
        } else {
            // On Vercel - use GitHub API to dynamically list all files
            const GITHUB_REPO = 'maruf7705/25MCQ'
            const GITHUB_TOKEN = process.env.GITHUB_TOKEN
            const githubUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/public`

            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            }
            if (GITHUB_TOKEN) {
                headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
            }

            let response
            try {
                response = await fetch(githubUrl, { headers })
            } catch (fetchErr) {
                console.error('GitHub API fetch error:', fetchErr)
                return res.status(500).json({
                    error: 'Failed to fetch from GitHub API',
                    details: fetchErr.message
                })
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Could not read error')
                console.error('GitHub API response error:', response.status, errorText)
                return res.status(500).json({
                    error: `GitHub API error: ${response.status}`,
                    details: errorText
                })
            }

            try {
                files = await response.json()
            } catch (jsonErr) {
                console.error('GitHub API JSON parse error:', jsonErr)
                return res.status(500).json({
                    error: 'Failed to parse GitHub API response',
                    details: jsonErr.message
                })
            }

            // Ensure files is an array
            if (!Array.isArray(files)) {
                console.error('GitHub API returned non-array:', typeof files)
                return res.status(500).json({
                    error: 'GitHub API returned unexpected format',
                    details: 'Expected array but got ' + typeof files
                })
            }
        }

        // List of system files to exclude
        const excludeFiles = [
            'manifest.json',
            'question-files.json',
            'vercel.json',
            'package.json',
            'package-lock.json',
            'tsconfig.json',
            'jsconfig.json',
            'next.config.js'
        ]

        // Filter for any JSON file that isn't a system file
        const questionFiles = files.filter(file => {
            const name = (file.name || '').toLowerCase()
            return file.type === 'file' &&
                name.endsWith('.json') &&
                !excludeFiles.includes(name)
        })

        // Format the file list
        const fileList = questionFiles.map(file => {
            const fileName = file.name
            let displayName = fileName

            // Generate display name
            if (fileName === 'questions.json') {
                displayName = 'Default Question Set'
            } else {
                // Remove .json extension
                const nameWithoutExt = fileName.replace('.json', '')

                // Check for patterns
                if (/^questions-\d+/.test(nameWithoutExt)) {
                    const match = nameWithoutExt.match(/^questions-(\d+)/)
                    displayName = `Question Set ${match[1]}`
                } else if (/^questions-/.test(nameWithoutExt)) {
                    const version = nameWithoutExt.replace('questions-', '')
                    displayName = version.charAt(0).toUpperCase() + version.slice(1) + ' Question Set'
                } else if (/^chemistry/i.test(nameWithoutExt)) {
                    const match = nameWithoutExt.match(/^chemistry(\d+)?/i)
                    if (match && match[1]) {
                        displayName = `Chemistry ${match[1]}`
                    } else {
                        displayName = 'Chemistry'
                    }
                } else {
                    displayName = nameWithoutExt
                        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
                        .split(/[-_]/)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                }
            }

            return {
                name: fileName,
                displayName: displayName,
                size: file.size || 0,
                lastModified: new Date().toISOString()
            }
        })

        // Sort: questions.json first, then by name
        fileList.sort((a, b) => {
            if (a.name === 'questions.json') return -1
            if (b.name === 'questions.json') return 1
            return a.name.localeCompare(b.name)
        })

        return res.status(200).json({
            files: fileList
        })

    } catch (error) {
        console.error('Error listing question files:', error)
        return res.status(500).json({
            error: 'Failed to list question files',
            details: error.message,
            stack: error.stack
        })
    }
}
