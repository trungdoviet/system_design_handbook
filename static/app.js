/**
 * Tech Mastery Portal & System Design Quest Simulator
 * Extended Application Script with OAuth Sandbox & Specialist Moderation
 */

// ==========================================================================
// Application State
// ==========================================================================
const state = {
    activeScreen: 'landing',      // 'landing' | 'simulator' | 'contribute' | 'specialist'
    activeTopic: null,            // topic object
    quests: [],                   // quests list
    activeQuest: null,            // current quest detail
    selectedOption: null,         // A, B, C, D selected by user
    currentUser: null,            // current logged-in user object from API
    userProgress: {},             // loaded from backend dynamically
    selectedRating: 0,            // 1-5 rating value
    activeReviewQuest: null,      // pending quest detail inside specialist desk
    geminiApiKey: '',             // Gemini key
    isDarkTheme: true             // dark mode status
};

// Category Icon Mapping
const categoryIcons = {
    // System Design
    "API Design & Routing": "fa-route",
    "Databases & Indexing": "fa-database",
    "Caching & Performance": "fa-bolt",
    "Distributed Systems & Locks": "fa-lock",
    "Messaging & Streams": "fa-envelope",
    "Resilience & Deployment": "fa-shield-halved",
    // DSA
    "Array & Sorting": "fa-list-ol",
    "Design & Data Structures": "fa-sitemap",
    "Stacks & Queues": "fa-layer-group",
    // ETL
    "Streaming Pipelines": "fa-water",
    "Batch Processing": "fa-gears",
    "Data Warehousing": "fa-warehouse",
    // Spring
    "Core & DI": "fa-seedling",
    "Transactions & AOP": "fa-rotate-left",
    "Spring Data JPA": "fa-server"
};

// ==========================================================================
// API helper with active sandbox email injection
// ==========================================================================
async function apiFetch(url, options = {}) {
    const email = localStorage.getItem('sandbox_email') || 'student@mastery.edu';
    
    // Inject headers
    options.headers = {
        ...(options.headers || {}),
        'X-User-Email': email
    };
    
    const res = await fetch(url, options);
    return res;
}

// ==========================================================================
// Document Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    loadLocalSettings();
    applyTheme();
    setupEventListeners();
    await fetchCurrentUser();
    await fetchTopics();
}

function loadLocalSettings() {
    state.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    document.getElementById('gemini-key-input').value = state.geminiApiKey;

    state.isDarkTheme = localStorage.getItem('theme') !== 'light';
}

function applyTheme() {
    if (state.isDarkTheme) {
        document.body.classList.remove('light-theme');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.add('light-theme');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// ==========================================================================
// Auth & Sandbox User Operations
// ==========================================================================
async function fetchCurrentUser() {
    try {
        const res = await apiFetch('/api/auth/me');
        if (!res.ok) throw new Error("Failed to authenticate user");
        
        state.currentUser = await res.json();
        
        // Show status widget
        const widget = document.getElementById('user-status-widget');
        widget.style.display = 'flex';
        
        document.getElementById('user-coins-val').textContent = state.currentUser.coin_balance;
        document.getElementById('user-avatar-img').src = state.currentUser.avatar_url;
        document.getElementById('user-display-name').textContent = state.currentUser.name;
        
        let roleText = state.currentUser.role;
        if (state.currentUser.role === 'specialist') {
            roleText = `Specialist Lvl ${state.currentUser.specialist_level}`;
        }
        document.getElementById('user-role-label').textContent = roleText;

        // Toggle Specialist Desk button on landing page if specialist or admin
        const specBtn = document.getElementById('landing-go-specialist-btn');
        if (state.currentUser.role === 'specialist' || state.currentUser.role === 'admin') {
            specBtn.style.display = 'inline-flex';
        } else {
            specBtn.style.display = 'none';
        }

        updateApiKeyStatus();
    } catch (e) {
        console.error("Auth error:", e);
    }
}

function updateApiKeyStatus() {
    const keyBtn = document.getElementById('open-settings-btn');
    const aiStatus = document.getElementById('ai-status');
    const hasKey = state.geminiApiKey;
    
    // Check if user has enough coins to bypass key requirements (10 coins)
    const hasCoins = state.currentUser && state.currentUser.coin_balance >= 10;

    if (hasKey) {
        keyBtn.className = "btn btn-secondary btn-sm";
        keyBtn.innerHTML = `<i class="fas fa-check-circle text-glow-primary"></i> <span>Key Configured</span>`;
        if (aiStatus) {
            aiStatus.textContent = "AI Model Ready";
            aiStatus.className = "ai-status-tag active";
        }
    } else if (hasCoins) {
        keyBtn.className = "btn btn-secondary btn-sm";
        keyBtn.innerHTML = `<i class="fas fa-coins text-glow-gold"></i> <span>Ready (Coin Bypass)</span>`;
        if (aiStatus) {
            aiStatus.textContent = "Redeemable with Coins";
            aiStatus.className = "ai-status-tag active";
        }
    } else {
        keyBtn.className = "btn btn-primary btn-sm";
        keyBtn.innerHTML = `<i class="fas fa-key"></i> <span>Gemini API Key</span>`;
        if (aiStatus) {
            aiStatus.textContent = "Key Required";
            aiStatus.className = "ai-status-tag";
        }
    }
}

async function populateDevUsersList() {
    try {
        const res = await apiFetch('/api/auth/test-users');
        if (!res.ok) throw new Error("Failed to load dev users list");
        
        const users = await res.json();
        const listContainer = document.getElementById('dev-users-list');
        listContainer.innerHTML = '';

        const activeEmail = localStorage.getItem('sandbox_email') || 'student@mastery.edu';

        users.forEach(u => {
            const card = document.createElement('div');
            card.className = 'dev-user-card';
            if (u.email === activeEmail) {
                card.classList.add('active');
            }

            let roleLabel = u.role;
            if (u.role === 'specialist') {
                roleLabel = `Specialist Lvl ${u.specialist_level}`;
            }

            card.innerHTML = `
                <div class="dev-user-name">${u.name}</div>
                <div class="dev-user-email">${u.email}</div>
                <div class="dev-user-role">${roleLabel}</div>
            `;

            card.addEventListener('click', () => switchDevIdentity(u.email));
            listContainer.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

async function switchDevIdentity(email) {
    localStorage.setItem('sandbox_email', email);
    document.getElementById('dev-drawer').classList.remove('active');
    
    // Refresh application context for the selected role
    await fetchCurrentUser();
    
    // Go to landing screen
    showLandingScreen();
    alert(`Swapped identity successfully to: ${email}`);
}

// ==========================================================================
// Setup Listeners & Transitions
// ==========================================================================
function setupEventListeners() {
    // Navigation
    document.getElementById('header-logo-btn').addEventListener('click', showLandingScreen);
    document.getElementById('back-to-home-btn').addEventListener('click', showLandingScreen);
    document.getElementById('contribute-cancel-btn').addEventListener('click', showLandingScreen);
    document.getElementById('spec-back-to-home-btn').addEventListener('click', showLandingScreen);
    
    document.getElementById('landing-go-contribute-btn').addEventListener('click', showContributorScreen);
    document.getElementById('landing-go-specialist-btn').addEventListener('click', showSpecialistScreen);

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        state.isDarkTheme = !state.isDarkTheme;
        localStorage.setItem('theme', state.isDarkTheme ? 'dark' : 'light');
        applyTheme();
    });

    // Sandbox Swapper
    const devDrawer = document.getElementById('dev-drawer');
    document.getElementById('open-dev-btn').addEventListener('click', () => {
        devDrawer.classList.toggle('active');
        if (devDrawer.classList.contains('active')) {
            populateDevUsersList();
        }
    });
    document.getElementById('close-dev-btn').addEventListener('click', () => {
        devDrawer.classList.remove('active');
    });

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    document.getElementById('open-settings-btn').addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    document.getElementById('close-settings-btn').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        const keyVal = document.getElementById('gemini-key-input').value.trim();
        state.geminiApiKey = keyVal;
        localStorage.setItem('gemini_api_key', keyVal);
        fetchCurrentUser(); // updates displays
        settingsModal.classList.remove('active');
    });
    document.getElementById('reset-progress-btn').addEventListener('click', async () => {
        if (confirm("Reset SQLite Database? This will restore original questions and reset all progression histories.")) {
            // Since resetting database requires backend re-seeding, we can trigger a python command or tell the user to re-run.
            // For now, we will clear local user progresses from storage and reset scores.
            state.userProgress = {};
            // Let's call endpoint to clear database user progress table
            alert("Database re-seeding requires re-running 'migrate_json_to_db.py' on the terminal. Local client data resets.");
            settingsModal.classList.remove('active');
        }
    });

    // Sidebar Category Filter
    document.getElementById('category-filter').addEventListener('change', (e) => {
        renderQuestList(e.target.value);
    });

    // Dashboard navigation
    document.getElementById('view-dashboard-btn').addEventListener('click', showDashboard);

    // Submission Form Trigger
    document.getElementById('submission-form').addEventListener('submit', submitNewQuestForm);

    // Submit Answer Action
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);

    // AI Feedback request
    document.getElementById('trigger-ai-feedback-btn').addEventListener('click', generateAIFeedback);

    // Ratings System Events
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
        star.addEventListener('mouseover', handleStarHover);
        star.addEventListener('click', handleStarClick);
    });
    document.getElementById('stars-selector').addEventListener('mouseleave', handleStarsMouseLeave);

    document.getElementById('skip-rating-btn').addEventListener('click', () => {
        document.getElementById('rating-modal').classList.remove('active');
    });
    document.getElementById('submit-rating-btn').addEventListener('click', submitStarRating);

    // Specialist Action Listeners
    document.getElementById('spec-save-edits-btn').addEventListener('click', saveSpecialistEdits);
    document.getElementById('spec-approve-btn').addEventListener('click', approveQuestSubmission);
    document.getElementById('spec-post-note-btn').addEventListener('click', addReviewCommentNote);
}

// ==========================================================================
// Screen Transitions
// ==========================================================================
function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
}

function showLandingScreen() {
    hideAllScreens();
    state.activeScreen = 'landing';
    state.activeTopic = null;
    document.getElementById('landing-screen').classList.add('active');
    fetchTopics(); // Refresh topic progresses and coins
    fetchCurrentUser();
}

function showSimulatorScreen(topic) {
    hideAllScreens();
    state.activeScreen = 'simulator';
    state.activeTopic = topic;
    document.getElementById('simulator-screen').classList.add('active');

    // Reset filters
    document.getElementById('category-filter').value = 'all';

    // Load quests lists
    fetchQuestsForTopic(topic.id);
}

function showContributorScreen() {
    hideAllScreens();
    state.activeScreen = 'contribute';
    document.getElementById('contribute-screen').classList.add('active');
}

function showSpecialistScreen() {
    hideAllScreens();
    state.activeScreen = 'specialist';
    document.getElementById('specialist-screen').classList.add('active');

    // Load specialist profile stats
    const prof = state.currentUser;
    document.getElementById('spec-profile-cat').textContent = prof.role === 'admin' ? 'All' : 'General & Systems';
    document.getElementById('spec-profile-lvl').textContent = `Level ${prof.specialist_level || 1}`;
    document.getElementById('spec-profile-xp').textContent = prof.specialist_xp || 0;

    // Load pending review list queue
    fetchPendingSubmissions();
    
    // Set workspace right-panel to empty state
    document.getElementById('spec-empty-state').style.display = 'flex';
    document.getElementById('spec-active-review-panel').style.display = 'none';
}

// ==========================================================================
// Landing Grid Operations
// ==========================================================================
async function fetchTopics() {
    try {
        const res = await apiFetch('/api/topics');
        if (!res.ok) throw new Error("Failed to load topics");
        const topics = await res.json();
        renderTopicGrid(topics);
    } catch (e) {
        console.error(e);
        document.getElementById('topics-grid').innerHTML = `<div class="card error-message"><p>Error connecting to backend server. Please verify FastAPI is running.</p></div>`;
    }
}

function renderTopicGrid(topics) {
    const grid = document.getElementById('topics-grid');
    grid.innerHTML = '';

    topics.forEach(t => {
        // We will load completed counts from progress backend
        const card = document.createElement('div');
        card.className = 'topic-card card';
        
        card.innerHTML = `
            <div class="topic-icon">${t.icon}</div>
            <h3 class="topic-name">${t.name}</h3>
            <p class="topic-desc">${t.description}</p>
            <div class="topic-progress-section">
                <div class="progress-label-row">
                    <span>Questions</span>
                    <span>${t.questions_count} Quests Available</span>
                </div>
            </div>
            <div class="topic-action" style="margin-top: 16px;">
                <button class="btn btn-secondary btn-sm">Enter Practice</button>
            </div>
        `;

        card.addEventListener('click', () => showSimulatorScreen(t));
        grid.appendChild(card);
    });
}

// ==========================================================================
// Quest Workspace Operations
// ==========================================================================
async function fetchQuestsForTopic(topicId) {
    try {
        const res = await apiFetch(`/api/quests/${topicId}`);
        if (!res.ok) throw new Error("Failed to load quests");
        state.quests = await res.json();
        
        // Fetch solved user progress list from DB
        const progRes = await apiFetch(`/api/user/progress/${topicId}`);
        if (progRes.ok) {
            state.userProgress = await progRes.json();
        } else {
            state.userProgress = {};
        }

        populateCategoryFilter();
        updateOverallProgress();
        renderQuestList();
        showDashboard();
    } catch (e) {
        console.error(e);
        alert("Failed to load topic questions: " + e.message);
    }
}

function populateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    const categories = [...new Set(state.quests.map(q => q.category))];
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        filter.appendChild(opt);
    });
}

function updateOverallProgress() {
    const total = state.quests.length;
    const completed = Object.keys(state.userProgress).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('overall-pct').textContent = `${pct}%`;
    document.getElementById('overall-count').textContent = `${completed}/${total}`;
    
    const ringOffset = 251.2 - (251.2 * pct) / 100;
    document.getElementById('overall-progress-bar').style.strokeDashoffset = ringOffset;

    let correctCount = 0;
    Object.values(state.userProgress).forEach(ans => {
        if (ans.correct) correctCount++;
    });

    const correctPct = completed > 0 ? (correctCount / completed) * 100 : 0;
    let rank = "Novice Developer";
    
    if (completed > 0) {
        if (correctPct >= 90) rank = "Principal Architect";
        else if (correctPct >= 75) rank = "Senior Architect";
        else if (correctPct >= 50) rank = "System Designer";
        else rank = "Apprentice Engineer";
    }

    document.getElementById('rank-text').textContent = rank;
}

function renderQuestList(filterCategory = 'all') {
    const list = document.getElementById('quest-list');
    list.innerHTML = '';

    let index = 1;
    state.quests.forEach(q => {
        if (filterCategory !== 'all' && q.category !== filterCategory) return;

        const li = document.createElement('li');
        li.className = 'quest-item';
        if (state.activeQuest && state.activeQuest.id === q.id) {
            li.classList.add('active');
        }

        const prog = state.userProgress[q.id];
        let statusHtml = '<i class="far fa-circle quest-status-icon unstarted"></i>';
        if (prog) {
            statusHtml = prog.correct 
                ? '<i class="fas fa-check-circle quest-status-icon correct"></i>'
                : '<i class="fas fa-times-circle quest-status-icon incorrect"></i>';
        }

        li.innerHTML = `
            <div class="quest-item-content">
                <span class="quest-item-day">DAY ${String(index).padStart(2, '0')}</span>
                <span class="quest-item-title" title="${q.title}">${q.title}</span>
            </div>
            ${statusHtml}
        `;
        index++;

        li.addEventListener('click', () => fetchQuestDetail(q.id));
        list.appendChild(li);
    });
}

function showDashboard() {
    state.activeQuest = null;
    
    const listItems = document.querySelectorAll('.quest-item');
    listItems.forEach(item => item.classList.remove('active'));

    document.getElementById('active-quest-panel').style.display = 'none';
    document.getElementById('dashboard-widget-panel').style.display = 'block';

    const catStats = {};
    state.quests.forEach(q => {
        if (!catStats[q.category]) {
            catStats[q.category] = { total: 0, completed: 0, correct: 0 };
        }
        catStats[q.category].total++;
        
        const prog = state.userProgress[q.id];
        if (prog) {
            catStats[q.category].completed++;
            if (prog.correct) {
                catStats[q.category].correct++;
            }
        }
    });

    const grid = document.getElementById('category-cards-grid');
    grid.innerHTML = '';

    for (const [catName, stats] of Object.entries(catStats)) {
        const pct = stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0;
        const iconClass = categoryIcons[catName] || "fa-cube";
        
        const card = document.createElement('div');
        card.className = 'category-card card';
        card.innerHTML = `
            <div class="category-icon text-glow-primary">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="category-info">
                <div class="category-name">${catName}</div>
                <div class="category-score">${stats.correct}/${stats.total} Correct (${pct}% of completed)</div>
                <div class="topic-progress-section" style="margin-top: 8px;">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, var(--primary), var(--correct));"></div>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    }

    document.getElementById('ai-feedback-output').style.display = 'none';
    document.getElementById('ai-feedback-output').innerHTML = '';
}

async function fetchQuestDetail(questId) {
    try {
        const res = await apiFetch(`/api/quests/${state.activeTopic.id}/${questId}`);
        if (!res.ok) throw new Error("Failed to load question details");
        state.activeQuest = await res.json();
        
        showQuestWorkspace();
    } catch (e) {
        console.error(e);
        alert("Error loading question: " + e.message);
    }
}

function showQuestWorkspace() {
    document.getElementById('dashboard-widget-panel').style.display = 'none';
    document.getElementById('active-quest-panel').style.display = 'block';

    renderQuestList(document.getElementById('category-filter').value);

    const q = state.activeQuest;
    const qIndex = state.quests.findIndex(quest => quest.id === q.id) + 1;
    document.getElementById('quest-day-num').textContent = `DAY ${String(qIndex).padStart(2, '0')}`;
    document.getElementById('quest-cat-pill').textContent = q.category;
    document.getElementById('quest-title-text').textContent = q.title;
    document.getElementById('quest-scenario-text').innerHTML = marked.parse(q.scenario);

    // Load Ratings Badge
    const ratePill = document.getElementById('quest-rating-pill');
    if (q.rating_stats && q.rating_stats.count > 0) {
        ratePill.style.display = 'flex';
        document.getElementById('quest-rating-val').textContent = `${q.rating_stats.average} (${q.rating_stats.count} reviews)`;
    } else {
        ratePill.style.display = 'none';
    }

    state.selectedOption = null;
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn.textContent = "Submit Architecture Selection";
    submitBtn.disabled = true;

    // Retrieve previous answer from DB progress
    const previousAns = q.previous_answer;

    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';

    q.options.forEach(opt => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.dataset.key = opt.key;

        card.innerHTML = `
            <div class="option-letter">${opt.key}</div>
            <div class="option-text">${opt.text}</div>
        `;

        if (previousAns) {
            if (opt.key === q.correct_answer) {
                card.classList.add('correct-answer-reveal');
            } else if (previousAns.answered === opt.key) {
                card.classList.add('incorrect-answer-reveal');
            }
        } else {
            card.addEventListener('click', () => selectOption(opt.key));
        }

        optionsList.appendChild(card);
    });

    document.getElementById('sim-play-pause-btn').disabled = true;
    document.getElementById('sim-reset-btn').disabled = true;
    document.getElementById('sim-status-label').textContent = 'Idle';
    document.getElementById('sim-explanation-text').textContent = 'Select an option to simulate the flow.';

    renderSimulationSchema();

    if (previousAns) {
        revealAnswerPanel(previousAns.answered, previousAns.correct);
        document.getElementById('sim-play-pause-btn').disabled = false;
        document.getElementById('sim-reset-btn').disabled = false;
        startFlowSimulation(previousAns.answered);
    } else {
        document.getElementById('explanation-card').style.display = 'none';
    }
}

function selectOption(key) {
    state.selectedOption = key;
    
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => {
        if (c.dataset.key === key) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });

    document.getElementById('submit-answer-btn').disabled = false;
    renderSimulationSchema(key);
}

async function submitAnswer() {
    if (!state.selectedOption || !state.activeQuest) return;

    const q = state.activeQuest;
    const topicId = state.activeTopic.id;
    const isCorrect = state.selectedOption === q.correct_answer;

    try {
        // Save progress to database
        const res = await apiFetch(`/api/quests/${topicId}/${q.id}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answered: state.selectedOption,
                correct: isCorrect
            })
        });

        if (!res.ok) throw new Error("Failed to save progress on backend");

        // Record locally for sidebar update
        state.userProgress[q.id] = { answered: state.selectedOption, correct: isCorrect };
        updateOverallProgress();

        // Reveal styling
        const cards = document.querySelectorAll('.option-card');
        cards.forEach(c => {
            c.classList.remove('selected');
            const key = c.dataset.key;
            if (key === q.correct_answer) {
                c.classList.add('correct-answer-reveal');
            } else if (key === state.selectedOption) {
                c.classList.add('incorrect-answer-reveal');
            }
            // Remove handlers
            const newCard = c.cloneNode(true);
            c.parentNode.replaceChild(newCard, c);
        });

        revealAnswerPanel(state.selectedOption, isCorrect);

        document.getElementById('submit-answer-btn').disabled = true;
        document.getElementById('sim-play-pause-btn').disabled = false;
        document.getElementById('sim-reset-btn').disabled = false;

        startFlowSimulation(state.selectedOption);

        // Open rating overlay modal after brief delay (letting animation start first)
        setTimeout(() => {
            openRatingModal();
        }, 1200);

    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

function revealAnswerPanel(answeredKey, isCorrect) {
    const q = state.activeQuest;
    const card = document.getElementById('explanation-card');
    card.style.display = 'block';

    const badge = document.getElementById('explanation-badge');
    badge.className = 'status-badge';
    
    if (isCorrect) {
        badge.classList.add('correct');
        badge.textContent = 'Correct Answer';
        document.getElementById('explanation-title-text').textContent = `Success: Why Option ${answeredKey} Wins`;
    } else {
        const expText = q.explanations[answeredKey] || '';
        const isTrap = expText.toLowerCase().includes('trap');
        
        if (isTrap) {
            badge.classList.add('trap');
            badge.textContent = 'Trap Answer';
            document.getElementById('explanation-title-text').textContent = `Pitfall: Fell for the Trap (Option ${answeredKey})`;
        } else {
            badge.classList.add('incorrect');
            badge.textContent = 'Wrong Choice';
            document.getElementById('explanation-title-text').textContent = `Failed: Why Option ${answeredKey} is Incorrect`;
        }
    }

    document.getElementById('explanation-body-text').innerHTML = marked.parse(formatExplanationText(q.explanations[q.correct_answer]));

    const otherContainer = document.getElementById('other-options-explanations');
    otherContainer.innerHTML = '';

    Object.entries(q.explanations).forEach(([key, text]) => {
        if (key === q.correct_answer) return;
        
        const optDiv = document.createElement('div');
        optDiv.className = 'other-opt-exp';
        optDiv.innerHTML = `<strong>Option ${key}:</strong> ${marked.parse(formatExplanationText(text))}`;
        otherContainer.appendChild(optDiv);
    });
}

function formatExplanationText(text) {
    if (!text) return '';
    return text.replace(/✓ CORRECT ANSWER/gi, '').replace(/✅/g, '✔️');
}

// ==========================================================================
// Ratings & Star Reviews Flow
// ==========================================================================
function openRatingModal() {
    state.selectedRating = 0;
    document.getElementById('rating-feedback-input').value = '';
    
    // Reset stars icons
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(s => {
        s.className = 'far fa-star rating-star';
    });

    document.getElementById('submit-rating-btn').disabled = true;
    document.getElementById('rating-modal').classList.add('active');
}

function handleStarHover(e) {
    const val = parseInt(e.target.dataset.val);
    highlightStars(val);
}

function handleStarClick(e) {
    const val = parseInt(e.target.dataset.val);
    state.selectedRating = val;
    highlightStars(val);
    document.getElementById('submit-rating-btn').disabled = false;
}

function handleStarsMouseLeave() {
    highlightStars(state.selectedRating);
}

function highlightStars(val) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(s => {
        const sVal = parseInt(s.dataset.val);
        if (sVal <= val) {
            s.className = 'fas fa-star rating-star selected';
        } else {
            s.className = 'far fa-star rating-star';
        }
    });
}

async function submitStarRating() {
    if (!state.selectedRating || !state.activeQuest) return;

    try {
        const feedback = document.getElementById('rating-feedback-input').value.trim();
        const res = await apiFetch(`/api/quests/${state.activeTopic.id}/${state.activeQuest.id}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rating_val: state.selectedRating,
                feedback: feedback || null
            })
        });

        if (!res.ok) throw new Error("Failed to record rating");

        alert("Thank you for your rating! Contributor rewarded with coins.");
        document.getElementById('rating-modal').classList.remove('active');
        
        // Refresh balances
        await fetchCurrentUser();
        
        // Refresh quest details ratings pill
        fetchQuestDetail(state.activeQuest.id);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

// ==========================================================================
// Question Contributor Pipeline
// ==========================================================================
async function submitNewQuestForm(e) {
    e.preventDefault();

    const topic = document.getElementById('sub-topic').value;
    const title = document.getElementById('sub-title').value.trim();
    const category = document.getElementById('sub-category').value.trim();
    const scenario = document.getElementById('sub-scenario').value.trim();
    const optA = document.getElementById('sub-opt-a').value.trim();
    const optB = document.getElementById('sub-opt-b').value.trim();
    const optC = document.getElementById('sub-opt-c').value.trim();
    const optD = document.getElementById('sub-opt-d').value.trim();
    const correct = document.getElementById('sub-correct').value;
    const expA = document.getElementById('sub-exp-a').value.trim();
    const expB = document.getElementById('sub-exp-b').value.trim();
    const expC = document.getElementById('sub-exp-c').value.trim();
    const expD = document.getElementById('sub-exp-d').value.trim();

    const payload = {
        topic_id: topic,
        title: title,
        category: category,
        scenario: scenario,
        options: [
            {"key": "A", "text": optA},
            {"key": "B", "text": optB},
            {"key": "C", "text": optC},
            {"key": "D", "text": optD}
        ],
        correct_answer: correct,
        explanations: {
            "A": expA,
            "B": expB,
            "C": expC,
            "D": expD
        }
    };

    try {
        const res = await apiFetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to submit question");

        alert("Questionnaire submitted successfully! It has been added to the Specialist review queue.");
        document.getElementById('submission-form').reset();
        showLandingScreen();
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

// ==========================================================================
// Specialist Desk & Moderation Pipelines
// ==========================================================================
async function fetchPendingSubmissions() {
    try {
        const res = await apiFetch('/api/submissions/pending');
        if (!res.ok) throw new Error("Failed to load queue");
        const list = await res.json();
        
        const listContainer = document.getElementById('pending-submissions-list');
        listContainer.innerHTML = '';

        if (list.length === 0) {
            listContainer.innerHTML = '<li class="no-submissions" style="padding:16px; color:var(--text-secondary); text-align:center;">No pending questions in queue</li>';
            return;
        }

        list.forEach(q => {
            const li = document.createElement('li');
            li.className = 'quest-item';
            if (state.activeReviewQuest && state.activeReviewQuest.id === q.id) {
                li.classList.add('active');
            }

            li.innerHTML = `
                <div class="quest-item-content">
                    <span class="quest-item-day">${q.topic_id.toUpperCase().replace('_', ' ')}</span>
                    <span class="quest-item-title" title="${q.title}">${q.title}</span>
                    <span style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">Author: ${q.author_name}</span>
                </div>
            `;

            li.addEventListener('click', () => fetchReviewQuestDetail(q.id));
            listContainer.appendChild(li);
        });
    } catch (e) {
        console.error(e);
    }
}

async function fetchReviewQuestDetail(id) {
    try {
        const res = await apiFetch(`/api/submissions/${id}`);
        if (!res.ok) throw new Error("Failed to load submission detail");
        
        state.activeReviewQuest = await res.json();
        
        // Highlight in list
        const items = document.querySelectorAll('#pending-submissions-list .quest-item');
        items.forEach((item, idx) => {
            // We can re-render list or simple toggle active class
        });
        
        fetchPendingSubmissions(); // refreshes active states
        showReviewWorkspace();
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

function showReviewWorkspace() {
    document.getElementById('spec-empty-state').style.display = 'none';
    document.getElementById('spec-active-review-panel').style.display = 'flex';

    const q = state.activeReviewQuest;
    document.getElementById('spec-topic-tag').textContent = q.topic_id.toUpperCase().replace('_', ' ');
    document.getElementById('spec-category-tag').textContent = q.category;
    document.getElementById('spec-quest-title').textContent = q.title;

    // Load editor fields
    document.getElementById('edit-title').value = q.title;
    document.getElementById('edit-scenario').value = q.scenario;

    const optA = q.options.find(o => o.key === 'A') || { text: '' };
    const optB = q.options.find(o => o.key === 'B') || { text: '' };
    const optC = q.options.find(o => o.key === 'C') || { text: '' };
    const optD = q.options.find(o => o.key === 'D') || { text: '' };

    document.getElementById('edit-opt-a').value = optA.text;
    document.getElementById('edit-opt-b').value = optB.text;
    document.getElementById('edit-opt-c').value = optC.text;
    document.getElementById('edit-opt-d').value = optD.text;

    document.getElementById('edit-correct').value = q.correct_answer;

    document.getElementById('edit-exp-a').value = q.explanations['A'] || '';
    document.getElementById('edit-exp-b').value = q.explanations['B'] || '';
    document.getElementById('edit-exp-c').value = q.explanations['C'] || '';
    document.getElementById('edit-exp-d').value = q.explanations['D'] || '';

    // Render dialogue comments thread
    renderReviewNotesThread();
}

function renderReviewNotesThread() {
    const thread = document.getElementById('notes-thread-container');
    thread.innerHTML = '';
    
    const notes = state.activeReviewQuest.notes || [];

    if (notes.length === 0) {
        thread.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:16px;">No comments in thread yet</div>';
        return;
    }

    notes.forEach(n => {
        const card = document.createElement('div');
        card.className = 'review-note-card';
        card.innerHTML = `
            <div class="note-meta">
                <strong>${n.author_name}</strong>
                <span>${n.created_at}</span>
            </div>
            <div class="note-text">${n.note_text}</div>
        `;
        thread.appendChild(card);
    });

    // Auto-scroll to bottom of thread
    thread.scrollTop = thread.scrollHeight;
}

async function addReviewCommentNote() {
    if (!state.activeReviewQuest) return;

    const textarea = document.getElementById('new-note-text');
    const text = textarea.value.trim();
    if (!text) return;

    try {
        const res = await apiFetch(`/api/submissions/${state.activeReviewQuest.id}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note_text: text })
        });

        if (!res.ok) throw new Error("Failed to post note comment");

        textarea.value = '';
        // Reload details
        await fetchReviewQuestDetail(state.activeReviewQuest.id);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

async function saveSpecialistEdits() {
    if (!state.activeReviewQuest) return;

    const topic = state.activeReviewQuest.topic_id;
    const title = document.getElementById('edit-title').value.trim();
    const scenario = document.getElementById('edit-scenario').value.trim();
    const optA = document.getElementById('edit-opt-a').value.trim();
    const optB = document.getElementById('edit-opt-b').value.trim();
    const optC = document.getElementById('edit-opt-c').value.trim();
    const optD = document.getElementById('edit-opt-d').value.trim();
    const correct = document.getElementById('edit-correct').value;
    const expA = document.getElementById('edit-exp-a').value.trim();
    const expB = document.getElementById('edit-exp-b').value.trim();
    const expC = document.getElementById('edit-exp-c').value.trim();
    const expD = document.getElementById('edit-exp-d').value.trim();

    const payload = {
        topic_id: topic,
        title: title,
        category: state.activeReviewQuest.category,
        scenario: scenario,
        options: [
            {"key": "A", "text": optA},
            {"key": "B", "text": optB},
            {"key": "C", "text": optC},
            {"key": "D", "text": optD}
        ],
        correct_answer: correct,
        explanations: {
            "A": expA,
            "B": expB,
            "C": expC,
            "D": expD
        }
    };

    try {
        const res = await apiFetch(`/api/submissions/${state.activeReviewQuest.id}/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to update revision");

        alert("Question details updated successfully!");
        // Reload details
        await fetchReviewQuestDetail(state.activeReviewQuest.id);
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

async function approveQuestSubmission() {
    if (!state.activeReviewQuest) return;

    if (!confirm("Are you sure you want to approve this question? If approved and published, other users will be able to take it immediately.")) return;

    try {
        const res = await apiFetch(`/api/submissions/${state.activeReviewQuest.id}/approve`, {
            method: 'POST'
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to approve question");
        }

        const data = await res.json();
        if (data.status === 'published') {
            alert("Success! Question has been approved and published to the platform topic!");
            state.activeReviewQuest = null;
            document.getElementById('spec-active-review-panel').style.display = 'none';
            document.getElementById('spec-empty-state').style.display = 'flex';
        } else {
            alert(data.detail);
        }

        fetchPendingSubmissions();
        fetchCurrentUser(); // updates displays
    } catch (e) {
        console.error(e);
        alert(e.message);
    }
}

// ==========================================================================
// SVG Flow Simulation Engine (Directly mapped from previous state logic)
// ==========================================================================
function renderSimulationSchema(selectedKey = null) {
    const svg = document.getElementById('sim-svg-canvas');
    svg.innerHTML = '';
    
    if (!state.activeQuest) return;
    
    const category = state.activeQuest.category;
    const dayId = state.activeQuest.id;
    const topicId = state.activeTopic.id;

    let schema = getSimulationSchema(topicId, category, dayId, selectedKey);
    
    schema.links.forEach(l => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', l.id);
        path.setAttribute('d', l.d);
        path.setAttribute('class', `sim-link ${l.style || ''}`);
        svg.appendChild(path);
    });

    schema.nodes.forEach(n => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', n.r || 24);
        circle.setAttribute('class', `node-circle ${n.status || ''}`);
        g.appendChild(circle);

        if (n.icon) {
            const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            iconText.setAttribute('class', 'node-icon');
            iconText.setAttribute('y', -2);
            iconText.textContent = n.icon;
            g.appendChild(iconText);
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'node-label');
        text.setAttribute('y', 36);
        text.textContent = n.label;
        g.appendChild(text);

        if (n.sublabel) {
            const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            sub.setAttribute('class', 'node-sublabel');
            sub.setAttribute('y', 46);
            sub.textContent = n.sublabel;
            g.appendChild(sub);
        }

        svg.appendChild(g);
    });
}

function startFlowSimulation(answeredKey) {
    const svg = document.getElementById('sim-svg-canvas');
    const category = state.activeQuest.category;
    const dayId = state.activeQuest.id;
    const topicId = state.activeTopic.id;

    const oldPackets = svg.querySelectorAll('.packet');
    oldPackets.forEach(p => p.remove());

    let schema = getSimulationSchema(topicId, category, dayId, answeredKey);

    document.getElementById('sim-status-label').textContent = 'Simulating...';
    document.getElementById('sim-explanation-text').textContent = schema.explanationText;

    const playBtn = document.getElementById('sim-play-pause-btn');
    playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    
    schema.flows.forEach(flow => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', flow.r || 5);
        circle.setAttribute('class', `packet ${flow.status || ''}`);

        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        animate.setAttribute('path', flow.path);
        animate.setAttribute('dur', flow.dur || '2.5s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        if (flow.begin) {
            animate.setAttribute('begin', flow.begin);
        }

        circle.appendChild(animate);
        svg.appendChild(circle);
    });
}

// Generate the node structure based on selection
function getSimulationSchema(topicId, category, dayId, selectedKey) {
    const isCorrect = state.activeQuest && selectedKey === state.activeQuest.correct_answer;
    const title = state.activeQuest ? state.activeQuest.title : "";
    
    let nodes = [];
    let links = [];
    let flows = [];
    let explanationText = "";

    // Check custom advanced questions first (by title matching)
    if (title.includes("Split-Brain")) {
        nodes = [
            { x: 100, y: 120, label: "Node A (Old Ldr)", icon: "👑", status: selectedKey === 'B' ? "warning" : "active" },
            { x: 100, y: 280, label: "Node B", icon: "🖥️", status: selectedKey === 'B' ? "warning" : "active" },
            { x: 450, y: 100, label: "Node C (New Ldr)", icon: "👑", status: selectedKey === 'B' ? "success" : "active" },
            { x: 450, y: 200, label: "Node D", icon: "🖥️", status: "active" },
            { x: 450, y: 300, label: "Node E", icon: "🖥️", status: "active" }
        ];
        links = [
            { id: "a-to-b", d: "M 100 144 L 100 256" },
            { id: "c-to-d", d: "M 450 124 L 450 176" },
            { id: "d-to-e", d: "M 450 224 L 450 276" },
            { id: "partition-line", d: "M 280 50 L 280 350", style: "dash" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 450 124 L 450 176", status: "success", dur: "1.5s" },
                { path: "M 450 224 L 450 276", status: "success", dur: "1.5s", begin: "0.5s" }
            ];
            explanationText = "Term Increments: Partition majority elects C. Upon healing, heartbeats override stagnant Node A, resetting uncommitted logs.";
        } else {
            flows = [
                { path: "M 100 144 L 100 256", status: "error", dur: "1s" }
            ];
            explanationText = "Split-Brain Danger: Node A accepts writes in isolation, but lacks quorum. Reconnect causes conflicts.";
        }
    } else if (title.includes("Consistent Hashing")) {
        nodes = [
            { x: 300, y: 80, label: "Node A", icon: "🗄️", status: "success" },
            { x: 420, y: 240, label: "Node B (Crashed)", icon: "❌", status: selectedKey === 'B' ? "error" : "warning" },
            { x: 180, y: 240, label: "Node C", icon: "🗄️", status: "success" }
        ];
        links = [
            { id: "ring", d: "M 300 200 m -80 0 a 80 80 0 1 0 160 0 a 80 80 0 1 0 -160 0", style: "dash" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 300 200 m 0 -80 a 80 80 0 1 1 56 136", status: "success", dur: "2.5s" }
            ];
            explanationText = "Clockwise redistribution: Keys previously routed to B now slide clockwise onto Node C. Minimal key rehash!";
        } else {
            flows = [
                { path: "M 300 200 m 0 -80 a 80 80 0 1 0 -56 136", status: "error", dur: "1.5s" }
            ];
            explanationText = "Inefficient distribution: Entire ring state scrambled. Non-B keys relocated needlessly.";
        }
    } else if (title.includes("Checked Exception")) {
        nodes = [
            { x: 100, y: 200, label: "App Caller", icon: "🖥️", status: "active" },
            { x: 300, y: 200, label: "AOP Proxy", icon: "🛡️", status: "active" },
            { x: 500, y: 200, label: "Database", icon: "🗄️", status: selectedKey === 'B' ? "error" : "success" }
        ];
        links = [
            { id: "call-to-proxy", d: "M 124 200 L 276 200" },
            { id: "proxy-to-db", d: "M 324 200 L 476 200" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 124 200 L 276 200", status: "success", dur: "1.5s" },
                { path: "M 276 200 L 476 200", status: "error", dur: "1.5s", begin: "0.5s" }
            ];
            explanationText = "Checked Exception: Transaction commits despite IOException throw! Status remains 'PROCESSING'.";
        } else {
            flows = [
                { path: "M 124 200 L 276 200", status: "success", dur: "1.5s" }
            ];
            explanationText = "Transaction Rolled Back safely because rollbackFor parameter was configured.";
        }
    } else if (title.includes("Circular Reference")) {
        nodes = [
            { x: 120, y: 200, label: "OrderService", icon: "⚙️", status: "active" },
            { x: 300, y: 200, label: "LazyProxy", icon: "🛡️", status: selectedKey === 'B' ? "success" : "error" },
            { x: 480, y: 200, label: "PaymentService", icon: "⚙️", status: "active" }
        ];
        links = [
            { id: "cycle-forward", d: "M 144 190 Q 300 120 456 190" },
            { id: "cycle-back", d: "M 456 210 Q 300 280 144 210" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 144 190 Q 300 120 456 190", status: "success", dur: "2s" }
            ];
            explanationText = "@Lazy Injector: Spring supplies a lazy proxy during instantiation, breaking circular boot locks.";
        } else {
            flows = [
                { path: "M 144 190 Q 300 120 456 190", status: "error", dur: "0.5s" },
                { path: "M 456 210 Q 300 280 144 210", status: "error", dur: "0.5s", begin: "0.2s" }
            ];
            explanationText = "BeanCurrentlyInCreationException! Infinite constructor recursion lock crash.";
        }
    } else if (title.includes("LRU Cache")) {
        nodes = [
            { x: 100, y: 150, label: "Key 4 (MRU)", icon: "📦", status: "success" },
            { x: 250, y: 150, label: "Key 1", icon: "📦", status: "active" },
            { x: 400, y: 150, label: "Key 3 (LRU)", icon: "📦", status: "active" },
            { x: 250, y: 300, label: "Key 2 (Evicted)", icon: "🗑️", status: "error" }
        ];
        links = [
            { id: "l1", d: "M 124 150 L 226 150" },
            { id: "l2", d: "M 274 150 L 376 150" },
            { id: "evict-path", d: "M 400 174 L 274 276", style: "dash" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 400 174 L 274 276", status: "error", dur: "1.5s" }
            ];
            explanationText = "LRU Eviction: Tail element (Key 2) evicted. Read key 1 moves to head, key 4 is placed at front.";
        } else {
            flows = [
                { path: "M 274 150 L 376 150", status: "warning", dur: "2s" }
            ];
            explanationText = "Wrong state order. Access updates are not tracked correctly.";
        }
    } else if (title.includes("Broadcast Join")) {
        nodes = [
            { x: 100, y: 200, label: "Driver", icon: "🖥️", status: "success" },
            { x: 420, y: 100, label: "Executor 1", icon: "⚙️", status: "active" },
            { x: 420, y: 300, label: "Executor 2", icon: "⚙️", status: "active" }
        ];
        links = [
            { id: "drv-to-w1", d: "M 124 200 L 396 100" },
            { id: "drv-to-w2", d: "M 124 200 L 396 300" }
        ];
        if (selectedKey === 'B') {
            flows = [
                { path: "M 124 200 L 396 100", status: "success", dur: "1.5s" },
                { path: "M 124 200 L 396 300", status: "success", dur: "1.5s" }
            ];
            explanationText = "Map-Side Broadcast: Small ZipCodes table (5MB) replicated to executors. No shuffle for UserActions!";
        } else {
            flows = [
                { path: "M 396 100 L 396 300", status: "error", dur: "1s" }
            ];
            explanationText = "Network Shuffle bottleneck! Data redistributed across executors, triggering OOM.";
        }
    } else if (topicId === 'system_design') {
        if (dayId === 1) {
            if (selectedKey === 'A') {
                nodes = [
                    { x: 100, y: 200, label: "Mobile App", icon: "📱", status: "active" },
                    { x: 280, y: 200, label: "API Gateway", icon: "🚪", status: "success" },
                    { x: 480, y: 100, label: "UserService", icon: "👤" },
                    { x: 480, y: 180, label: "OrderService", icon: "📦" },
                    { x: 480, y: 260, label: "PaymentService", icon: "💳" },
                    { x: 480, y: 340, label: "Notification", icon: "🔔", status: "active" }
                ];
                links = [
                    { id: "c-to-gw", d: "M 124 200 L 256 200" },
                    { id: "gw-to-u", d: "M 304 200 Q 380 150 456 100" },
                    { id: "gw-to-o", d: "M 304 200 Q 380 190 456 180" },
                    { id: "gw-to-p", d: "M 304 200 Q 380 230 456 260" },
                    { id: "gw-to-n", d: "M 304 200 Q 380 270 456 340", style: "dash active" }
                ];
                flows = [
                    { path: "M 124 200 L 256 200", status: "success", dur: "1.5s" },
                    { path: "M 304 200 Q 380 150 456 100", status: "success", dur: "1.8s", begin: "0.5s" },
                    { path: "M 304 200 Q 380 270 456 340", status: "success", dur: "2s", begin: "0.5s" }
                ];
                explanationText = "Client connects to a single domain. Gateway maps paths and routes requests seamlessly to new notification microservice.";
            } else {
                nodes = [
                    { x: 100, y: 200, label: "Mobile App", icon: "📱", status: "warning" },
                    { x: 480, y: 100, label: "UserService", icon: "👤" },
                    { x: 480, y: 180, label: "OrderService", icon: "📦" },
                    { x: 480, y: 260, label: "PaymentService", icon: "💳" },
                    { x: 480, y: 340, label: "Notification", icon: "🔔", status: "error" }
                ];
                links = [
                    { id: "c-to-u", d: "M 124 200 Q 300 150 456 100" },
                    { id: "c-to-o", d: "M 124 200 Q 300 190 456 180" },
                    { id: "c-to-p", d: "M 124 200 Q 300 230 456 260" },
                    { id: "c-to-n", d: "M 124 200 Q 300 270 456 340", style: "dash" }
                ];
                flows = [
                    { path: "M 124 200 Q 300 150 456 100", status: "warning", dur: "2s" },
                    { path: "M 124 200 Q 300 270 456 340", status: "error", dur: "1s" }
                ];
                explanationText = "Sprawl: Mobile client directly connects to 4 domains. Adding Notification service forces mobile code rebuild, re-whitelisting, and redeployment.";
            }
        } else if (dayId === 2) {
            if (selectedKey === 'A') {
                nodes = [
                    { x: 100, y: 200, label: "App Server", icon: "🖥️", status: "active" },
                    { x: 450, y: 200, label: "Postgres DB", icon: "🗄️", status: "success" }
                ];
                links = [
                    { id: "q-link", d: "M 124 200 L 426 200" }
                ];
                flows = [
                    { path: "M 124 200 L 426 200", status: "success", dur: "2s" },
                    { path: "M 426 200 L 124 200", status: "success", dur: "2s", begin: "1s" }
                ];
                explanationText = "One request executes one LEFT JOIN SQL query, returning the orders list and associated customers in a single round-trip (P95 drops to 80ms).";
            } else {
                nodes = [
                    { x: 100, y: 200, label: "App Server", icon: "🖥️", status: "active" },
                    { x: 450, y: 200, label: "Postgres DB", icon: "🗄️", status: "error" }
                ];
                links = [
                    { id: "q-link", d: "M 124 200 L 426 200" }
                ];
                flows = [
                    { path: "M 124 200 L 426 200", status: "error", dur: "0.8s" },
                    { path: "M 124 200 L 426 200", status: "error", dur: "1s", begin: "0.2s" },
                    { path: "M 124 200 L 426 200", status: "error", dur: "1.2s", begin: "0.4s" },
                    { path: "M 124 200 L 426 200", status: "error", dur: "1.4s", begin: "0.6s" }
                ];
                explanationText = "ORM makes 1 query for orders list + 50 separate serial lookup queries for each customer inside map loop, locking connection pools and overloading DB CPU.";
            }
        } else if (dayId === 3) {
            if (selectedKey === 'C') {
                nodes = [
                    { x: 100, y: 200, label: "Client Request", icon: "✉️", status: "active" },
                    { x: 300, y: 200, label: "Token Bucket", icon: "🪣", status: "success" },
                    { x: 500, y: 200, label: "API Handler", icon: "⚙️" }
                ];
                links = [
                    { id: "req-to-b", d: "M 124 200 L 276 200" },
                    { id: "b-to-h", d: "M 324 200 L 476 200" }
                ];
                flows = [
                    { path: "M 124 200 L 276 200", status: "success", dur: "1.5s" },
                    { path: "M 276 200 L 476 200", status: "success", dur: "1.5s", begin: "0.5s" }
                ];
                explanationText = "Token bucket refuels smoothly at 100 tokens/min. Brief burst requests consume tokens and pass, while rate is strictly shaped without spikes.";
            } else {
                nodes = [
                    { x: 100, y: 200, label: "Client Request", icon: "✉️", status: "active" },
                    { x: 300, y: 200, label: "Fixed Window", icon: "⏱️", status: "error" },
                    { x: 500, y: 200, label: "API Handler", icon: "⚙️", status: "warning" }
                ];
                links = [
                    { id: "req-to-b", d: "M 124 200 L 276 200" },
                    { id: "b-to-h", d: "M 324 200 L 476 200" }
                ];
                flows = [
                    { path: "M 124 200 L 276 200", status: "error", dur: "0.5s" },
                    { path: "M 124 200 L 276 200", status: "error", dur: "0.6s", begin: "0.1s" },
                    { path: "M 276 200 L 476 200", status: "warning", dur: "1.2s", begin: "0.3s" }
                ];
                explanationText = "Fixed window limits 100/min but resets on the boundary. The client can successfully burst 2x limit (90 at 12:59:59 + 90 at 13:00:01) without triggers.";
            }
        } else {
            if (category === "Caching & Performance") {
                nodes = [
                    { x: 100, y: 200, label: "App Server", icon: "🖥️", status: "active" },
                    { x: 300, y: 120, label: "Redis Cache", icon: "⚡", status: isCorrect ? "success" : "warning" },
                    { x: 450, y: 240, label: "Postgres DB", icon: "🗄️", status: isCorrect ? "active" : "error" }
                ];
                links = [
                    { id: "s-to-c", d: "M 124 200 Q 200 150 276 130" },
                    { id: "s-to-d", d: "M 124 200 Q 280 230 426 240" },
                    { id: "c-to-d", d: "M 324 130 L 426 230" }
                ];
                if (isCorrect) {
                    flows = [
                        { path: "M 124 200 Q 200 150 276 130", status: "success", dur: "1.5s" },
                        { path: "M 276 130 L 124 200", status: "success", dur: "1.5s", begin: "0.7s" }
                    ];
                    explanationText = "Cache hit! Read gets high-performance results from Redis immediately. Minimal load on Postgres source of truth.";
                } else {
                    flows = [
                        { path: "M 124 200 Q 200 150 276 130", status: "warning", dur: "1.5s" },
                        { path: "M 124 200 Q 280 230 426 240", status: "error", dur: "1s", begin: "0.5s" }
                    ];
                    explanationText = "Cache miss or stampede. Request falls through directly to the database. Heavy concurrent queries overload Postgres.";
                }
            } else if (category === "Databases & Indexing") {
                nodes = [
                    { x: 100, y: 200, label: "App server", icon: "🖥️", status: "active" },
                    { x: 450, y: 100, label: "Primary Shard", icon: "🗄️", status: isCorrect ? "success" : "warning" },
                    { x: 450, y: 300, label: "Replica / Shard 2", icon: "🗄️", status: isCorrect ? "success" : "error" }
                ];
                links = [
                    { id: "s-to-p", d: "M 124 200 L 426 100" },
                    { id: "s-to-r", d: "M 124 200 L 426 300" }
                ];
                if (isCorrect) {
                    flows = [
                        { path: "M 124 200 L 426 100", status: "success", dur: "1.8s" },
                        { path: "M 426 100 L 124 200", status: "success", dur: "1.8s", begin: "0.9s" }
                    ];
                    explanationText = "Optimized routing: reads and writes land on correct nodes without replication locks or expensive queries.";
                } else {
                    flows = [
                        { path: "M 124 200 L 426 100", status: "error", dur: "1s" },
                        { path: "M 124 200 L 426 300", status: "error", dur: "1.2s", begin: "0.1s" }
                    ];
                    explanationText = "Unoptimized query path: scattered reads force scans across all shards, causing latency spikes and OOM warnings.";
                }
            } else if (category === "Resilience & Deployment") {
                nodes = [
                    { x: 100, y: 200, label: "API Gateway", icon: "🚪", status: "active" },
                    { x: 300, y: 200, label: "Service Handler", icon: "⚙️", status: isCorrect ? "success" : "warning" },
                    { x: 500, y: 200, label: "Dependency API", icon: "🛑", status: "error" }
                ];
                links = [
                    { id: "g-to-s", d: "M 124 200 L 276 200" },
                    { id: "s-to-d", d: "M 324 200 L 476 200" }
                ];
                if (isCorrect) {
                    flows = [
                        { path: "M 124 200 L 276 200", status: "success", dur: "1.5s" },
                        { path: "M 276 200 L 124 200", status: "warning", dur: "1.5s", begin: "0.6s" }
                    ];
                    explanationText = "Circuit breaker OPEN: Service detects dependency error, fails fast immediately, protecting thread pool from exhaustion.";
                } else {
                    flows = [
                        { path: "M 124 200 L 276 200", status: "error", dur: "2.5s" },
                        { path: "M 276 200 L 476 200", status: "error", dur: "2.5s", begin: "0.5s" }
                    ];
                    explanationText = "No circuit isolation: connection pool hangs waiting on downstream timeouts. Thread pool starves and entire system crashes.";
                }
            } else {
                nodes = [
                    { x: 150, y: 200, label: "Client App", icon: "📱", status: "active" },
                    { x: 450, y: 200, label: "Server Node", icon: "🖥️", status: isCorrect ? "success" : "error" }
                ];
                links = [
                    { id: "c-to-s", d: "M 174 200 L 426 200" }
                ];
                flows = [
                    { path: "M 174 200 L 426 200", status: isCorrect ? "success" : "error", dur: "2s" }
                ];
                explanationText = isCorrect 
                    ? "Correct architectural flow! Safe communication pathways established." 
                    : "Architectural bottleneck detected. Packets are delayed or lost.";
            }
        }
    } else {
        nodes = [
            { x: 150, y: 200, label: "Input Data", icon: "📥", status: "active" },
            { x: 450, y: 200, label: "Output State", icon: "📤", status: isCorrect ? "success" : "error" }
        ];
        links = [
            { id: "link-main", d: "M 174 200 L 426 200" }
        ];
        flows = [
            { path: "M 174 200 L 426 200", status: isCorrect ? "success" : "error", dur: "1.8s" }
        ];
        explanationText = isCorrect 
            ? "Algorithm executed optimally inside target constraints!" 
            : "Inefficient execution: violates memory boundaries or time limits.";
    }

    return { nodes, links, flows, explanationText };
}

// Play / Pause simulation animation
document.getElementById('sim-play-pause-btn').addEventListener('click', () => {
    const svg = document.getElementById('sim-svg-canvas');
    const animates = svg.querySelectorAll('animateMotion');
    const label = document.getElementById('sim-status-label');
    const btn = document.getElementById('sim-play-pause-btn');

    if (btn.innerHTML.includes('Pause')) {
        animates.forEach(a => a.endElement());
        btn.innerHTML = '<i class="fas fa-play"></i> Resume';
        label.textContent = 'Paused';
    } else {
        animates.forEach(a => a.beginElement());
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        label.textContent = 'Simulating...';
    }
});

document.getElementById('sim-reset-btn').addEventListener('click', () => {
    const previousAns = state.activeQuest.previous_answer || state.userProgress[state.activeQuest.id];
    const answeredKey = previousAns ? previousAns.answered : state.selectedOption;
    startFlowSimulation(answeredKey);
});

// ==========================================================================
// Gemini LLM Diagnostic Feedback API Call
// ==========================================================================
async function generateAIFeedback() {
    const topicId = state.activeTopic.id;
    const progress = state.userProgress || {};
    
    if (Object.keys(progress).length === 0) {
        alert("You must answer at least one quest before triggering the AI Diagnostic Report.");
        return;
    }

    const outputDiv = document.getElementById('ai-feedback-output');
    outputDiv.style.display = 'block';
    outputDiv.innerHTML = `
        <div class="feedback-spinner">
            <i class="fas fa-circle-notch fa-spin"></i> Analyzing score parameters and generating architect report...
        </div>
    `;

    const catScores = {};
    state.quests.forEach(q => {
        if (!catScores[q.category]) {
            catScores[q.category] = { correct: 0, total: 0 };
        }
        
        const prog = progress[q.id];
        if (prog) {
            catScores[q.category].total++;
            if (prog.correct) {
                catScores[q.category].correct++;
            }
        }
    });

    const totalCompleted = Object.keys(progress).length;
    let correctCount = 0;
    Object.values(progress).forEach(p => {
        if (p.correct) correctCount++;
    });
    const overallScore = totalCompleted > 0 ? (correctCount / totalCompleted) * 100 : 0;

    const payload = {
        topic_id: topicId,
        score: overallScore,
        total_completed: totalCompleted,
        total_questions: state.quests.length,
        category_scores: catScores
    };

    try {
        const res = await apiFetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gemini-API-Key': state.geminiApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Server failed to generate feedback");
        }

        const data = await res.json();
        
        // Render markdown
        outputDiv.innerHTML = marked.parse(data.feedback);
        
        // Refresh profile if coins were deducted
        if (data.coin_bypass) {
            await fetchCurrentUser();
            alert("10 coins deducted from your balance for AI report generation.");
        }
    } catch (e) {
        console.error(e);
        outputDiv.innerHTML = `
            <div class="card error-message" style="border-color: var(--incorrect); background-color: var(--incorrect-glow); color: var(--text-primary); padding: 16px;">
                <h4><i class="fas fa-exclamation-triangle"></i> AI Report Failed</h4>
                <p style="margin-top: 8px; font-size: 0.9rem;">${e.message}</p>
                <p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">Unlock requires either 10 coins (you have ${state.currentUser ? state.currentUser.coin_balance : 0}) OR a custom Gemini Key.</p>
            </div>
        `;
    }
}
