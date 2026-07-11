// PulseFit JS Logic

// State management
let state = {
    username: null, // no accounts/passwords — this is just a storage namespace the person types in
    weightLogs: [], // Array of { id, date, weight }
    weightGoal: 75.0,
    workoutLogs: [], // Array of { id, date, exercise, sets, reps, load }
    workoutPlans: [], // Array of { id, name, days: [ { name, exercises: [ { name, sets, reps } ] } ] }
    activePlanId: null,
    lastKnownLevel: 1 // tracks level for level-up detection
};

// Brand-new usernames start with a clean slate — no fabricated weight/workout
// history pretending to be theirs. Only workout PLAN templates (below) are
// seeded, since those are just starter routines, not personal logs.
const DEFAULT_WEIGHT_LOGS = [];
const DEFAULT_WORKOUTS = [];

// Default plans
const DEFAULT_PLANS = [
    {
        id: 'p1',
        name: '3-Day Push/Pull/Legs Split',
        days: [
            {
                name: 'Day 1: Push (Chest/Shoulders/Triceps)',
                exercises: [
                    { name: 'Bench Press', sets: 4, reps: '8-10' },
                    { name: 'Overhead Press', sets: 3, reps: '10' },
                    { name: 'Incline Dumbbell Fly', sets: 3, reps: '12' },
                    { name: 'Triceps Pushdown', sets: 3, reps: '12' }
                ]
            },
            {
                name: 'Day 2: Pull (Back/Biceps)',
                exercises: [
                    { name: 'Barbell Deadlift', sets: 3, reps: '5' },
                    { name: 'Barbell Row', sets: 4, reps: '8' },
                    { name: 'Lat Pulldown', sets: 3, reps: '10' },
                    { name: 'Bicep Barbell Curl', sets: 3, reps: '12' }
                ]
            },
            {
                name: 'Day 3: Legs & Abs',
                exercises: [
                    { name: 'Squat', sets: 4, reps: '8' },
                    { name: 'Romanian Deadlift', sets: 3, reps: '10' },
                    { name: 'Leg Press', sets: 3, reps: '12' },
                    { name: 'Hanging Leg Raise', sets: 3, reps: '15' }
                ]
            }
        ]
    },
    {
        id: 'p2',
        name: '2-Day Upper/Lower Split',
        days: [
            {
                name: 'Day 1: Upper Body Focus',
                exercises: [
                    { name: 'Incline Bench Press', sets: 4, reps: '8' },
                    { name: 'Pull-Ups', sets: 4, reps: '8' },
                    { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10' },
                    { name: 'Dumbbell Hammer Curl', sets: 3, reps: '12' }
                ]
            },
            {
                name: 'Day 2: Lower Body Focus',
                exercises: [
                    { name: 'Back Squat', sets: 4, reps: '6' },
                    { name: 'Leg Curl', sets: 3, reps: '12' },
                    { name: 'Calf Raise', sets: 4, reps: '15' },
                    { name: 'Plank Hold', sets: 3, reps: '60s' }
                ]
            }
        ]
    }
];

// Initialize chart reference
let weightChart = null;
let editorDaysList = []; // Temp holder for days during custom plan creation

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupUsernameGate();
    setupEventListeners();

    // Set default dates to today (safe even while the app is hidden behind the gate)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('weight-date').value = today;
    document.getElementById('workout-date-input').value = today;
    document.getElementById('quick-weight-date').value = today;
});

// =====================================================
// USERNAME GATE — no passwords, just a typed namespace
// =====================================================

// Every storage key is scoped to the current username, so different people
// (or profiles) on the same device/browser keep separate data. This is NOT
// authentication — anyone who types the same username sees the same data.
function namespacedKey(base) {
    return `pulsefit_user_${state.username}_${base}`;
}

function setupUsernameGate() {
    const input = document.getElementById('username-input');
    const goBtn = document.getElementById('btn-username-go');
    const switchBtn = document.getElementById('btn-switch-user');

    // Convenience only — pre-fills the last-used name, does NOT auto-log-in.
    const lastUsed = localStorage.getItem('pulsefit_last_username');
    if (lastUsed) input.value = lastUsed;

    const attemptLogin = () => {
        const name = input.value.trim();
        if (!name) {
            input.focus();
            return;
        }
        loginAsUser(name);
    };

    goBtn.addEventListener('click', attemptLogin);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            attemptLogin();
        }
    });

    switchBtn.addEventListener('click', switchUser);
}

function loginAsUser(name) {
    state.username = name;
    localStorage.setItem('pulsefit_last_username', name);

    loadData();

    document.getElementById('username-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'grid';

    const display = document.getElementById('sidebar-username-display');
    if (display) display.textContent = name;

    renderAll();
}

function switchUser() {
    if (weightChart) {
        weightChart.destroy();
        weightChart = null;
    }

    state.username = null;
    state.weightLogs = [];
    state.workoutLogs = [];
    state.workoutPlans = [];
    state.weightGoal = 75.0;
    state.activePlanId = null;
    state.lastKnownLevel = 1;

    document.getElementById('main-app').style.display = 'none';
    document.getElementById('username-screen').style.display = 'flex';

    const input = document.getElementById('username-input');
    input.value = '';
    input.focus();
}

// Load data from LocalStorage, namespaced to state.username
function loadData() {
    const savedWeight = localStorage.getItem(namespacedKey('weightLogs'));
    const savedGoal = localStorage.getItem(namespacedKey('weightGoal'));
    const savedWorkouts = localStorage.getItem(namespacedKey('workouts'));
    const savedPlans = localStorage.getItem(namespacedKey('plans'));
    const savedLevel = localStorage.getItem(namespacedKey('lastKnownLevel'));

    state.weightLogs = savedWeight ? JSON.parse(savedWeight) : [...DEFAULT_WEIGHT_LOGS];
    state.weightGoal = savedGoal ? parseFloat(savedGoal) : 75.0;
    state.workoutLogs = savedWorkouts ? JSON.parse(savedWorkouts) : [...DEFAULT_WORKOUTS];
    state.workoutPlans = savedPlans ? JSON.parse(savedPlans) : DEFAULT_PLANS.map(p => ({ ...p }));
    state.lastKnownLevel = savedLevel ? parseInt(savedLevel) : 1;

    if (!savedWeight) saveToLocalStorage('weightLogs');
    if (!savedGoal) localStorage.setItem(namespacedKey('weightGoal'), state.weightGoal);
    if (!savedWorkouts) saveToLocalStorage('workouts');
    if (!savedPlans) saveToLocalStorage('plans');
}

// Save helpers — all keys namespaced to the active username
function saveToLocalStorage(key) {
    if (!state.username) return;
    if (key === 'weightLogs') {
        localStorage.setItem(namespacedKey('weightLogs'), JSON.stringify(state.weightLogs));
    } else if (key === 'workouts') {
        localStorage.setItem(namespacedKey('workouts'), JSON.stringify(state.workoutLogs));
    } else if (key === 'plans') {
        localStorage.setItem(namespacedKey('plans'), JSON.stringify(state.workoutPlans));
    } else if (key === 'level') {
        localStorage.setItem(namespacedKey('lastKnownLevel'), state.lastKnownLevel);
    }
}

// DOM Rendering pipeline
function renderAll() {
    renderStats();
    renderCharts();
    renderWeightHistory();
    renderWorkoutHistory();
    renderWorkoutSnippet();
    renderPlansRoster();
    renderLevel();
}

// =====================================================
// GAMIFICATION — Strength Total / Level / Rank System
// =====================================================

// Parse numeric kg value from a string like '80kg', '80 kg', '80', 'Bodyweight'
function parseLoad(loadStr) {
    if (!loadStr) return 0;
    const lower = String(loadStr).toLowerCase();
    if (lower === 'bodyweight' || lower === 'bw') return 0;
    const match = lower.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

// Sum up the maximum load ever logged for each unique exercise
function computeTotalStrength() {
    const maxPerExercise = {};
    state.workoutLogs.forEach(entry => {
        const load = parseLoad(entry.load);
        const name = (entry.exercise || '').toLowerCase().trim();
        if (!name) return;
        if (!maxPerExercise[name] || load > maxPerExercise[name]) {
            maxPerExercise[name] = load;
        }
    });
    return Object.values(maxPerExercise).reduce((sum, v) => sum + v, 0);
}

// Derive level and rank from total strength
function getLevelData(totalStrength) {
    const level = Math.floor(totalStrength / 100) + 1;
    const progressInLevel = totalStrength % 100; // kg within current 100-kg band
    const progressPct = progressInLevel; // out of 100

    let rank = 'Fit Novice';
    if (level >= 10) rank = 'Elite Athlete';
    else if (level >= 6) rank = 'Gym Warrior';
    else if (level >= 3) rank = 'Iron Lifter';

    const kgToNext = 100 - progressInLevel;

    return { level, rank, progressPct, kgToNext, totalStrength };
}

// Update all gamification DOM elements
function renderLevel(triggerLevelUpAnimation = false) {
    const totalStrength = computeTotalStrength();
    const { level, rank, progressPct, kgToNext } = getLevelData(totalStrength);

    // Dashboard banner
    const badgeEl = document.getElementById('dashboard-level-badge');
    const rankEl  = document.getElementById('dashboard-rank-title');
    const xpBarEl = document.getElementById('dashboard-xp-bar');
    const xpTextEl = document.getElementById('dashboard-xp-text');
    const totalEl  = document.getElementById('dashboard-total-strength');

    if (badgeEl) badgeEl.textContent = `L${level}`;
    if (rankEl)  rankEl.textContent  = rank;
    if (xpBarEl) xpBarEl.style.width = `${progressPct}%`;
    if (xpTextEl) xpTextEl.textContent = `${Math.round(progressPct)} / 100 kg to L${level + 1}`;
    if (totalEl)  totalEl.textContent = `Total Lifted: ${Math.round(totalStrength)} kg`;

    // Sidebar avatar & role
    const avatarEl = document.getElementById('sidebar-avatar');
    const sidebarLvEl = document.getElementById('sidebar-level');
    if (avatarEl) avatarEl.textContent = `L${level}`;
    if (sidebarLvEl) sidebarLvEl.textContent = `${rank} — Lv.${level}`;

    // Detect level up vs previous render
    if (level > state.lastKnownLevel) {
        state.lastKnownLevel = level;
        saveToLocalStorage('level');
        triggerLevelUp(level, rank);
    }
}

// Trigger the cinematic Level Up overlay + particles
function triggerLevelUp(level, rank) {
    const overlay = document.getElementById('levelup-overlay');
    if (!overlay) return;

    document.getElementById('levelup-badge-num').textContent = `L${level}`;
    document.getElementById('levelup-rank-name').textContent  = rank;

    // Spawn confetti particles
    const particleContainer = document.getElementById('levelup-particles');
    particleContainer.innerHTML = '';
    const colors = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#fff'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * 360;
        const dist  = 80 + Math.random() * 120;
        const tx = Math.cos(angle * Math.PI / 180) * dist;
        const ty = Math.sin(angle * Math.PI / 180) * dist;
        p.style.cssText = `
            left: 50%; top: 50%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            --tx: ${tx}px; --ty: ${ty}px;
            animation-delay: ${Math.random() * 0.3}s;
        `;
        particleContainer.appendChild(p);
    }

    overlay.classList.add('active');

    // Spawn floating +LVL UP label near the workout log button
    const floater = document.createElement('div');
    floater.className = 'xp-float';
    floater.textContent = `⚡ Level ${level}!`;
    floater.style.left = `${window.innerWidth / 2 - 50}px`;
    floater.style.top  = `${window.innerHeight / 2}px`;
    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1600);
}

// Calculate Stats
function renderStats() {
    const sortedWeights = [...state.weightLogs].sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime()));
    const currentWeightEl = document.getElementById('stat-current-weight');
    const weightChangeEl = document.getElementById('stat-weight-change');
    const goalProgressEl = document.getElementById('stat-goal-progress');
    const targetDiffEl = document.getElementById('stat-target-diff');
    const logCountEl = document.getElementById('stat-log-count');
    const streakEl = document.getElementById('stat-workout-streak');

    logCountEl.textContent = state.weightLogs.length + state.workoutLogs.length;

    if (sortedWeights.length > 0) {
        const latest = sortedWeights[sortedWeights.length - 1].weight;
        currentWeightEl.textContent = `${latest.toFixed(1)} kg`;
        
        if (sortedWeights.length > 1) {
            const previous = sortedWeights[sortedWeights.length - 2].weight;
            const diff = latest - previous;
            const sign = diff > 0 ? '+' : '';
            const colorClass = diff <= 0 ? 'down' : 'up';
            
            weightChangeEl.className = `stat-change ${colorClass}`;
            weightChangeEl.innerHTML = `<span>${sign}${diff.toFixed(1)} kg vs last week</span>`;
        } else {
            weightChangeEl.className = 'stat-change neutral';
            weightChangeEl.innerHTML = '<span>1 entry logged</span>';
        }

        const startWeight = sortedWeights[0].weight;
        const target = state.weightGoal;
        targetDiffEl.textContent = `Target: ${target.toFixed(1)} kg`;
        
        if (startWeight === target) {
            goalProgressEl.textContent = '100%';
        } else {
            const totalChangeNeeded = startWeight - target;
            const achievedChange = startWeight - latest;
            
            let progressPct = (achievedChange / totalChangeNeeded) * 100;
            if (progressPct < 0) progressPct = 0;
            if (progressPct > 100) progressPct = 100;
            
            goalProgressEl.textContent = `${progressPct.toFixed(0)}%`;
        }
    } else {
        currentWeightEl.textContent = '--';
        weightChangeEl.className = 'stat-change neutral';
        weightChangeEl.innerHTML = '<span>No logs yet</span>';
        goalProgressEl.textContent = '--';
        targetDiffEl.textContent = `Target: ${state.weightGoal.toFixed(1)} kg`;
    }

    const workoutDates = [...new Set(state.workoutLogs.map(w => w.date))].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    if (workoutDates.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        let expectedDate = new Date(workoutDates[0]);
        const timeDiff = Math.abs(new Date(todayStr) - expectedDate);
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
            streak = 1;
            for (let i = 1; i < workoutDates.length; i++) {
                const nextDate = new Date(workoutDates[i]);
                const dayDifference = (expectedDate - nextDate) / (1000 * 60 * 60 * 24);
                if (dayDifference === 1) {
                    streak++;
                    expectedDate = nextDate;
                } else if (dayDifference > 1) {
                    break;
                }
            }
        }
    }
    streakEl.textContent = `${streak} ${streak === 1 ? 'Day' : 'Days'}`;
}

// Render Weight Chart
function renderCharts() {
    const canvas = document.getElementById('weightOverviewChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const filter = document.getElementById('chart-filter-select').value;
    
    let sortedWeights = [...state.weightLogs].sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime()));
    
    if (filter !== 'all') {
        const limitDays = parseInt(filter);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - limitDays);
        sortedWeights = sortedWeights.filter(entry => new Date(entry.date) >= cutoffDate);
    }

    const labels = sortedWeights.map(entry => {
        const d = new Date(entry.date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });
    const weights = sortedWeights.map(entry => entry.weight);
    const targets = Array(labels.length).fill(state.weightGoal);

    if (weightChart) {
        weightChart.destroy();
    }

    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: weights,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#a855f7',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 7
                },
                {
                    label: 'Target Goal',
                    data: targets,
                    borderColor: 'rgba(6, 182, 212, 0.6)',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#9ca3af',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans' } }
                }
            }
        }
    });
}

// Render Lists & Tables
function renderWeightHistory() {
    const tbody = document.getElementById('weight-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortedWeights = [...state.weightLogs].sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));

    sortedWeights.forEach(entry => {
        const tr = document.createElement('tr');
        let diffText = '-';
        let diffClass = '';
        
        const chronological = [...state.weightLogs].sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime()));
        const idx = chronological.findIndex(w => w.id === entry.id);
        if (idx > 0) {
            const diff = entry.weight - chronological[idx - 1].weight;
            const sign = diff > 0 ? '+' : '';
            diffText = `${sign}${diff.toFixed(1)} kg`;
            diffClass = diff <= 0 ? 'stat-change down' : 'stat-change up';
        }

        let displayDate = entry.date;
        if (entry.timestamp) {
            const timeObj = new Date(entry.timestamp);
            const timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            displayDate = `${entry.date} at ${timeStr}`;
        }

        tr.innerHTML = `
            <td style="font-weight: 600;">${displayDate}</td>
            <td>${entry.weight.toFixed(1)} kg</td>
            <td class="${diffClass}">${diffText}</td>
            <td>
                <button class="btn-delete" data-id="${entry.id}">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            state.weightLogs = state.weightLogs.filter(w => w.id !== id);
            saveToLocalStorage('weightLogs');
            renderAll();
        });
    });
}

function renderWorkoutHistory() {
    const tbody = document.getElementById('workout-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortedWorkouts = [...state.workoutLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedWorkouts.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${entry.date}</td>
            <td>${entry.exercise}</td>
            <td>${entry.sets || '-'} × ${entry.reps || '-'}</td>
            <td>${entry.load || '-'}</td>
            <td>
                <button class="btn-delete" data-id="${entry.id}">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            state.workoutLogs = state.workoutLogs.filter(w => w.id !== id);
            saveToLocalStorage('workouts');
            renderAll();
        });
    });
}

function renderWorkoutSnippet() {
    const listEl = document.getElementById('workout-snippet-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayWorkouts = state.workoutLogs.filter(w => w.date === todayStr);

    if (todayWorkouts.length === 0) {
        listEl.innerHTML = '<p style="color: var(--text-muted);">No workouts logged today yet.</p>';
        return;
    }

    todayWorkouts.forEach(w => {
        const div = document.createElement('div');
        div.className = 'workout-item-card';
        div.innerHTML = `
            <div>
                <strong style="display:block; color:var(--text-primary);">${w.exercise}</strong>
                <span style="font-size:0.8rem; color:var(--text-secondary);">${w.sets} Sets × ${w.reps} Reps</span>
            </div>
            <span style="font-size:0.9rem; font-weight:700; color:var(--accent-secondary);">${w.load}</span>
        `;
        listEl.appendChild(div);
    });
}

// Workout Plans Rendering
function renderPlansRoster() {
    const container = document.getElementById('plans-roster-list');
    if (!container) return;
    container.innerHTML = '';

    state.workoutPlans.forEach(plan => {
        const planCard = document.createElement('div');
        planCard.className = 'plan-card';
        planCard.innerHTML = `
            <div class="plan-info">
                <strong style="font-size: 1.1rem; font-family: var(--font-heading); color: #fff;">${plan.name}</strong>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">${plan.days.length} Workout Days</span>
            </div>
            <div class="plan-actions">
                <button class="btn-secondary btn-view-plan" data-id="${plan.id}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">View</button>
            </div>
        `;
        container.appendChild(planCard);
    });

    // Wire buttons
    container.querySelectorAll('.btn-view-plan').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            showPlanDetails(id);
        });
    });
}

function showPlanDetails(planId) {
    const plan = state.workoutPlans.find(p => p.id === planId);
    if (!plan) return;

    state.activePlanId = planId;

    // Toggle panels
    document.getElementById('plan-editor-placeholder').style.display = 'none';
    document.getElementById('plan-editor-form-wrapper').style.display = 'none';
    
    const viewer = document.getElementById('plan-viewer-wrapper');
    viewer.style.display = 'block';

    document.getElementById('plan-view-name').textContent = plan.name;
    document.getElementById('plan-view-tag').textContent = `${plan.days.length} Training Split`;

    const daysListContainer = document.getElementById('plan-view-days-list');
    daysListContainer.innerHTML = '';

    plan.days.forEach((day, dayIdx) => {
        const dayBox = document.createElement('div');
        dayBox.className = 'day-split-box';
        
        let exercisesHTML = '';
        day.exercises.forEach(ex => {
            exercisesHTML += `
                <div class="day-exercise-item">
                    <span>${ex.name}</span>
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">${ex.sets} sets × ${ex.reps}</span>
                </div>
            `;
        });

        dayBox.innerHTML = `
            <div class="day-split-header">
                <strong style="color: var(--accent-secondary); font-family: var(--font-heading);">${day.name}</strong>
                <button class="btn-primary btn-start-day-workout" data-day-index="${dayIdx}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; box-shadow: none;">Log This Day</button>
            </div>
            <div class="day-exercise-list">
                ${exercisesHTML || '<p style="color: var(--text-muted); font-size: 0.85rem;">No exercises planned</p>'}
            </div>
        `;
        daysListContainer.appendChild(dayBox);
    });

    // Start Day Workout wire-up
    daysListContainer.querySelectorAll('.btn-start-day-workout').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayIdx = parseInt(btn.getAttribute('data-day-index'));
            const selectedDay = plan.days[dayIdx];
            
            // Switch view to Workouts logger
            document.querySelector('.sidebar-menu .menu-item[data-view="workouts"]').click();
            
            // Fill session logger form fields with the first exercise
            if (selectedDay.exercises.length > 0) {
                const ex = selectedDay.exercises[0];
                document.getElementById('workout-name').value = ex.name;
                document.getElementById('workout-sets').value = ex.sets;
                document.getElementById('workout-reps').value = ex.reps;
                document.getElementById('workout-load').value = 'Bodyweight';
                
                alert(`Loaded details for "${selectedDay.name}". First exercise "${ex.name}" pre-filled!`);
            }
        });
    });
}

// Navigation / Switch Views
function setupEventListeners() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const views = document.querySelectorAll('.app-view');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-subtitle');
    const globalActionBtn = document.getElementById('btn-global-action');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const selectedView = item.getAttribute('data-view');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${selectedView}`) {
                    view.classList.add('active');
                }
            });

            // Title updates
            if (selectedView === 'dashboard') {
                viewTitle.textContent = 'Dashboard Overview';
                viewSubtitle.textContent = 'Track your physical transformation progress and daily workouts.';
                globalActionBtn.style.display = 'flex';
                globalActionBtn.textContent = 'Log New Weight';
            } else if (selectedView === 'weight') {
                viewTitle.textContent = 'Weight Tracker';
                viewSubtitle.textContent = 'Analyze changes, set goals and maintain logs.';
                globalActionBtn.style.display = 'flex';
                globalActionBtn.textContent = 'Quick Weight Log';
            } else if (selectedView === 'workouts') {
                viewTitle.textContent = 'Workout Session Logger';
                viewSubtitle.textContent = 'Log sets, reps, weight, and track strength trends.';
                globalActionBtn.style.display = 'none';
            } else if (selectedView === 'plans') {
                viewTitle.textContent = 'Workout Plans & Roster';
                viewSubtitle.textContent = 'Create customized routines or select standard multi-day fitness splits.';
                globalActionBtn.style.display = 'none';
            } else if (selectedView === 'tools') {
                viewTitle.textContent = 'Fitness Calculators';
                viewSubtitle.textContent = 'Discover your body mass index and estimated caloric needs.';
                globalActionBtn.style.display = 'none';
            }
        });
    });

    globalActionBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    // Modal
    const modal = document.getElementById('quick-log-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Level Up overlay close
    const levelupOverlay = document.getElementById('levelup-overlay');
    const levelupCloseBtn = document.getElementById('btn-levelup-close');
    if (levelupCloseBtn) {
        levelupCloseBtn.addEventListener('click', () => {
            levelupOverlay.classList.remove('active');
        });
    }
    if (levelupOverlay) {
        levelupOverlay.addEventListener('click', (e) => {
            if (e.target === levelupOverlay) levelupOverlay.classList.remove('active');
        });
    }

    // Filter Chart
    document.getElementById('chart-filter-select').addEventListener('change', renderCharts);

    // Form submissions
    document.getElementById('weight-log-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('weight-input').value);
        const date = document.getElementById('weight-date').value;
        const target = parseFloat(document.getElementById('weight-target-input').value);

        if (target) {
            state.weightGoal = target;
            localStorage.setItem(namespacedKey('weightGoal'), target);
        }

        const now = new Date();
        const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const timestamp = new Date(date + 'T' + timePart).getTime() || Date.now();

        state.weightLogs.push({ id: 'w_' + Date.now(), date, weight, timestamp });
        saveToLocalStorage('weightLogs');
        renderAll();
        document.getElementById('weight-input').value = '';
    });

    document.getElementById('quick-log-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('quick-weight-input').value);
        const date = document.getElementById('quick-weight-date').value;

        const now = new Date();
        const timePart = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const timestamp = new Date(date + 'T' + timePart).getTime() || Date.now();

        state.weightLogs.push({ id: 'w_' + Date.now(), date, weight, timestamp });
        saveToLocalStorage('weightLogs');
        renderAll();
        modal.classList.remove('active');
        document.getElementById('quick-weight-input').value = '';
    });

    document.getElementById('workout-log-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const exercise = document.getElementById('workout-name').value;
        const sets = parseInt(document.getElementById('workout-sets').value) || 0;
        const reps = document.getElementById('workout-reps').value;
        const load = document.getElementById('workout-load').value;
        const date = document.getElementById('workout-date-input').value;

        state.workoutLogs.push({ id: 't_' + Date.now(), date, exercise, sets, reps, load });
        saveToLocalStorage('workouts');
        renderAll();

        document.getElementById('workout-name').value = '';
        document.getElementById('workout-sets').value = '';
        document.getElementById('workout-reps').value = '';
        document.getElementById('workout-load').value = '';
    });

    // Plans editor actions
    document.getElementById('btn-show-plan-creator').addEventListener('click', () => {
        document.getElementById('plan-editor-placeholder').style.display = 'none';
        document.getElementById('plan-viewer-wrapper').style.display = 'none';
        document.getElementById('plan-editor-form-wrapper').style.display = 'block';

        // Clear editor fields
        document.getElementById('plan-name-input').value = '';
        editorDaysList = [];
        renderEditorDays();
    });

    document.getElementById('btn-cancel-plan-edit').addEventListener('click', () => {
        document.getElementById('plan-editor-form-wrapper').style.display = 'none';
        document.getElementById('plan-editor-placeholder').style.display = 'block';
    });

    document.getElementById('btn-editor-add-day').addEventListener('click', () => {
        const dayNum = editorDaysList.length + 1;
        editorDaysList.push({
            name: `Day ${dayNum}: Dynamic Work`,
            exercises: [{ name: '', sets: 3, reps: '10' }]
        });
        renderEditorDays();
    });

    // Save customized routine
    document.getElementById('custom-plan-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const planName = document.getElementById('plan-name-input').value;
        
        // Build plan object from input rows
        const planDays = [];
        const dayCards = document.querySelectorAll('.editor-day-card');
        
        dayCards.forEach((dayCard, dayIdx) => {
            const dayName = dayCard.querySelector('.day-name-field').value;
            const exRows = dayCard.querySelectorAll('.editor-exercise-row');
            const exercises = [];
            
            exRows.forEach(row => {
                const name = row.querySelector('.ex-name-field').value;
                const sets = parseInt(row.querySelector('.ex-sets-field').value) || 3;
                const reps = row.querySelector('.ex-reps-field').value || '10';
                
                if (name.trim()) {
                    exercises.push({ name, sets, reps });
                }
            });

            planDays.push({ name: dayName, exercises });
        });

        if (planDays.length === 0) {
            alert('Please add at least 1 day to your plan.');
            return;
        }

        const newPlan = {
            id: 'p_' + Date.now(),
            name: planName,
            days: planDays
        };

        state.workoutPlans.push(newPlan);
        saveToLocalStorage('plans');
        renderPlansRoster();

        // Switch to detail view of new plan
        showPlanDetails(newPlan.id);
    });

    // Delete current plan
    document.getElementById('btn-delete-current-plan').addEventListener('click', () => {
        if (!state.activePlanId) return;
        if (!confirm('Are you sure you want to delete this workout routine?')) return;

        state.workoutPlans = state.workoutPlans.filter(p => p.id !== state.activePlanId);
        saveToLocalStorage('plans');
        renderPlansRoster();

        // Reset viewer
        document.getElementById('plan-viewer-wrapper').style.display = 'none';
        document.getElementById('plan-editor-placeholder').style.display = 'block';
        state.activePlanId = null;
    });

    // Calculators
    document.getElementById('btn-calc-bmi').addEventListener('click', () => {
        const height = parseFloat(document.getElementById('bmi-height').value) / 100;
        const weight = parseFloat(document.getElementById('bmi-weight').value);
        if (!height || !weight) return;

        const bmi = weight / (height * height);
        document.getElementById('bmi-value').textContent = bmi.toFixed(1);
        
        let category = 'Normal Weight';
        let color = '#10b981';
        if (bmi < 18.5) { category = 'Underweight'; color = '#3b82f6'; }
        else if (bmi < 30 && bmi >= 25) { category = 'Overweight'; color = '#f59e0b'; }
        else if (bmi >= 30) { category = 'Obese'; color = '#ef4444'; }
        
        document.getElementById('bmi-category').textContent = category;
        document.getElementById('bmi-category').style.color = color;
        document.getElementById('bmi-result-card').style.display = 'block';
    });

    document.getElementById('btn-calc-calories').addEventListener('click', () => {
        const age = parseInt(document.getElementById('calorie-age').value);
        const gender = document.getElementById('calorie-gender').value;
        const activity = parseFloat(document.getElementById('calorie-activity').value);
        const lastWeight = state.weightLogs.length > 0 
            ? [...state.weightLogs].sort((a,b)=>new Date(a.date)-new Date(b.date))[state.weightLogs.length-1].weight 
            : 70;

        if (!age) return;
        let bmr = gender === 'male' 
            ? 88.362 + (13.397 * lastWeight) + (4.799 * 175) - (5.677 * age)
            : 447.593 + (9.247 * lastWeight) + (3.098 * 175) - (4.330 * age);

        document.getElementById('calorie-val').textContent = Math.round(bmr * activity);
        document.getElementById('calorie-result-card').style.display = 'block';
    });

    // Backup & Import
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-export-data').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `pulsefit_backup_${state.username || 'user'}.json`;
        a.click();
    });

    document.getElementById('btn-import-data').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                state.weightLogs = imported.weightLogs || [];
                state.workoutLogs = imported.workoutLogs || [];
                state.workoutPlans = imported.workoutPlans || DEFAULT_PLANS;
                if (imported.weightGoal) {
                    state.weightGoal = parseFloat(imported.weightGoal);
                    localStorage.setItem(namespacedKey('weightGoal'), state.weightGoal);
                }

                saveToLocalStorage('weightLogs');
                saveToLocalStorage('workouts');
                saveToLocalStorage('plans');
                renderAll();
                alert('Import successful!');
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
}

// Generate Day blocks in Custom Plan Creator Form
function renderEditorDays() {
    const container = document.getElementById('editor-days-container');
    container.innerHTML = '';

    editorDaysList.forEach((day, dayIdx) => {
        const card = document.createElement('div');
        card.className = 'editor-day-card';
        
        card.innerHTML = `
            <button type="button" class="btn-delete btn-remove-day" data-day-idx="${dayIdx}" style="position: absolute; top: 10px; right: 10px;">&times;</button>
            <div class="editor-day-header">
                <input type="text" class="day-name-field" style="width: 100%; font-weight: 700;" value="${day.name}" required>
            </div>
            <div class="editor-exercise-rows-container">
                <!-- Exercises in day -->
            </div>
            <button type="button" class="btn-secondary btn-editor-add-exercise" data-day-idx="${dayIdx}" style="font-size:0.8rem; padding:0.3rem 0.6rem;">+ Add Exercise</button>
        `;

        const rowsContainer = card.querySelector('.editor-exercise-rows-container');
        day.exercises.forEach((ex, exIdx) => {
            const row = document.createElement('div');
            row.className = 'editor-exercise-row';
            row.innerHTML = `
                <input type="text" class="ex-name-field" placeholder="Exercise name" value="${ex.name}" required>
                <input type="number" class="ex-sets-field" placeholder="Sets" value="${ex.sets}" min="1">
                <input type="text" class="ex-reps-field" placeholder="Reps" value="${ex.reps}">
                <button type="button" class="btn-delete btn-remove-exercise" data-day-idx="${dayIdx}" data-ex-idx="${exIdx}">&times;</button>
            `;
            rowsContainer.appendChild(row);
        });

        container.appendChild(card);
    });

    // Wire up Day Card events
    container.querySelectorAll('.btn-remove-day').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-day-idx'));
            editorDaysList.splice(idx, 1);
            renderEditorDays();
        });
    });

    container.querySelectorAll('.btn-editor-add-exercise').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayIdx = parseInt(btn.getAttribute('data-day-idx'));
            editorDaysList[dayIdx].exercises.push({ name: '', sets: 3, reps: '10' });
            renderEditorDays();
        });
    });

    container.querySelectorAll('.btn-remove-exercise').forEach(btn => {
        btn.addEventListener('click', () => {
            const dayIdx = parseInt(btn.getAttribute('data-day-idx'));
            const exIdx = parseInt(btn.getAttribute('data-ex-idx'));
            editorDaysList[dayIdx].exercises.splice(exIdx, 1);
            renderEditorDays();
        });
    });
}
