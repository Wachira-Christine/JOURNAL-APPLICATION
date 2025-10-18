document.addEventListener('DOMContentLoaded', function() {

    const API_BASE = 'http://127.0.0.1:5000';

    // ==================== LOAD MOODS FROM DATABASE ====================
    async function loadMoods() {
        try {
            const response = await fetch(`${API_BASE}/api/moods`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                const moodOptionsContainer = document.getElementById('moodOptions');
                moodOptionsContainer.innerHTML = '';

                result.moods.forEach(mood => {
                    const moodDiv = document.createElement('div');
                    moodDiv.className = 'mood-option';
                    moodDiv.dataset.moodId = mood.id;
                    moodDiv.innerHTML = `
                        <div style="font-size: 1.8rem; margin-bottom: 8px;">${mood.emoji}</div>
                        <span>${mood.name}</span>
                    `;

                    moodDiv.addEventListener('click', async function() {
                        await selectMood(mood.id, mood.name, mood.emoji);
                    });

                    moodOptionsContainer.appendChild(moodDiv);
                });

                // Load today's mood
                loadTodayMood();
            }
        } catch (error) {
            console.error('Error loading moods:', error);
        }
    }

    // Select and save mood
    async function selectMood(moodId, moodName, moodEmoji) {
        try {
            const response = await fetch(`${API_BASE}/api/moods/today`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ mood_id: moodId })
            });

            const result = await response.json();

            if (result.success) {
                // Update UI
                document.querySelectorAll('.mood-option').forEach(opt => opt.classList.remove('active'));
                document.querySelector(`[data-mood-id="${moodId}"]`).classList.add('active');

                // Show selected mood display
                displaySelectedMood(moodName, moodEmoji);
            }
        } catch (error) {
            console.error('Error selecting mood:', error);
            alert('Failed to save mood. Please try again.');
        }
    }

    // Display today's selected mood
    function displaySelectedMood(name, emoji) {
        const display = document.getElementById('selectedMoodDisplay');
        const emojiEl = document.getElementById('selectedMoodEmoji');
        const nameEl = document.getElementById('selectedMoodName');

        emojiEl.textContent = emoji;
        nameEl.textContent = name;
        display.style.display = 'block';
    }

    // Load today's mood
    async function loadTodayMood() {
        try {
            const response = await fetch(`${API_BASE}/api/moods/today`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success && result.mood) {
                const moodOption = document.querySelector(`[data-mood-id="${result.mood.id}"]`);
                if (moodOption) {
                    moodOption.classList.add('active');
                }
                displaySelectedMood(result.mood.name, result.mood.emoji);
            }
        } catch (error) {
            console.error('Error loading today\'s mood:', error);
        }
    }

    // ==================== LOAD INTENTIONS FROM DATABASE ====================
    async function loadIntentions() {
        try {
            const response = await fetch(`${API_BASE}/api/intentions`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                const intentionsContainer = document.querySelector('.intentions');
                // Remove existing intentions except the add-intention div
                const existingIntentions = intentionsContainer.querySelectorAll('.intention');
                existingIntentions.forEach(intent => intent.remove());

                result.intentions.forEach(intention => {
                    addIntentionToUI(intention);
                });
            }
        } catch (error) {
            console.error('Error loading intentions:', error);
        }
    }

    function addIntentionToUI(intention) {
        const intentionsContainer = document.querySelector('.intentions');
        const addIntentionDiv = document.querySelector('.add-intention');

        const intentionDiv = document.createElement('div');
        intentionDiv.className = 'intention' + (intention.completed ? ' completed' : '');
        intentionDiv.dataset.intentionId = intention.id;
        intentionDiv.innerHTML = `
            <input type="checkbox" id="intention${intention.id}" ${intention.completed ? 'checked' : ''}>
            <label for="intention${intention.id}">${intention.text}</label>
        `;

        const checkbox = intentionDiv.querySelector('input');
        checkbox.addEventListener('change', async function() {
            await toggleIntention(intention.id);
        });

        intentionsContainer.insertBefore(intentionDiv, addIntentionDiv);
    }

    // Toggle intention completion
    async function toggleIntention(intentionId) {
        try {
            const response = await fetch(`${API_BASE}/api/intentions/${intentionId}/toggle`, {
                method: 'PUT',
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                const intentionDiv = document.querySelector(`[data-intention-id="${intentionId}"]`);
                if (result.intention.completed) {
                    intentionDiv.classList.add('completed');
                } else {
                    intentionDiv.classList.remove('completed');
                }
            }
        } catch (error) {
            console.error('Error toggling intention:', error);
        }
    }

    // Add new intention
    const addIntentionBtn = document.querySelector('.add-intention button');
    const addIntentionInput = document.querySelector('.add-intention input');

    if (addIntentionBtn) {
        addIntentionBtn.addEventListener('click', async function() {
            const text = addIntentionInput.value.trim();
            if (text !== '') {
                try {
                    const response = await fetch(`${API_BASE}/api/intentions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ intention_text: text })
                    });

                    const result = await response.json();

                    if (result.success) {
                        addIntentionToUI(result.intention);
                        addIntentionInput.value = '';
                    }
                } catch (error) {
                    console.error('Error adding intention:', error);
                    alert('Failed to add intention. Please try again.');
                }
            }
        });

        addIntentionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addIntentionBtn.click();
        });
    }

    // ==================== LOAD EVENTS FROM DATABASE ====================
    async function loadEvents() {
        try {
            const response = await fetch(`${API_BASE}/api/events/today`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (result.success) {
                const eventsContainer = document.getElementById('eventsList');
                eventsContainer.innerHTML = '';

                if (result.events.length === 0) {
                    eventsContainer.innerHTML = '<p style="text-align: center; color: #7A7F5C; padding: 20px;">No events for today. Click ADD to create one!</p>';
                } else {
                    result.events.forEach(event => {
                        addEventToUI(event);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    function addEventToUI(event) {
        const eventsContainer = document.getElementById('eventsList');

        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';
        eventDiv.dataset.eventId = event.id;
        eventDiv.innerHTML = `
            <div class="event-icon">
                <i class="fas fa-star"></i>
            </div>
            <div class="event-details">
                <h3>${event.title}</h3>
                <p>${event.description || 'No description'}</p>
            </div>
            <div class="event-actions">
                <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        // Edit button
        eventDiv.querySelector('.edit-btn').addEventListener('click', async function() {
            const newTitle = prompt('Edit event title:', event.title);
            const newDesc = prompt('Edit event description:', event.description || '');

            if (newTitle && newTitle.trim() !== '') {
                await updateEvent(event.id, newTitle, newDesc);
            }
        });

        // Delete button
        eventDiv.querySelector('.delete-btn').addEventListener('click', async function() {
            if (confirm('Are you sure you want to delete this event?')) {
                await deleteEvent(event.id);
            }
        });

        eventsContainer.appendChild(eventDiv);
    }

    // Update event
    async function updateEvent(eventId, title, description) {
        try {
            const response = await fetch(`${API_BASE}/api/events/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, description })
            });

            const result = await response.json();

            if (result.success) {
                loadEvents(); // Reload events
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event. Please try again.');
        }
    }

    // Delete event
    async function deleteEvent(eventId) {
        try {
            const response = await fetch(`${API_BASE}/api/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                loadEvents(); // Reload events
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }

    // ==================== MODAL HANDLING ====================
    const openBtns = document.querySelectorAll('.open-modal-btn');
    const closeBtns = document.querySelectorAll('.close-btn');

    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById(btn.dataset.modal);
            modal.style.display = 'flex';
        });
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', e => {
        if(e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // ==================== SAVE EVENT ====================
    document.getElementById('saveEvent').addEventListener('click', async () => {
        const eventInput = document.getElementById('eventInput');
        const value = eventInput.value.trim();

        if (value !== '') {
            try {
                const response = await fetch(`${API_BASE}/api/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        title: value,
                        description: '',
                        event_date: new Date().toISOString().split('T')[0]
                    })
                });

                const result = await response.json();

                if (result.success) {
                    loadEvents(); // Reload events
                    eventInput.value = '';
                    document.getElementById('eventsModal').style.display = 'none';
                }
            } catch (error) {
                console.error('Error saving event:', error);
                alert('Failed to save event. Please try again.');
            }
        }
    });

    // ==================== INSPIRATIONS (Keep in localStorage for now) ====================
    let inspirations = JSON.parse(localStorage.getItem('inspirations')) || [];
    const inspirationsList = document.getElementById('inspirationsList');
    const inspirationInput = document.getElementById('inspirationInput');

    function saveInspirations() {
        localStorage.setItem('inspirations', JSON.stringify(inspirations));
    }

    function renderInspirations() {
        inspirationsList.innerHTML = '';
        if (inspirations.length === 0) {
            inspirationsList.innerHTML = '<div class="quote">"The present moment is the only time over which we have dominion." — Thích Nhất Hạnh</div>';
        } else {
            inspirations.forEach((text, index) => {
                const div = document.createElement('div');
                div.className = 'quote';
                div.textContent = text;

                const editBtn = document.createElement('button');
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.addEventListener('click', () => {
                    const newText = prompt('Edit inspiration:', text);
                    if(newText && newText.trim() !== '') {
                        inspirations[index] = newText;
                        saveInspirations();
                        renderInspirations();
                    }
                });

                const delBtn = document.createElement('button');
                delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                delBtn.addEventListener('click', () => {
                    inspirations.splice(index, 1);
                    saveInspirations();
                    renderInspirations();
                });

                div.appendChild(editBtn);
                div.appendChild(delBtn);
                inspirationsList.appendChild(div);
            });
        }
    }

    document.getElementById('saveInspiration').addEventListener('click', () => {
        const value = inspirationInput.value.trim();
        if(value !== '') {
            inspirations.push(value);
            saveInspirations();
            renderInspirations();
            inspirationInput.value = '';
            document.getElementById('inspirationsModal').style.display = 'none';
        }
    });

    renderInspirations();

    // ==================== SOUND PLAYER ====================
    const playBtn = document.querySelector('.play-btn');
    let isPlaying = false;

    if(playBtn){
        playBtn.addEventListener('click', function() {
            isPlaying = !isPlaying;
            const icon = playBtn.querySelector('i');

            if (isPlaying) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
                playBtn.style.background = '#046307';
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                playBtn.style.background = '#7A7F5C';
            }
        });
    }

    // ==================== MEMORIES ====================
    const memoryPrompt = document.querySelector('.memory-prompt');
    const memorySection = document.querySelector('.memories');

    if(memoryPrompt){
        memoryPrompt.addEventListener('click', function() {
            const memoryText = prompt('Capture your memory:');
            if(memoryText && memoryText.trim() !== ''){
                const now = new Date();
                const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0':'') + now.getMinutes();

                const newMemory = document.createElement('div');
                newMemory.className = 'memory';
                newMemory.innerHTML = `
                    <p class="memory-text">${memoryText}</p>
                    <div class="memory-time">${timeString}</div>
                `;

                memorySection.prepend(newMemory);
            }
        });
    }

    // ==================== TABS/FAVORITES ====================
    const tabs = document.querySelectorAll('.tab');
    const favoriteItems = document.querySelectorAll('.favorite-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const category = this.textContent.toLowerCase();
            favoriteItems.forEach(item => {
                if(category === 'all'){
                    item.style.display = 'block';
                } else {
                    const title = item.querySelector('.favorite-title')?.textContent.toLowerCase() || '';
                    if(title.includes(category)){
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });

    // ==================== NAVIGATION TO CALENDAR ====================
    const openCalendarBtn = document.getElementById('openCalendar');
    if(openCalendarBtn){
        openCalendarBtn.addEventListener('click', () => {
            window.location.href = '/calendar';
        });
    }

    // ==================== INITIALIZE ====================
    loadMoods();
    loadIntentions();
    loadEvents();

});