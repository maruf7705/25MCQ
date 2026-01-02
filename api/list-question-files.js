export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const isDev = !process.env.VERCEL

        if (isDev) {
            // Local development - use manifest file
            const manifestResponse = await fetch('/question-files.json', { cache: 'no-store' })
            if (!manifestResponse.ok) {
                return res.status(404).json({ error: 'Question files manifest not found' })
            }
            const manifest = await manifestResponse.json()
            return res.status(200).json({ files: manifest.questionFiles })
        }

        // On Vercel - use GitHub API to dynamically list all files
        const GITHUB_REPO = 'maruf7705/25MCQ'
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN

        // Get list of files from GitHub public directory
        const githubUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/public`

        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        }

        // Add token if available for higher rate limits
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

        const files = await response.json()

        // Filter for question JSON files
        const questionFiles = files.filter(file => {
            const name = file.name.toLowerCase()
            // Match: questions.json, questions-*.json, chemistry*.json, etc.
            return file.type === 'file' &&
                name.endsWith('.json') &&
                name !== 'manifest.json' &&
                name !== 'question-files.json' &&
                (name.startsWith('questions') || name.startsWith('chemistry'))
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
                    // Fallback: capitalize each word
                    displayName = nameWithoutExt
                        .split(/[-_]/)
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                }
            }

            return {
                name: fileName,
                displayName: displayName,
                size: file.size,
                lastModified: new Date().toISOString() // GitHub API doesn't provide this easily
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
            details: error.message
        })
    }
}
