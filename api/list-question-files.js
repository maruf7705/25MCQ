export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const fs = require('fs')
        const path = require('path')

        // Get the public directory path
        const publicDir = path.join(process.cwd(), 'public')

        // Read all files in public directory
        const files = fs.readdirSync(publicDir)

        // Find all question files matching pattern: questions.json, questions-*.json
        const questionFiles = files.filter(file =>
            file === 'questions.json' || /^questions-.+\.json$/.test(file)
        )

        if (questionFiles.length === 0) {
            return res.status(404).json({ error: 'No question files found' })
        }

        // Get file stats and format response
        const fileList = questionFiles.map(fileName => {
            const filePath = path.join(publicDir, fileName)
            const stats = fs.statSync(filePath)

            // Generate display name
            let displayName = fileName
            if (fileName === 'questions.json') {
                displayName = 'Default Question Set'
            } else {
                // Extract version/name from filename
                const match = fileName.match(/^questions-(.+)\.json$/)
                if (match) {
                    const version = match[1]
                    // Check if it's a number
                    if (/^\d+$/.test(version)) {
                        displayName = `Question Set ${version}`
                    } else {
                        // Capitalize first letter of each word
                        displayName = version
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ') + ' Question Set'
                    }
                }
            }

            return {
                name: fileName,
                displayName: displayName,
                size: stats.size,
                lastModified: stats.mtime.toISOString()
            }
        })

        // Sort by name (default first, then numbered sets, then others)
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
        return res.status(500).json({ error: 'Failed to list question files' })
    }
}
