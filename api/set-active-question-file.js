export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const fs = require('fs')
        const path = require('path')

        const { fileName } = req.body

        // Validate input
        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({ error: 'Invalid file name' })
        }

        // Validate file name format
        if (fileName !== 'questions.json' && !/^questions-.+\.json$/.test(fileName)) {
            return res.status(400).json({ error: 'Invalid question file format' })
        }

        // Check if file exists
        const publicDir = path.join(process.cwd(), 'public')
        const filePath = path.join(publicDir, fileName)

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Question file not found' })
        }

        // Validate that it's a valid JSON file
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8')
            const questions = JSON.parse(fileContent)

            // Basic validation - should be an array
            if (!Array.isArray(questions)) {
                return res.status(400).json({ error: 'Invalid question file format - must be an array' })
            }

            if (questions.length === 0) {
                return res.status(400).json({ error: 'Question file is empty' })
            }
        } catch (parseError) {
            return res.status(400).json({ error: 'Invalid JSON file' })
        }

        // Create or update exam config
        const configPath = path.join(process.cwd(), 'exam-config.json')
        const config = {
            activeQuestionFile: fileName,
            lastUpdated: new Date().toISOString()
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

        return res.status(200).json({
            success: true,
            activeFile: fileName,
            message: 'Active question file updated successfully'
        })

    } catch (error) {
        console.error('Error setting active question file:', error)
        return res.status(500).json({ error: 'Failed to set active question file' })
    }
}
