document.addEventListener('DOMContentLoaded', function() {
    const journalForm = document.getElementById('journal-form');
    const entriesList = document.getElementById('entries-list');

    // Load saved entries from localStorage
    loadEntries();

    // Handle form submission
    journalForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const titleInput = document.getElementById('entry-title');
        const contentInput = document.getElementById('entry-content');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (title && content) {
            // Create entry object with current date
            const entry = {
                title: title,
                content: content,
                date: new Date().toLocaleDateString('en-GB')
            };

            // Save entry
            saveEntry(entry);

            // Add to UI
            addEntryToUI(entry);

            // Reset form
            titleInput.value = '';
            contentInput.value = '';
        }
    });

    function saveEntry(entry) {
        // Get existing entries from localStorage
        let entries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        // Add new entry to beginning of array
        entries.unshift(entry);

        // Save back to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(entries));
    }

    function loadEntries() {
        // Get entries from localStorage
        const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];

        // Add sample entries if none exist
        if (entries.length === 0) {
            const sampleEntry1 = {
                title: "A Beautiful Morning",
                content: "Today I woke up feeling grateful for the simple things in life. The morning light streaming through my window reminded me of the beauty in everyday moments.",
                date: "15/01/2024"
            };

            const sampleEntry2 = {
                title: "Reflections on Growth",
                content: "This week has taught me so much about patience and perseverance. Sometimes the most challenging paths lead to the most beautiful destinations.",
                date: "12/01/2024"
            };

            entries.push(sampleEntry1, sampleEntry2);
            localStorage.setItem('journalEntries', JSON.stringify(entries));
        }

        // Clear existing entries in UI (except the hardcoded ones)
        // We'll keep the first two entries which are hardcoded in HTML
        while (entriesList.children.length > 2) {
            entriesList.removeChild(entriesList.lastChild);
        }

        // Add each entry from localStorage to UI
        entries.forEach(entry => {
            addEntryToUI(entry);
        });
    }

    function addEntryToUI(entry) {
        const entryElement = document.createElement('div');
        entryElement.className = 'entry';
        entryElement.innerHTML = `
            <h3>${entry.title}</h3>
            <p>${entry.content}</p>
            <div class="date">${entry.date}</div>
        `;

        // Add to the top of the list (after the hardcoded entries)
        if (entriesList.children.length > 2) {
            entriesList.insertBefore(entryElement, entriesList.children[2]);
        } else {
            entriesList.appendChild(entryElement);
        }
    }
});