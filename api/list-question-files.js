import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const isDev = !process.env.VERCEL
        let files = []

        if (isDev) {
            // Local development - read directly from filesystem
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

            const response = await fetch(githubUrl, {
                headers: headers,
                cache: 'no-store'
            })

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`)
            }

            files = await response.json()
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
            const name = file.name.toLowerCase()
            return file.type === 'file' &&
                name.endsWith('.json') &&
                !excludeFiles.includes(file.name.toLowerCase())
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
                    // questions-4.json -> Question Set 4
                    const match = nameWithoutExt.match(/^questions-(\d+)/)
                    displayName = `Question Set ${match[1]}`
                } else if (/^questions-/.test(nameWithoutExt)) {
                    // questions-Answer.json -> Answer Question Set
                    const version = nameWithoutExt.replace('questions-', '')
                    displayName = version.charAt(0).toUpperCase() + version.slice(1) + ' Question Set'
                } else if (/^chemistry/i.test(nameWithoutExt)) {
                    // Chemistry2.json -> Chemistry 2
                    const match = nameWithoutExt.match(/^chemistry(\d+)?/i)
                    if (match && match[1]) {
                        displayName = `Chemistry ${match[1]}`
                    } else {
                        displayName = 'Chemistry'
                    }
                } else {
                    // Fallback: capitalize each word and replace dashes/underscores with spaces
                    // e.g. Chemi1 -> Chemi 1
                    displayName = nameWithoutExt
                        // Insert space before numbers if they follow a letter
                        .replace(/([a-zA-Z])(\d)/g, '$1 $2')
                        .split(/[-_]/)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                }
            }

            return {
                name: fileName,
                displayName: displayName,
                size: file.size,
                lastModified: new Date().toISOString()
            }
        })

        // Sort: questions.json first, then natural sort by name
        fileList.sort((a, b) => {
            if (a.name === 'questions.json') return -1
            if (b.name === 'questions.json') return 1
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        })

        return res.status(200).json({
            files: fileList
        })

    } catch (error) {
        console.error('Error listing question files:', error)
        return res.status(500).json({
            error: 'Failed to list question files',
            details: error.message
        })
    }
}
