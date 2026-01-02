export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const fs = require('fs')
        const path = require('path')

        // Path to exam config file
        const configPath = path.join(process.cwd(), 'exam-config.json')

        // Check if config file exists
        if (!fs.existsSync(configPath)) {
            // Return default if config doesn't exist
            return res.status(200).json({
                activeFile: 'questions.json',
                setAt: null,
                isDefault: true
            })
        }

        // Read config file
        const configData = fs.readFileSync(configPath, 'utf-8')
        const config = JSON.parse(configData)

        // Verify the file still exists
        const publicDir = path.join(process.cwd(), 'public')
        const activeFilePath = path.join(publicDir, config.activeQuestionFile)

        if (!fs.existsSync(activeFilePath)) {
            // File was deleted, return default
            return res.status(200).json({
                activeFile: 'questions.json',
                setAt: null,
                isDefault: true,
                warning: 'Previously selected file not found, using default'
            })
        }

        return res.status(200).json({
            activeFile: config.activeQuestionFile,
            setAt: config.lastUpdated,
            isDefault: false
        })

    } catch (error) {
        console.error('Error getting active question file:', error)

        // Return default on error
        return res.status(200).json({
            activeFile: 'questions.json',
            setAt: null,
            isDefault: true,
            error: 'Failed to read config, using default'
        })
    }
}
