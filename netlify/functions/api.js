const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    try {
        // Initialize the Netlify Blob store named 'copypaste'
        // This connects automatically when deployed or when using 'netlify dev'
        const store = getStore('copypaste');

        // Handle GET request - Fetch all texts
        if (event.httpMethod === 'GET') {
            // Retrieve the stored data (or an empty array if nothing is saved yet)
            let data = [];
            try {
                data = await store.get('all_boxes', { type: 'json' }) || [];
            } catch (e) {
                console.warn('Could not parse blob as JSON, defaulting to empty array', e);
            }
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(data)
            };
        } 
        
        // Handle PUT request - Update a specific text field
        if (event.httpMethod === 'PUT') {
            if (!event.body) {
                return { statusCode: 400, body: 'Missing body' };
            }

            const { id, content } = JSON.parse(event.body);

            if (!id) {
                return { statusCode: 400, body: 'Missing id' };
            }

            // Fetch existing data
            let data = [];
            try {
                data = await store.get('all_boxes', { type: 'json' }) || [];
            } catch (e) {
                console.warn('Could not parse blob as JSON during PUT, defaulting to empty array', e);
            }
            
            // Update the specific box in the array
            const existingIndex = data.findIndex(item => item.id === id);
            if (existingIndex >= 0) {
                data[existingIndex].content = content;
            } else {
                data.push({ id, content });
            }

            // Save the updated array back to Netlify Blobs
            await store.setJSON('all_boxes', data);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({ success: true, id })
            };
        }

        // Handle OPTIONS request for CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
                },
                body: ''
            };
        }

        return { statusCode: 405, body: 'Method Not Allowed' };

    } catch (error) {
        console.error('Netlify Blob Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message || 'Internal Server Error',
                stack: error.stack,
                name: error.name
            })
        };
    }
};
