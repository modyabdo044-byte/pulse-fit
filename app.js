// PulseFit JS Logic

// State management
let state = {
    username: null, // no accounts/passwords — this is just a storage namespace the person types in
    weightLogs: [], // Array of { id, date, weight }
    weightGoal: 75.0,
    workoutLogs: [], // Array of { id, date, exercise, sets, reps, load }
    workoutPlans: [], // Array of { id, name, days: [ { name, exercises: [ { name, sets, reps } ] } ] }
    activePlanId: null,
    lastKnownLevel: 1, // tracks level for level-up detection
    nutritionLogs: [], // Array of { id, date, mealType, name, calories, protein, carbs, fat }
    nutritionGoals: { calories: 2200, protein: 150, carbs: 220, fat: 70 }
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

// =====================================================
// EXERCISE LIBRARY — static reference data (not user data)
// =====================================================
const EXERCISE_LIBRARY = {
    "Chest": [
        {
            name: "Barbell Bench Press",
            steps: [
                "Lie on the bench with your eyes roughly under the bar.",
                "Grip the bar slightly wider than shoulder-width.",
                "Unrack it and lower it slowly to your mid-chest.",
                "Press back up until your arms are fully extended, without locking out aggressively."
            ],
            tips: [
                "Keep your feet flat on the floor and drive them down for stability.",
                "Squeeze your shoulder blades together before you unrack.",
                "Control the descent — don't let the bar drop.",
                "Use a spotter for heavy sets."
            ]
        },
        {
            name: "Push-Up",
            steps: [
                "Start in a plank with hands slightly wider than shoulders.",
                "Keep your body in a straight line from head to heels.",
                "Lower your chest toward the floor by bending your elbows.",
                "Push back up to the starting position."
            ],
            tips: [
                "Don't let your hips sag or pike upward.",
                "Keep elbows at roughly a 45° angle from your torso, not flared straight out.",
                "Fully extend your arms at the top without locking hard.",
                "Elevate your feet on a box to increase difficulty."
            ]
        },
        {
            name: "Incline Dumbbell Press",
            steps: [
                "Set a bench to a 30–45° incline.",
                "Hold a dumbbell in each hand at shoulder height, palms facing forward.",
                "Press the dumbbells up until arms are extended.",
                "Lower with control back to the starting position."
            ],
            tips: [
                "A steeper incline shifts emphasis to the upper chest/shoulders.",
                "Avoid banging the dumbbells together at the top — control the path.",
                "Keep your wrists stacked directly over your elbows.",
                "Don't flare your elbows all the way out to protect your shoulders."
            ]
        },
        {
            name: "Cable Fly",
            steps: [
                "Set both pulleys to chest height and grab a handle in each hand.",
                "Step forward with a slight forward lean and soft bend in the elbows.",
                "Bring your hands together in front of your chest in a hugging motion.",
                "Slowly return to the starting position, feeling a stretch across the chest."
            ],
            tips: [
                "Keep a consistent, slight bend in your elbows throughout.",
                "Focus on squeezing the chest at the peak rather than just moving weight.",
                "Don't let the weights slam at the bottom of the stack.",
                "Adjust pulley height to target upper vs lower chest."
            ]
        }
    ],
    "Back": [
        {
            name: "Deadlift",
            steps: [
                "Stand with feet hip-width apart, bar over mid-foot.",
                "Hinge at the hips and bend knees to grip the bar just outside your legs.",
                "Flatten your back, brace your core, and lift by driving through the floor.",
                "Stand tall at the top, then lower the bar back down with control."
            ],
            tips: [
                "Keep the bar close to your body throughout the whole lift.",
                "Don't round your lower back — brace like you're about to be punched in the stomach.",
                "Drive through your heels/mid-foot, not your toes.",
                "Start light to groove the pattern before adding weight."
            ]
        },
        {
            name: "Pull-Up",
            steps: [
                "Hang from a bar with hands slightly wider than shoulder-width, palms facing away.",
                "Pull your body up by driving your elbows down and back.",
                "Get your chin over the bar.",
                "Lower back down under control to a full hang."
            ],
            tips: [
                "Avoid excessive kipping/swinging if you're training strict form.",
                "Think 'pull your chest to the bar' rather than just your chin.",
                "Use a resistance band under your feet for assistance if needed.",
                "Fully extend your arms at the bottom for full range of motion."
            ]
        },
        {
            name: "Barbell Row",
            steps: [
                "Hinge at the hips with a flat back, torso roughly 45° to the floor.",
                "Grip the bar just outside your legs.",
                "Pull the bar toward your lower ribcage, driving elbows back.",
                "Lower it back down with control."
            ],
            tips: [
                "Keep your core braced — don't let your torso bounce to generate momentum.",
                "Squeeze your shoulder blades together at the top of the row.",
                "Keep your neck in a neutral position, not craned up.",
                "Choose a weight you can control for the full range of motion."
            ]
        },
        {
            name: "Lat Pulldown",
            steps: [
                "Sit down and grip the bar wider than shoulder-width.",
                "Lean back slightly and pull the bar down to your upper chest.",
                "Squeeze your lats at the bottom of the movement.",
                "Slowly let the bar rise back up under control."
            ],
            tips: [
                "Avoid yanking the bar down using body momentum.",
                "Think about pulling with your elbows, not just your hands.",
                "Keep your chest up rather than rounding forward.",
                "Don't lean back excessively — a slight lean is enough."
            ]
        }
    ],
    "Legs": [
        {
            name: "Barbell Squat",
            steps: [
                "Set the bar on your upper traps (or a bit lower for low-bar).",
                "Stand with feet shoulder-width apart, toes slightly turned out.",
                "Break at the hips and knees together, descending until thighs are at least parallel.",
                "Drive back up through your whole foot to standing."
            ],
            tips: [
                "Keep your chest up and core braced throughout.",
                "Track your knees in line with your toes — avoid caving inward.",
                "Go only as deep as your mobility allows with good form.",
                "Use safety bars/pins when squatting heavy alone."
            ]
        },
        {
            name: "Romanian Deadlift",
            steps: [
                "Hold a barbell or dumbbells in front of your thighs.",
                "With a slight knee bend, hinge at the hips and push them backward.",
                "Lower the weight along your legs until you feel a stretch in your hamstrings.",
                "Drive your hips forward to return to standing."
            ],
            tips: [
                "Keep the bar/dumbbells close to your legs the whole time.",
                "Keep your back flat — this is a hip hinge, not a squat.",
                "Stop the descent once your hamstring flexibility limit is reached.",
                "Focus on the hamstring stretch and glute squeeze, not just moving weight."
            ]
        },
        {
            name: "Walking Lunge",
            steps: [
                "Stand tall, holding dumbbells at your sides or a bar on your back.",
                "Step forward into a lunge, lowering your back knee toward the floor.",
                "Push through your front heel to bring your back foot forward into the next step.",
                "Continue alternating legs as you move forward."
            ],
            tips: [
                "Keep your torso upright rather than leaning forward.",
                "Take a long enough step so your front knee doesn't shoot past your toes.",
                "Control the descent instead of dropping into each rep.",
                "Start bodyweight-only until the pattern feels stable."
            ]
        },
        {
            name: "Leg Press",
            steps: [
                "Sit in the machine with feet shoulder-width apart on the platform.",
                "Release the safety and lower the platform by bending your knees toward your chest.",
                "Press through your feet to extend your legs back out.",
                "Stop just short of locking your knees out fully."
            ],
            tips: [
                "Don't let your lower back round off the pad at the bottom.",
                "Avoid locking your knees hard at the top of each rep.",
                "Keep your feet flat — don't let heels lift off the platform.",
                "Adjust foot position higher on the platform to emphasize glutes/hamstrings."
            ]
        }
    ],
    "Shoulders": [
        {
            name: "Overhead Press",
            steps: [
                "Hold a barbell at shoulder height with hands just outside shoulder-width.",
                "Brace your core and glutes.",
                "Press the bar straight overhead, moving your head slightly back to let it pass.",
                "Lower back to the starting position with control."
            ],
            tips: [
                "Avoid excessive lower-back arching — keep your ribs down.",
                "Press in a straight line, not out and around.",
                "Fully lock out your elbows at the top for a complete rep.",
                "Start with lighter weight to master the bar path."
            ]
        },
        {
            name: "Lateral Raise",
            steps: [
                "Hold a dumbbell in each hand at your sides.",
                "With a slight bend in your elbows, raise your arms out to the sides.",
                "Lift until your arms are roughly parallel to the floor.",
                "Lower back down with control."
            ],
            tips: [
                "Avoid swinging the weights using momentum.",
                "Lead with your elbows, not your hands.",
                "Use lighter weight than you think — this is a small, isolation movement.",
                "A very slight forward lean can help target the middle delt better."
            ]
        },
        {
            name: "Face Pull",
            steps: [
                "Set a cable at upper-chest to head height with a rope attachment.",
                "Pull the rope toward your face, splitting it apart as it approaches.",
                "Rotate your hands so your knuckles end up facing behind you.",
                "Slowly return to the starting position."
            ],
            tips: [
                "Keep your elbows high, roughly in line with your shoulders.",
                "Focus on squeezing your rear delts and upper back at the end range.",
                "Use a light-to-moderate weight — this is about control, not load.",
                "Great as a warm-up or shoulder-health accessory movement."
            ]
        },
        {
            name: "Arnold Press",
            steps: [
                "Sit holding dumbbells in front of your shoulders, palms facing you.",
                "Press upward while rotating your palms to face forward.",
                "Fully extend your arms overhead.",
                "Reverse the rotation as you lower back to the start."
            ],
            tips: [
                "Keep the movement smooth and controlled through the rotation.",
                "Don't flare your elbows out too wide at the bottom.",
                "Brace your core to avoid arching your lower back.",
                "Use a weight that lets you control the rotation cleanly."
            ]
        }
    ],
    "Arms": [
        {
            name: "Barbell Curl",
            steps: [
                "Stand holding a barbell with an underhand grip, shoulder-width apart.",
                "Keep your elbows pinned at your sides.",
                "Curl the bar up toward your shoulders.",
                "Lower back down slowly to full extension."
            ],
            tips: [
                "Avoid swinging your hips or back to help lift the weight.",
                "Keep your elbows still — they shouldn't drift forward.",
                "Squeeze at the top rather than just reaching the position.",
                "Control the lowering phase instead of dropping it."
            ]
        },
        {
            name: "Tricep Pushdown",
            steps: [
                "Stand facing a cable machine with a bar or rope attachment at chest height.",
                "Keep your elbows tucked at your sides.",
                "Push the attachment down until your arms are fully extended.",
                "Let it rise back up under control without letting elbows flare."
            ],
            tips: [
                "Keep your elbows fixed — only your forearms should move.",
                "Avoid leaning your whole body into the movement.",
                "Fully extend at the bottom to get the full triceps contraction.",
                "Slow the return phase down for more time under tension."
            ]
        },
        {
            name: "Hammer Curl",
            steps: [
                "Hold a dumbbell in each hand with palms facing your torso (neutral grip).",
                "Keep elbows pinned at your sides.",
                "Curl the dumbbells up while keeping the neutral grip throughout.",
                "Lower back down with control."
            ],
            tips: [
                "Don't rotate your wrists — that turns it into a regular curl.",
                "Keep your shoulders still; avoid using momentum from your upper back.",
                "This variation also builds forearm and grip strength.",
                "Alternate arms or do both together, whichever keeps form cleaner."
            ]
        },
        {
            name: "Skull Crusher",
            steps: [
                "Lie on a bench holding a barbell or EZ-bar with arms extended over your chest.",
                "Bend only at the elbows, lowering the bar toward your forehead.",
                "Keep your upper arms stationary and pointed at the ceiling.",
                "Extend your elbows to press the bar back to the start."
            ],
            tips: [
                "Keep your elbows from flaring outward as you lower the weight.",
                "Use a spotter or lighter weight until you're confident with the path.",
                "Lower toward your forehead or just behind your head, not your throat.",
                "Move slowly — this exercise punishes sloppy control."
            ]
        }
    ],
    "Core": [
        {
            name: "Plank",
            steps: [
                "Get into a forearm-supported plank position, elbows under shoulders.",
                "Keep your body in a straight line from head to heels.",
                "Brace your core and squeeze your glutes.",
                "Hold the position for the desired time."
            ],
            tips: [
                "Don't let your hips sag toward the floor or pike up high.",
                "Breathe steadily — don't hold your breath.",
                "Keep your neck neutral, looking at the floor, not straight ahead.",
                "Quality over duration — a shorter, tighter plank beats a long sloppy one."
            ]
        },
        {
            name: "Hanging Leg Raise",
            steps: [
                "Hang from a pull-up bar with arms fully extended.",
                "Keep a slight bend in your knees or legs straight for more difficulty.",
                "Raise your legs up until roughly parallel to the floor (or higher).",
                "Lower back down with control, avoiding a swing."
            ],
            tips: [
                "Avoid using momentum from swinging your whole body.",
                "Focus on curling your pelvis under at the top for full ab engagement.",
                "Bend your knees to make it easier while you build strength.",
                "Control the negative rather than letting your legs drop."
            ]
        },
        {
            name: "Cable Woodchopper",
            steps: [
                "Set a cable to high position and grab the handle with both hands.",
                "Stand side-on to the machine, feet shoulder-width apart.",
                "Rotate your torso and pull the handle diagonally down across your body.",
                "Return with control to the starting position."
            ],
            tips: [
                "Rotate through your torso and hips, not just your arms.",
                "Keep a slight bend in your knees to allow hip rotation.",
                "Perform equal sets on both sides.",
                "Start with lighter weight to nail the rotational pattern first."
            ]
        },
        {
            name: "Russian Twist",
            steps: [
                "Sit on the floor with knees bent, leaning back slightly to engage your core.",
                "Hold a weight or medicine ball with both hands.",
                "Rotate your torso to touch the weight to the floor on one side.",
                "Rotate to the other side and repeat."
            ],
            tips: [
                "Keep your chest up rather than rounding your back.",
                "Move slowly with control rather than swinging fast for reps.",
                "Lifting your feet off the floor increases difficulty.",
                "Focus on rotating from your torso, not just swinging your arms."
            ]
        }
    ]
};

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
    document.getElementById('nutrition-date').value = today;
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

    const mobileSwitchBtn = document.getElementById('mobile-btn-switch-user');
    if (mobileSwitchBtn) mobileSwitchBtn.addEventListener('click', switchUser);
}

function loginAsUser(name) {
    state.username = name;
    localStorage.setItem('pulsefit_last_username', name);

    loadData();

    document.getElementById('username-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'grid';

    const display = document.getElementById('sidebar-username-display');
    if (display) display.textContent = name;
    const mobileDisplay = document.getElementById('mobile-username-display');
    if (mobileDisplay) mobileDisplay.textContent = name;

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
    state.nutritionLogs = [];
    state.nutritionGoals = { calories: 2200, protein: 150, carbs: 220, fat: 70 };

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
    const savedNutritionLogs = localStorage.getItem(namespacedKey('nutritionLogs'));
    const savedNutritionGoals = localStorage.getItem(namespacedKey('nutritionGoals'));

    state.weightLogs = savedWeight ? JSON.parse(savedWeight) : [...DEFAULT_WEIGHT_LOGS];
    state.weightGoal = savedGoal ? parseFloat(savedGoal) : 75.0;
    state.workoutLogs = savedWorkouts ? JSON.parse(savedWorkouts) : [...DEFAULT_WORKOUTS];
    state.workoutPlans = savedPlans ? JSON.parse(savedPlans) : DEFAULT_PLANS.map(p => ({ ...p }));
    state.lastKnownLevel = savedLevel ? parseInt(savedLevel) : 1;
    state.nutritionLogs = savedNutritionLogs ? JSON.parse(savedNutritionLogs) : [];
    state.nutritionGoals = savedNutritionGoals ? JSON.parse(savedNutritionGoals) : { calories: 2200, protein: 150, carbs: 220, fat: 70 };

    if (!savedWeight) saveToLocalStorage('weightLogs');
    if (!savedGoal) localStorage.setItem(namespacedKey('weightGoal'), state.weightGoal);
    if (!savedWorkouts) saveToLocalStorage('workouts');
    if (!savedPlans) saveToLocalStorage('plans');
    if (!savedNutritionLogs) saveToLocalStorage('nutritionLogs');
    if (!savedNutritionGoals) saveToLocalStorage('nutritionGoals');
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
    } else if (key === 'nutritionLogs') {
        localStorage.setItem(namespacedKey('nutritionLogs'), JSON.stringify(state.nutritionLogs));
    } else if (key === 'nutritionGoals') {
        localStorage.setItem(namespacedKey('nutritionGoals'), JSON.stringify(state.nutritionGoals));
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
    renderNutrition();
    renderBadges();
}

// =====================================================
// ACHIEVEMENT BADGES
// =====================================================
const BADGES = [
    { id: 'first_workout', icon: '🏋️', name: 'First Rep', description: 'Log your first workout session.',
      check: ctx => ctx.workoutCount >= 1 },
    { id: 'workouts_10', icon: '💪', name: 'Getting Started', description: 'Log 10 workout sessions.',
      check: ctx => ctx.workoutCount >= 10 },
    { id: 'workouts_50', icon: '🔥', name: 'Iron Habit', description: 'Log 50 workout sessions.',
      check: ctx => ctx.workoutCount >= 50 },
    { id: 'workouts_100', icon: '🏆', name: 'Century Club', description: 'Log 100 workout sessions.',
      check: ctx => ctx.workoutCount >= 100 },

    { id: 'first_weight', icon: '⚖️', name: 'First Weigh-In', description: 'Log your first body weight entry.',
      check: ctx => ctx.weightCount >= 1 },
    { id: 'weight_10', icon: '📊', name: 'Consistent Tracker', description: 'Log 10 body weight entries.',
      check: ctx => ctx.weightCount >= 10 },
    { id: 'weight_25', icon: '📈', name: 'Data Devotee', description: 'Log 25 body weight entries.',
      check: ctx => ctx.weightCount >= 25 },
    { id: 'goal_reached', icon: '🎯', name: 'Goal Getter', description: 'Reach your target weight goal.',
      check: ctx => ctx.goalProgressPct >= 100 },

    { id: 'streak_3', icon: '🔥', name: '3-Day Streak', description: 'Work out 3 days in a row.',
      check: ctx => ctx.streak >= 3 },
    { id: 'streak_7', icon: '🔥', name: 'Week Warrior', description: 'Work out 7 days in a row.',
      check: ctx => ctx.streak >= 7 },
    { id: 'streak_30', icon: '🔥', name: 'Unstoppable', description: 'Work out 30 days in a row.',
      check: ctx => ctx.streak >= 30 },

    { id: 'first_meal', icon: '🍎', name: 'First Meal Logged', description: 'Log your first meal in the Nutrition Tracker.',
      check: ctx => ctx.nutritionCount >= 1 },
    { id: 'meals_25', icon: '🥗', name: 'Nutrition Nerd', description: 'Log 25 meals in the Nutrition Tracker.',
      check: ctx => ctx.nutritionCount >= 25 },

    { id: 'plan_maker', icon: '📋', name: 'Plan Maker', description: 'Create your own custom workout plan.',
      check: ctx => ctx.customPlanCount >= 1 },

    { id: 'level_3', icon: '🥈', name: 'Iron Lifter', description: 'Reach Level 3.',
      check: ctx => ctx.level >= 3 },
    { id: 'level_6', icon: '🥇', name: 'Gym Warrior', description: 'Reach Level 6.',
      check: ctx => ctx.level >= 6 },
    { id: 'level_10', icon: '👑', name: 'Elite Athlete', description: 'Reach Level 10.',
      check: ctx => ctx.level >= 10 }
];

// Build the context object badge criteria are evaluated against
function computeBadgeContext() {
    const { level } = getLevelData(computeTotalStrength());
    const sortedWeights = [...state.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    let goalProgressPct = 0;
    if (sortedWeights.length > 0) {
        const startWeight = sortedWeights[0].weight;
        const latest = sortedWeights[sortedWeights.length - 1].weight;
        const target = state.weightGoal;
        if (startWeight === target) {
            goalProgressPct = 100;
        } else {
            const totalChangeNeeded = startWeight - target;
            const achievedChange = startWeight - latest;
            goalProgressPct = Math.max(0, Math.min(100, (achievedChange / totalChangeNeeded) * 100));
        }
    }

    return {
        workoutCount: state.workoutLogs.length,
        weightCount: state.weightLogs.length,
        nutritionCount: state.nutritionLogs.length,
        streak: computeWorkoutStreak(),
        level,
        goalProgressPct,
        customPlanCount: Math.max(0, state.workoutPlans.length - DEFAULT_PLANS.length)
    };
}

function renderBadges() {
    const grid = document.getElementById('badges-grid');
    const progressEl = document.getElementById('achievements-progress');
    if (!grid) return;

    const ctx = computeBadgeContext();
    let unlockedCount = 0;

    grid.innerHTML = BADGES.map(badge => {
        const unlocked = badge.check(ctx);
        if (unlocked) unlockedCount++;
        return `
            <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}" title="${escapeHtmlAttr(badge.description)}">
                <div class="badge-icon">${unlocked ? badge.icon : '🔒'}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.description}</div>
            </div>
        `;
    }).join('');

    if (progressEl) progressEl.textContent = `${unlockedCount} / ${BADGES.length} unlocked`;
}

// Minimal attribute-safe escaping for the title tooltip
function escapeHtmlAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}



// Parse numeric kg value from a string like '80kg', '80 kg', '80', 'Bodyweight'
function parseLoad(loadStr) {
    if (!loadStr) return 0;
    const lower = String(loadStr).toLowerCase();
    if (lower === 'bodyweight' || lower === 'bw') return 0;
    const match = lower.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

// =====================================================
// GAMIFICATION — Strength Total / Level / Rank System
// =====================================================

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

// Consecutive-day workout streak, counting back from today (or yesterday, if
// today has no log yet but yesterday's chain is still unbroken)
function computeWorkoutStreak() {
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
    return streak;
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

    // Mobile user bar mirrors the same info
    const mobileAvatarEl = document.getElementById('mobile-avatar');
    const mobileLvEl = document.getElementById('mobile-level');
    if (mobileAvatarEl) mobileAvatarEl.textContent = `L${level}`;
    if (mobileLvEl) mobileLvEl.textContent = `${rank} — Lv.${level}`;

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

    const streak = computeWorkoutStreak();
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

// Nutrition — today's summary bars + full food log table
function renderNutrition() {
    const goals = state.nutritionGoals;
    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = state.nutritionLogs.filter(l => l.date === today);

    const totals = todaysLogs.reduce((acc, l) => {
        acc.calories += Number(l.calories) || 0;
        acc.protein += Number(l.protein) || 0;
        acc.carbs += Number(l.carbs) || 0;
        acc.fat += Number(l.fat) || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const setBar = (key, unit, current, goal) => {
        const textEl = document.getElementById(`nutrition-${key}-text`);
        const barEl = document.getElementById(`nutrition-${key}-bar`);
        if (!textEl || !barEl) return;
        textEl.textContent = `${Math.round(current)} / ${goal} ${unit}`;
        const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
        barEl.style.width = `${pct}%`;
        barEl.classList.toggle('over', current > goal);
    };

    setBar('cal', 'kcal', totals.calories, goals.calories);
    setBar('protein', 'g', totals.protein, goals.protein);
    setBar('carbs', 'g', totals.carbs, goals.carbs);
    setBar('fat', 'g', totals.fat, goals.fat);

    const tbody = document.getElementById('nutrition-history-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortedLogs = [...state.nutritionLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedLogs.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 600;">${entry.date}</td>
            <td>${entry.mealType || '-'}</td>
            <td>${entry.name}</td>
            <td>${entry.calories || 0}</td>
            <td style="color: var(--text-secondary); font-size: 0.85rem;">${entry.protein || 0}g / ${entry.carbs || 0}g / ${entry.fat || 0}g</td>
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
            state.nutritionLogs = state.nutritionLogs.filter(l => l.id !== id);
            saveToLocalStorage('nutritionLogs');
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
// Exercise Library — populates the dropdown and renders selected exercise details
function setupExerciseLibrary() {
    const select = document.getElementById('exercise-select');
    if (!select) return;

    Object.keys(EXERCISE_LIBRARY).forEach(category => {
        const group = document.createElement('optgroup');
        group.label = category;
        EXERCISE_LIBRARY[category].forEach(ex => {
            const opt = document.createElement('option');
            opt.value = `${category}|||${ex.name}`;
            opt.textContent = ex.name;
            group.appendChild(opt);
        });
        select.appendChild(group);
    });

    select.addEventListener('change', () => {
        const detail = document.getElementById('exercise-detail');
        if (!select.value) {
            detail.style.display = 'none';
            return;
        }
        const [category, name] = select.value.split('|||');
        const ex = EXERCISE_LIBRARY[category].find(e => e.name === name);
        if (!ex) return;

        document.getElementById('exercise-detail-name').textContent = ex.name;
        document.getElementById('exercise-detail-category').textContent = category;

        const stepsList = document.getElementById('exercise-detail-steps');
        stepsList.innerHTML = ex.steps.map(s => `<li>${s}</li>`).join('');

        const tipsList = document.getElementById('exercise-detail-tips');
        tipsList.innerHTML = ex.tips.map(t => `<li>${t}</li>`).join('');

        detail.style.display = 'block';
    });
}

function setupEventListeners() {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item, .mobile-tabbar .mobile-tab-item');
    const views = document.querySelectorAll('.app-view');
    const viewTitle = document.getElementById('view-title');
    const viewSubtitle = document.getElementById('view-subtitle');
    const globalActionBtn = document.getElementById('btn-global-action');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const selectedView = item.getAttribute('data-view');

            // Sync active state across BOTH the desktop sidebar and mobile tab bar
            menuItems.forEach(mi => {
                mi.classList.toggle('active', mi.getAttribute('data-view') === selectedView);
            });

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
            } else if (selectedView === 'nutrition') {
                viewTitle.textContent = 'Nutrition Tracker';
                viewSubtitle.textContent = 'Log meals and keep an eye on calories and macros.';
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

    // Nutrition — log food
    document.getElementById('nutrition-log-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('nutrition-food-name').value;
        const mealType = document.getElementById('nutrition-meal-type').value;
        const calories = parseFloat(document.getElementById('nutrition-calories').value) || 0;
        const protein = parseFloat(document.getElementById('nutrition-protein').value) || 0;
        const carbs = parseFloat(document.getElementById('nutrition-carbs').value) || 0;
        const fat = parseFloat(document.getElementById('nutrition-fat').value) || 0;
        const date = document.getElementById('nutrition-date').value;

        state.nutritionLogs.push({ id: 'n_' + Date.now(), date, mealType, name, calories, protein, carbs, fat });
        saveToLocalStorage('nutritionLogs');
        renderAll();

        document.getElementById('nutrition-food-name').value = '';
        document.getElementById('nutrition-calories').value = '';
        document.getElementById('nutrition-protein').value = '';
        document.getElementById('nutrition-carbs').value = '';
        document.getElementById('nutrition-fat').value = '';
    });

    // Nutrition — edit goals modal
    const goalsModal = document.getElementById('nutrition-goals-modal');
    document.getElementById('btn-edit-nutrition-goals').addEventListener('click', () => {
        document.getElementById('goal-calories').value = state.nutritionGoals.calories;
        document.getElementById('goal-protein').value = state.nutritionGoals.protein;
        document.getElementById('goal-carbs').value = state.nutritionGoals.carbs;
        document.getElementById('goal-fat').value = state.nutritionGoals.fat;
        goalsModal.classList.add('active');
    });
    document.getElementById('nutrition-goals-modal-close').addEventListener('click', () => {
        goalsModal.classList.remove('active');
    });
    goalsModal.addEventListener('click', (e) => {
        if (e.target === goalsModal) goalsModal.classList.remove('active');
    });
    document.getElementById('nutrition-goals-form').addEventListener('submit', (e) => {
        e.preventDefault();
        state.nutritionGoals = {
            calories: parseFloat(document.getElementById('goal-calories').value) || 0,
            protein: parseFloat(document.getElementById('goal-protein').value) || 0,
            carbs: parseFloat(document.getElementById('goal-carbs').value) || 0,
            fat: parseFloat(document.getElementById('goal-fat').value) || 0
        };
        saveToLocalStorage('nutritionGoals');
        renderAll();
        goalsModal.classList.remove('active');
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

    // Exercise Library
    setupExerciseLibrary();

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
                state.nutritionLogs = imported.nutritionLogs || [];
                if (imported.nutritionGoals) {
                    state.nutritionGoals = imported.nutritionGoals;
                    saveToLocalStorage('nutritionGoals');
                }
                if (imported.weightGoal) {
                    state.weightGoal = parseFloat(imported.weightGoal);
                    localStorage.setItem(namespacedKey('weightGoal'), state.weightGoal);
                }

                saveToLocalStorage('weightLogs');
                saveToLocalStorage('workouts');
                saveToLocalStorage('plans');
                saveToLocalStorage('nutritionLogs');
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
