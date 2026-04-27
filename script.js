document.addEventListener('DOMContentLoaded', () => {
    const habitForm = document.getElementById('add-habit-form');
    const habitInput = document.getElementById('habit-input');
    const habitsContainer = document.getElementById('habits-container');
    const emptyState = document.getElementById('empty-state');
    const currentDateEl = document.getElementById('current-date');

    // Display current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('en-US', options);
    currentDateEl.textContent = todayStr;

    // Internal date format for checking completions (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Load habits from localStorage
    let habits = JSON.parse(localStorage.getItem('habits')) || [];

    // Initialize UI
    renderHabits();

    // Event Listeners
    habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const habitName = habitInput.value.trim();
        
        if (habitName) {
            addHabit(habitName);
            habitInput.value = '';
        }
    });

    // Functions
    function addHabit(name) {
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            createdAt: today,
            completedDates: [],
            streak: 0
        };

        habits.push(newHabit);
        saveHabits();
        renderHabits();
    }

    function toggleHabit(id) {
        const habit = habits.find(h => h.id === id);
        if (!habit) return;

        const isCompletedToday = habit.completedDates.includes(today);

        if (isCompletedToday) {
            // Remove today from completed dates
            habit.completedDates = habit.completedDates.filter(date => date !== today);
        } else {
            // Add today to completed dates
            habit.completedDates.push(today);
        }

        // Recalculate streak
        habit.streak = calculateStreak(habit.completedDates);

        saveHabits();
        renderHabits();
    }

    function deleteHabit(id) {
        habits = habits.filter(h => h.id !== id);
        saveHabits();
        renderHabits();
    }

    function calculateStreak(completedDates) {
        if (!completedDates || completedDates.length === 0) return 0;
        
        // Sort dates descending
        const sorted = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
        
        let streak = 0;
        const current = new Date(today);
        
        for (let i = 0; i < sorted.length; i++) {
            const date = new Date(sorted[i]);
            // Calculate difference in days
            const diffTime = Math.abs(current - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            // Adjust diffDays to treat "completed today" as diff 0, "completed yesterday" as diff 1
            let adjustedDiff = diffDays;
            if(date.toISOString().split('T')[0] === today) {
               adjustedDiff = 0;
            }

            if (adjustedDiff === streak || adjustedDiff === streak + 1) {
                if (adjustedDiff > streak) {
                    streak++;
                } else if(streak === 0 && adjustedDiff === 0) {
                    streak = 1;
                }
            } else {
                break;
            }
        }
        return streak;
    }

    function saveHabits() {
        localStorage.setItem('habits', JSON.stringify(habits));
    }

    function renderHabits() {
        habitsContainer.innerHTML = '';
        
        if (habits.length === 0) {
            emptyState.style.display = 'flex';
            habitsContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        habitsContainer.style.display = 'flex';

        habits.forEach(habit => {
            const isCompletedToday = habit.completedDates.includes(today);
            
            const habitEl = document.createElement('div');
            habitEl.className = `habit-card ${isCompletedToday ? 'completed' : ''}`;
            
            habitEl.innerHTML = `
                <div class="habit-info">
                    <span class="habit-name">${escapeHTML(habit.name)}</span>
                    <span class="habit-streak">
                        <svg class="streak-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                        ${habit.streak} day streak
                    </span>
                </div>
                <div class="habit-actions">
                    <button class="delete-btn" data-id="${habit.id}" aria-label="Delete habit">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                    <label class="checkbox-wrapper">
                        <input type="checkbox" class="habit-checkbox" data-id="${habit.id}" ${isCompletedToday ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                </div>
            `;
            
            habitsContainer.appendChild(habitEl);
        });

        // Add event listeners to newly created elements
        document.querySelectorAll('.habit-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                toggleHabit(e.target.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteHabit(id);
            });
        });
    }

    // Utility to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
