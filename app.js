document.addEventListener('DOMContentLoaded', () => {
    const textboxes = [
        document.getElementById('box1'),
        document.getElementById('box2'),
        document.getElementById('box3'),
        document.getElementById('box4')
    ];
    
    const statusIndicator = document.getElementById('status');
    const API_ENDPOINT = '/.netlify/functions/api';
    
    // Store timeouts for debounce
    const typingTimers = {};
    const DONE_TYPING_INTERVAL = 1000; // Wait 1 second after typing stops before saving

    // Function to update status indicator
    function setStatus(status, message) {
        statusIndicator.className = `status-indicator ${status}`;
        statusIndicator.textContent = message;
        
        if (status === 'connected' || status === 'error') {
            setTimeout(() => {
                if (statusIndicator.className.includes(status)) {
                    statusIndicator.className = 'status-indicator';
                    statusIndicator.textContent = 'Ready';
                }
            }, 3000);
        }
    }

    // Load initial data
    async function loadData() {
        try {
            setStatus('connected', 'Loading...');
            const response = await fetch(API_ENDPOINT);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Map data to textboxes
            data.forEach(item => {
                const box = document.getElementById(item.id);
                if (box) {
                    box.value = item.content || '';
                }
            });

            // Clear loading placeholders
            textboxes.forEach((box, i) => {
                box.placeholder = `Text field ${i+1}... Start typing!`;
            });
            
            setStatus('connected', 'Connected');
        } catch (error) {
            console.error('Error loading data:', error);
            setStatus('error', 'Error loading data. Check console.');
        }
    }

    // Save data for a specific box
    async function saveData(id, content) {
        try {
            setStatus('saving', 'Saving...');
            
            const response = await fetch(API_ENDPOINT, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, content }),
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            setStatus('connected', 'Saved');
        } catch (error) {
            console.error('Error saving data:', error);
            setStatus('error', 'Failed to save');
        }
    }

    // Add event listeners for typing (with debounce)
    textboxes.forEach(box => {
        box.addEventListener('input', () => {
            clearTimeout(typingTimers[box.id]);
            setStatus('saving', 'Typing...');
            
            typingTimers[box.id] = setTimeout(() => {
                saveData(box.id, box.value);
            }, DONE_TYPING_INTERVAL);
        });
        
        // Handle explicit cut/paste events slightly faster
        box.addEventListener('paste', () => {
            clearTimeout(typingTimers[box.id]);
            typingTimers[box.id] = setTimeout(() => {
                saveData(box.id, box.value);
            }, 100);
        });
        
        box.addEventListener('cut', () => {
            clearTimeout(typingTimers[box.id]);
            typingTimers[box.id] = setTimeout(() => {
                saveData(box.id, box.value);
            }, 100);
        });
    });

    // Initial load
    loadData();
    
    // Auto-refresh data every 10 seconds to get updates from other users
    setInterval(() => {
        // Only refresh if no user is actively typing in any box
        const isActivelyTyping = Object.values(typingTimers).some(timer => timer !== null && timer !== undefined);
        if (!isActivelyTyping && statusIndicator.textContent !== 'Typing...') {
            loadData();
        }
    }, 10000);
});

