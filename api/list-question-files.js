export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // On Vercel, we can't scan the filesystem, so we read from a manifest file
        const isDev = !process.env.VERCEL

        // Get the manifest URL
        const manifestUrl = isDev
            ? '/question-files.json'
            : `https://${req.headers.host}/question-files.json`

        // Fetch the manifest
        const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' })

        if (!manifestResponse.ok) {
            return res.status(404).json({ error: 'Question files manifest not found' })
        }

        const manifest = await manifestResponse.json()

        if (!manifest || !manifest.questionFiles || manifest.questionFiles.length === 0) {
            return res.status(404).json({ error: 'No question files found' })
        }

        // For each file, try to get metadata
        const fileList = await Promise.all(
            manifest.questionFiles.map(async (file) => {
                const fileUrl = isDev
                    ? `/${file.name}`
                    : `https://${req.headers.host}/${file.name}`

                try {
                    const fileResponse = await fetch(fileUrl, { method: 'HEAD', cache: 'no-store' })

                    if (fileResponse.ok) {
                        const size = parseInt(fileResponse.headers.get('content-length') || '0')
                        const lastModified = fileResponse.headers.get('last-modified') || new Date().toISOString()

                        return {
                            name: file.name,
                            displayName: file.displayName,
                            size: size,
                            lastModified: lastModified
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching metadata for ${file.name}:`, error)
                }

                // Fallback if metadata fetch fails
                return {
                    name: file.name,
                    displayName: file.displayName,
                    size: 0,
                    lastModified: new Date().toISOString()
                }
            })
        )

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
