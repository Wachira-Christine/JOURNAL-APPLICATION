document.addEventListener('DOMContentLoaded', function() {

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

    // ==================== INSPIRATIONS ====================
    let inspirations = JSON.parse(localStorage.getItem('inspirations')) || [];
    const inspirationsList = document.getElementById('inspirationsList');
    const inspirationInput = document.getElementById('inspirationInput');

    function saveInspirations() {
        localStorage.setItem('inspirations', JSON.stringify(inspirations));
    }

    function renderInspirations() {
        inspirationsList.innerHTML = '';
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

    // ==================== EVENTS ====================
    let eventsList = JSON.parse(localStorage.getItem('events')) || [];
    const eventsContainer = document.getElementById('eventsList');
    const eventInput = document.getElementById('eventInput');

    function saveEvents() {
        localStorage.setItem('events', JSON.stringify(eventsList));
    }

    function renderEvents() {
        eventsContainer.innerHTML = '';
        eventsList.forEach((text, index) => {
            const div = document.createElement('div');
            div.className = 'event';
            div.innerHTML = `
                <div class="event-icon"><i class="fas fa-star"></i></div>
                <div class="event-details">
                    <h3>${text}</h3>
                    <p>Added event</p>
                </div>
            `;

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', () => {
                const newText = prompt('Edit event:', text);
                if(newText && newText.trim() !== '') {
                    eventsList[index] = newText;
                    saveEvents();
                    renderEvents();
                }
            });

            const delBtn = document.createElement('button');
            delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            delBtn.classList.add('delete-btn');
            delBtn.addEventListener('click', () => {
                eventsList.splice(index, 1);
                saveEvents();
                renderEvents();
            });

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('event-actions');
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);

            div.appendChild(actionsDiv);
            eventsContainer.appendChild(div);
        });
    }

    document.getElementById('saveEvent').addEventListener('click', () => {
        const value = eventInput.value.trim();
        if(value !== '') {
            eventsList.push(value);
            saveEvents();
            renderEvents();
            eventInput.value = '';
            document.getElementById('eventsModal').style.display = 'none';
        }
    });

    renderEvents();

    // ==================== MOOD SELECTION ====================
    const moodOptions = document.querySelectorAll('.mood-option');
    moodOptions.forEach(option => {
        option.addEventListener('click', function() {
            moodOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });

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
                playBtn.style.background = '#046307';
            }
        });
    }

    // ==================== INTENTIONS ====================
    const intentions = document.querySelectorAll('.intention input');
    intentions.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if(this.checked){
                this.parentElement.classList.add('completed');
            } else {
                this.parentElement.classList.remove('completed');
            }
        });
    });

    const addIntentionBtn = document.querySelector('.add-intention button');
    const addIntentionInput = document.querySelector('.add-intention input');
    const intentionsContainer = document.querySelector('.intentions');

    if(addIntentionBtn){
        addIntentionBtn.addEventListener('click', function() {
            const val = addIntentionInput.value.trim();
            if(val !== ''){
                const newId = 'intention' + (intentionsContainer.children.length + 1);

                const newIntention = document.createElement('div');
                newIntention.className = 'intention';
                newIntention.innerHTML = `
                    <input type="checkbox" id="${newId}">
                    <label for="${newId}">${val}</label>
                `;
                intentionsContainer.insertBefore(newIntention, document.querySelector('.add-intention'));

                newIntention.querySelector('input').addEventListener('change', function(){
                    if(this.checked){
                        newIntention.classList.add('completed');
                    } else {
                        newIntention.classList.remove('completed');
                    }
                });

                addIntentionInput.value = '';
            }
        });

        addIntentionInput.addEventListener('keypress', function(e){
            if(e.key === 'Enter') addIntentionBtn.click();
        });
    }

    // ==================== MEMORIES ====================
    const memorySection = document.querySelector('.memories');
    const memoryPrompt = document.querySelector('.card:has(.memories) p');

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
            window.location.href = 'calendar.html';
        });
    }

});
