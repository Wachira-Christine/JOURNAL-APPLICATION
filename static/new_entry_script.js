document.addEventListener('DOMContentLoaded', function() {
    const journalForm = document.getElementById('journal-form');
    const entriesList = document.getElementById('entries-list');

    // API base URL
    const API_BASE = 'http://127.0.0.1:5000';

    // Load entries from database
    loadEntries();

    // Handle form submission
    journalForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const titleInput = document.getElementById('entry-title');
        const contentInput = document.getElementById('entry-content');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (title && content) {
            try {
                // Save entry to database
                const response = await fetch(`${API_BASE}/api/entries`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // Add to UI
                    addEntryToUI(result.entry);

                    // Reset form
                    titleInput.value = '';
                    contentInput.value = '';

                    // Show success message
                    alert('Entry saved successfully!');
                } else {
                    alert('Failed to save entry: ' + result.message);
                }
            } catch (error) {
                console.error('Error saving entry:', error);
                alert('Failed to save entry. Please try again.');
            }
        }
    });

    async function loadEntries() {
        try {
            const response = await fetch(`${API_BASE}/api/entries`, {
                method: 'GET',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                // Clear existing entries
                entriesList.innerHTML = '';

                // Add each entry from database to UI
                result.entries.forEach(entry => {
                    addEntryToUI(entry);
                });

                // If no entries, show a placeholder
                if (result.entries.length === 0) {
                    entriesList.innerHTML = '<p style="text-align: center; color: #666;">No entries yet. Start writing your first entry!</p>';
                }
            } else {
                console.error('Failed to load entries:', result.message);
            }
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    }

    function addEntryToUI(entry) {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';
        entryElement.setAttribute('data-entry-id', entry.id);
        entryElement.innerHTML = `
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.content)}</p>
            <div class="date">${entry.date}</div>
            <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
        `;

        // Add to the top of the list
        entriesList.insertBefore(entryElement, entriesList.firstChild);
    }

    // Helper function to escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make deleteEntry available globally
    window.deleteEntry = async function(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/entries/${entryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                // Remove from UI
                const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
                if (entryElement) {
                    entryElement.remove();
                }
                alert('Entry deleted successfully!');
            } else {
                alert('Failed to delete entry: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry. Please try again.');
        }
    };
});