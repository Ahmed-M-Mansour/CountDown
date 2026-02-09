// DOM Elements
const elements = {
    setupView: document.getElementById('setup-view'),
    countdownView: document.getElementById('countdown-view'),
    dateInput: document.getElementById('target-date-input'),
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    calendarGrid: document.getElementById('calendar-grid'),
    daysLeftDisplay: document.getElementById('days-left-display'),
    targetDateDisplay: document.getElementById('target-date-display'),
    progressBar: document.getElementById('progress-bar'),
    completionMessage: document.getElementById('completion-message'),
    noteModal: document.getElementById('note-modal'),
    modalDayTitle: document.getElementById('modal-day-title'),
    // noteText removed
    saveNoteBtn: document.getElementById('save-note-btn'),
    addTodoBtn: document.getElementById('add-todo-btn'),
    closeModal: document.querySelector('.close-modal'),
    langToggle: document.getElementById('lang-toggle')
};

// Translations
const translations = {
    en: {
        appTitle: "Habit Countdown",
        setupTitle: "Set Your Goal Date",
        setupDesc: "Choose the date you want to reach your goal.",
        startCountdown: "Start Countdown",
        daysLeft: "Days Left",
        reset: "Reset Date",
        congrats: "Congratulations!",
        goalReached: "You have reached your goal date!",
        save: "Save",
        today: "Today",
        day: "Day",
        notesPlaceholder: "Write your notes here...",
        addTodo: "+ Add New Item",
        taskPlaceholder: "New task...",
        langBtn: "عربي"
    },
    ar: {
        appTitle: "عداد العادات",
        setupTitle: "حدد تاريخ هدفك",
        setupDesc: "اختر التاريخ الذي تريد الوصول إلى هدفك فيه.",
        startCountdown: "ابدأ العد التنازلي",
        daysLeft: "أيام متبقية",
        reset: "إعادة تعيين",
        congrats: "تهانينا!",
        goalReached: "لقد وصلت إلى تاريخ هدفك!",
        save: "حفظ",
        today: "اليوم",
        day: "يوم",
        notesPlaceholder: "اكتب ملاحظاتك هنا...",
        addTodo: "+ إضافة عنصر جديد",
        taskPlaceholder: "مهمة جديدة...",
        langBtn: "English"
    }
};

// State
let state = {
    targetDate: localStorage.getItem('countdown_target_date') || null,
    notes: JSON.parse(localStorage.getItem('countdown_notes') || '{}'),
    lang: localStorage.getItem('countdown_lang') || 'en'
};

// Initialization
function init() {
    applyLanguage(state.lang);
    if (state.targetDate) {
        showCountdown();
    } else {
        showSetup();
    }
    setupEventListeners();
}

// Logic
function showSetup() {
    elements.setupView.classList.remove('hidden');
    elements.countdownView.classList.add('hidden');
}

function showCountdown() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(state.targetDate);

    // Validate date
    if (target < today) {
        // If target is in past (and we are resetting), just show setup. 
        // Or if handled error... for now let's assume valid future date from input.
        // But if reloading app with old date?
    }

    elements.setupView.classList.add('hidden');
    elements.countdownView.classList.remove('hidden');

    renderCalendar();
    updateHeader();
}

function calculateDaysDiff(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.ceil((date2 - date1) / oneDay);
}

function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(state.targetDate);

    const daysRemaining = calculateDaysDiff(today, target);
    const totalDays = calculateDaysDiff(new Date(state.startDate || today), target); // We might need start date for proper progress bar...
    // Simplification: We will just count days remaining. 
    // To have a 'progress bar' we ideally need a start date. 
    // Let's save start date if not exists.

    if (!localStorage.getItem('countdown_start_date')) {
        localStorage.setItem('countdown_start_date', today.toISOString());
    }
    const startDate = new Date(localStorage.getItem('countdown_start_date'));
    const totalSpan = calculateDaysDiff(startDate, target);
    const currentProgress = totalSpan - daysRemaining;

    // Update Progress
    const progressPercent = Math.max(0, Math.min(100, (currentProgress / totalSpan) * 100));
    elements.progressBar.style.width = `${progressPercent}%`;

    // Update Header Text
    elements.daysLeftDisplay.innerHTML = `${Math.max(0, daysRemaining)} <span data-i18n="daysLeft">${translations[state.lang].daysLeft}</span>`;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.targetDateDisplay.textContent = target.toLocaleDateString(state.lang === 'en' ? 'en-US' : 'ar-EG', options);

    // Completion Check
    if (daysRemaining <= 0) {
        elements.calendarGrid.innerHTML = '';
        elements.completionMessage.classList.remove('hidden');
        elements.progressBar.style.width = '100%';
        return;
    } else {
        elements.completionMessage.classList.add('hidden');
    }

    // Grid Generation
    elements.calendarGrid.innerHTML = '';

    // We want cards 30, 29, 28... 1
    // Loop from daysRemaining down to 1
    for (let i = daysRemaining; i >= 1; i--) {
        const card = document.createElement('div');
        card.className = 'card';



        // Calculate the specific date string for this card
        const cardDate = new Date(target);
        cardDate.setDate(target.getDate() - i);

        const dateKey = cardDate.toISOString().split('T')[0];

        // Format date for display
        const dateOptions = { month: 'short', day: 'numeric' }; // e.g., 'Mar 12'
        const dateDisplayStr = cardDate.toLocaleDateString(state.lang === 'en' ? 'en-US' : 'ar-EG', dateOptions);

        // Check if note exists
        if (state.notes[dateKey]) {
            card.classList.add('has-note');
        }

        if (i === daysRemaining) {
            card.classList.add('today');
        }

        card.innerHTML = `
            <span class="card-date">${dateDisplayStr}</span>
            <span class="day-number">${i}</span>
            <span class="day-label">${translations[state.lang].day}</span>
        `;

        card.addEventListener('click', () => openModal(i, dateKey));
        elements.calendarGrid.appendChild(card);
    }
}

// Modal Logic
let currentNoteKey = null;

const defaultTodos = {
    en: ["Prayer", "Practical Study", "Exercise", "Work Achievement", "Remembrance"],
    ar: ["الصلاة", "دراسة عملية", "تمرين", "إنجاز عمل", "أذكار"]
};

function openModal(daysLeft, dateKey) {
    currentNoteKey = dateKey;
    // Get existing todos or initialize defaults
    let todos = state.notes[dateKey];

    if (!todos || !Array.isArray(todos)) {
        // Migration or new day: use defaults
        // If it was a string (old note), maybe convert implies losing it? 
        // Let's safe guard: if string, make it first item.
        if (typeof todos === 'string') {
            todos = [{ text: todos, completed: false }];
        } else {
            todos = defaultTodos[state.lang].map(text => ({ text, completed: false }));
        }
    }

    // Title
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const dateStr = new Date(dateKey).toLocaleDateString(state.lang === 'en' ? 'en-US' : 'ar-EG', options);

    elements.modalDayTitle.textContent = `${daysLeft} ${translations[state.lang].daysLeft} (${dateStr})`;

    renderTodos(todos);

    elements.noteModal.classList.remove('hidden');

    // Check if completed (read-only)
    const completionState = daysLeft <= 0; // Or some other logic if "Done"
    // Wait, is 'daysLeft' 0 when done? Yes.
    // Actually completion is when target date is reached.
    // If we are VIEWING a past day? No, requirement says:
    // "When the countdown reaches the final day... Disable editing"
    // So if TODAY >= Target Date.

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(state.targetDate);
    const isDone = today >= target;

    if (isDone) {
        document.querySelectorAll('.todo-input, .todo-checkbox').forEach(el => el.disabled = true);
        elements.addTodoBtn.disabled = true;
        elements.saveNoteBtn.disabled = true;
    } else {
        elements.addTodoBtn.disabled = false;
        elements.saveNoteBtn.disabled = false;
    }
}

function renderTodos(todos) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    todos.forEach(todo => {
        addTodoToDOM(todo);
    });
}

function addTodoToDOM(todo = { text: '', completed: false }) {
    const list = document.getElementById('todo-list');

    const item = document.createElement('div');
    item.className = 'todo-item';
    if (todo.completed) item.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.onchange = () => {
        todo.completed = checkbox.checked;
        item.classList.toggle('completed', todo.completed);
    };

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-input';
    input.value = todo.text;
    input.placeholder = translations[state.lang].taskPlaceholder;
    input.oninput = (e) => { todo.text = e.target.value; };

    item.appendChild(checkbox);
    item.appendChild(input);
    list.appendChild(item);
}

function saveCurrentNote() {
    if (!currentNoteKey) return;

    // Scrape values from DOM to ensure order and latest edits
    const todoElements = document.querySelectorAll('.todo-item');
    const todos = [];

    todoElements.forEach(el => {
        const checkbox = el.querySelector('.todo-checkbox');
        const input = el.querySelector('.todo-input');
        // Filter out empty new items if wanted, or keep them.
        if (input.value.trim() !== "") {
            todos.push({
                text: input.value.trim(),
                completed: checkbox.checked
            });
        }
    });

    if (todos.length > 0) {
        state.notes[currentNoteKey] = todos;
    } else {
        delete state.notes[currentNoteKey];
    }

    localStorage.setItem('countdown_notes', JSON.stringify(state.notes));
    elements.noteModal.classList.add('hidden');
    renderCalendar();
}

// Event Listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', () => {
        const dateVal = elements.dateInput.value;
        if (!dateVal) return;

        // Parse yyyy-mm-dd to local midnight date
        const [y, m, d] = dateVal.split('-').map(Number);
        const selectedDate = new Date(y, m - 1, d);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            alert('Please select a future date');
            return;
        }

        state.targetDate = selectedDate.toISOString();
        localStorage.setItem('countdown_target_date', state.targetDate);
        // Reset start date on new goal
        localStorage.setItem('countdown_start_date', new Date().toISOString());

        showCountdown();
    });

    elements.resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset? All notes will be kept but date cleared.')) {
            state.targetDate = null;
            localStorage.removeItem('countdown_target_date');
            localStorage.removeItem('countdown_start_date');
            showSetup();
        }
    });

    elements.closeModal.addEventListener('click', () => {
        elements.noteModal.classList.add('hidden');
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.noteModal) {
            elements.noteModal.classList.add('hidden');
        }
    });



    elements.addTodoBtn.addEventListener('click', () => {
        addTodoToDOM();
    });

    elements.saveNoteBtn.addEventListener('click', saveCurrentNote);

    elements.langToggle.addEventListener('click', () => {
        const newLang = state.lang === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
    });
}

function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('countdown_lang', lang);
    applyLanguage(lang);

    // Re-render UI text
    if (state.targetDate) {
        showCountdown(); // Will re-render calendar with new lang
    } else {
        updateStaticText();
    }
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    elements.langToggle.textContent = translations[lang].langBtn;

    updateStaticText();
}

function updateStaticText() {
    const t = translations[state.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });



    // Update placeholders for any open note inputs
    document.querySelectorAll('.todo-input').forEach(input => {
        input.placeholder = t.taskPlaceholder;
    });
}

function updateHeader() {
    // Helper to update dynamic header parts if needed
}

// Run
init();
