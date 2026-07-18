/**
 * Tech Mastery Portal & System Design Quest Simulator
 * Core Application Script
 */

// ==========================================================================
// Application State
// ==========================================================================
const state = {
    activeScreen: 'landing', // 'landing' | 'simulator'
    activeTopic: null,       // topic object from API
    quests: [],              // quests list for the active topic
    activeQuest: null,       // current quest object with full details
    selectedOption: null,    // A, B, C, D selected by user
    userProgress: {},        // { topic_id: { quest_id: { answered: string, correct: boolean } } }
    geminiApiKey: '',        // Gemini API key
    isDarkTheme: true,       // theme state
    simTimer: null           // timer for animations
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
// Document Ready & Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadSettings();
    applyTheme();
    setupEventListeners();
    fetchTopics();
}

// Load configurations from LocalStorage
function loadSettings() {
    state.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    document.getElementById('gemini-key-input').value = state.geminiApiKey;

    const progressStr = localStorage.getItem('user_progress');
    if (progressStr) {
        try {
            state.userProgress = JSON.parse(progressStr);
        } catch (e) {
            state.userProgress = {};
        }
    }

    state.isDarkTheme = localStorage.getItem('theme') !== 'light';
    
    // Update API Key indicator
    updateApiKeyStatus();
}

function updateApiKeyStatus() {
    const keyBtn = document.getElementById('open-settings-btn');
    const aiStatus = document.getElementById('ai-status');
    
    if (state.geminiApiKey) {
        keyBtn.classList.remove('btn-primary');
        keyBtn.classList.add('btn-secondary');
        keyBtn.innerHTML = `<i class="fas fa-check-circle text-glow-primary"></i> <span>Key Configured</span>`;
        if (aiStatus) {
            aiStatus.textContent = "AI Model Ready";
            aiStatus.className = "ai-status-tag active";
        }
    } else {
        keyBtn.classList.remove('btn-secondary');
        keyBtn.classList.add('btn-primary');
        keyBtn.innerHTML = `<i class="fas fa-key"></i> <span>Gemini API Key</span>`;
        if (aiStatus) {
            aiStatus.textContent = "Waiting for key...";
            aiStatus.className = "ai-status-tag";
        }
    }
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

// Setup Header & Control Interactions
function setupEventListeners() {
    // Header Logo returns to home
    document.getElementById('header-logo-btn').addEventListener('click', showLandingScreen);
    document.getElementById('back-to-home-btn').addEventListener('click', showLandingScreen);

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        state.isDarkTheme = !state.isDarkTheme;
        localStorage.setItem('theme', state.isDarkTheme ? 'dark' : 'light');
        applyTheme();
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
        updateApiKeyStatus();
        settingsModal.classList.remove('active');
    });

    document.getElementById('reset-progress-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all test answers and scores? This cannot be undone.")) {
            state.userProgress = {};
            localStorage.removeItem('user_progress');
            updateOverallProgress();
            if (state.activeTopic) {
                renderQuestList();
                showDashboard();
            }
            settingsModal.classList.remove('active');
            alert("Progress has been reset.");
        }
    });

    // Sidebar Category Filter
    document.getElementById('category-filter').addEventListener('change', (e) => {
        renderQuestList(e.target.value);
    });

    // Dashboard navigation
    document.getElementById('view-dashboard-btn').addEventListener('click', showDashboard);

    // Submit Answer Action
    document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);

    // AI Feedback request
    document.getElementById('trigger-ai-feedback-btn').addEventListener('click', generateAIFeedback);
}

// ==========================================================================
// Screen Transitions
// ==========================================================================
function showLandingScreen() {
    state.activeScreen = 'landing';
    state.activeTopic = null;
    document.getElementById('landing-screen').classList.add('active');
    document.getElementById('simulator-screen').classList.remove('active');
    fetchTopics(); // Refresh topic progresses
}

function showSimulatorScreen(topic) {
    state.activeScreen = 'simulator';
    state.activeTopic = topic;
    document.getElementById('landing-screen').classList.remove('active');
    document.getElementById('simulator-screen').classList.add('active');

    // Reset filters
    document.getElementById('category-filter').value = 'all';

    // Load quests lists
    fetchQuestsForTopic(topic.id);
}

// ==========================================================================
// API Operations
// ==========================================================================
async function fetchTopics() {
    try {
        const res = await fetch('/api/topics');
        if (!res.ok) throw new Error("Failed to load topics");
        const topics = await res.json();
        renderTopicGrid(topics);
    } catch (e) {
        console.error(e);
        document.getElementById('topics-grid').innerHTML = `<div class="card error-message"><p>Error connecting to backend server. Please verify FastAPI is running.</p></div>`;
    }
}

async function fetchQuestsForTopic(topicId) {
    try {
        const res = await fetch(`/api/quests/${topicId}`);
        if (!res.ok) throw new Error("Failed to load quests");
        state.quests = await res.json();
        
        // Populating categories dropdown
        populateCategoryFilter();
        
        // Update Ring progress
        updateOverallProgress();

        // Render quest list sidebar
        renderQuestList();

        // Load dashboard by default
        showDashboard();
    } catch (e) {
        console.error(e);
        alert("Failed to load topic questions: " + e.message);
    }
}

async function fetchQuestDetail(questId) {
    try {
        const res = await fetch(`/api/quests/${state.activeTopic.id}/${questId}`);
        if (!res.ok) throw new Error("Failed to load question details");
        state.activeQuest = await res.json();
        
        showQuestWorkspace();
    } catch (e) {
        console.error(e);
        alert("Error loading question: " + e.message);
    }
}

// ==========================================================================
// Rendering Elements
// ==========================================================================
function renderTopicGrid(topics) {
    const grid = document.getElementById('topics-grid');
    grid.innerHTML = '';

    topics.forEach(t => {
        const progress = getTopicProgressMetrics(t.id, t.questions_count);
        const card = document.createElement('div');
        card.className = 'topic-card card';
        
        card.innerHTML = `
            <div class="topic-icon">${t.icon}</div>
            <h3 class="topic-name">${t.name}</h3>
            <p class="topic-desc">${t.description}</p>
            <div class="topic-progress-section">
                <div class="progress-label-row">
                    <span>Progress</span>
                    <span>${progress.completed}/${t.questions_count} Quests</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progress.pct}%"></div>
                </div>
            </div>
            <div class="topic-action">
                <button class="btn btn-secondary btn-sm">Enter Practice</button>
            </div>
        `;

        card.addEventListener('click', () => showSimulatorScreen(t));
        grid.appendChild(card);
    });
}

function getTopicProgressMetrics(topicId, totalCount) {
    const progress = state.userProgress[topicId] || {};
    const completed = Object.keys(progress).length;
    const pct = totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0;
    return { completed, pct };
}

function populateCategoryFilter() {
    const filter = document.getElementById('category-filter');
    // Keep first option (All Categories)
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    // Extract unique categories
    const categories = [...new Set(state.quests.map(q => q.category))];
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        filter.appendChild(opt);
    });
}

function updateOverallProgress() {
    const topicId = state.activeTopic.id;
    const total = state.quests.length;
    const metrics = getTopicProgressMetrics(topicId, total);

    document.getElementById('overall-pct').textContent = `${metrics.pct}%`;
    document.getElementById('overall-count').textContent = `${metrics.completed}/${total}`;
    
    const ringOffset = 251.2 - (251.2 * metrics.pct) / 100;
    document.getElementById('overall-progress-bar').style.strokeDashoffset = ringOffset;

    // Calculate ranking based on correctness percentage
    const progress = state.userProgress[topicId] || {};
    let correctCount = 0;
    Object.values(progress).forEach(ans => {
        if (ans.correct) correctCount++;
    });

    const correctPct = metrics.completed > 0 ? (correctCount / metrics.completed) * 100 : 0;
    let rank = "Novice Developer";
    
    if (metrics.completed > 0) {
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

    const progress = state.userProgress[state.activeTopic.id] || {};

    state.quests.forEach(q => {
        if (filterCategory !== 'all' && q.category !== filterCategory) return;

        const li = document.createElement('li');
        li.className = 'quest-item';
        if (state.activeQuest && state.activeQuest.id === q.id) {
            li.classList.add('active');
        }

        const prog = progress[q.id];
        let statusHtml = '<i class="far fa-circle quest-status-icon unstarted"></i>';
        if (prog) {
            statusHtml = prog.correct 
                ? '<i class="fas fa-check-circle quest-status-icon correct"></i>'
                : '<i class="fas fa-times-circle quest-status-icon incorrect"></i>';
        }

        li.innerHTML = `
            <div class="quest-item-content">
                <span class="quest-item-day">DAY ${String(q.id).padStart(2, '0')}</span>
                <span class="quest-item-title" title="${q.title}">${q.title}</span>
            </div>
            ${statusHtml}
        `;

        li.addEventListener('click', () => fetchQuestDetail(q.id));
        list.appendChild(li);
    });
}

// Show the component category score diagnostics
function showDashboard() {
    state.activeQuest = null;
    
    // Toggle sidebars active status
    const listItems = document.querySelectorAll('.quest-item');
    listItems.forEach(item => item.classList.remove('active'));

    document.getElementById('active-quest-panel').style.display = 'none';
    document.getElementById('dashboard-widget-panel').style.display = 'block';

    const topicId = state.activeTopic.id;
    const progress = state.userProgress[topicId] || {};

    // Group quests by category and count correctness
    const catStats = {};
    state.quests.forEach(q => {
        if (!catStats[q.category]) {
            catStats[q.category] = { total: 0, completed: 0, correct: 0 };
        }
        catStats[q.category].total++;
        
        const prog = progress[q.id];
        if (prog) {
            catStats[q.category].completed++;
            if (prog.correct) {
                catStats[q.category].correct++;
            }
        }
    });

    // Render Diagnostic Category Cards
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

    // Reset AI Feedback output
    document.getElementById('ai-feedback-output').style.display = 'none';
    document.getElementById('ai-feedback-output').innerHTML = '';
}

// Show the simulator workspace for selected question
function showQuestWorkspace() {
    document.getElementById('dashboard-widget-panel').style.display = 'none';
    document.getElementById('active-quest-panel').style.display = 'block';

    // Highlight active sidebar item
    renderQuestList(document.getElementById('category-filter').value);

    // Update details
    const q = state.activeQuest;
    document.getElementById('quest-day-num').textContent = `DAY ${String(q.id).padStart(2, '0')}`;
    document.getElementById('quest-cat-pill').textContent = q.category;
    document.getElementById('quest-title-text').textContent = q.title;
    document.getElementById('quest-scenario-text').textContent = q.scenario;

    // Reset submit button state
    state.selectedOption = null;
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn.textContent = "Submit Architecture Selection";
    submitBtn.disabled = true;

    // Check if previously answered
    const progress = state.userProgress[state.activeTopic.id] || {};
    const previousAns = progress[q.id];

    // Render options
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
            // Disable interactions and show results
            if (opt.key === q.correct_answer) {
                card.classList.add('correct-answer-reveal');
            } else if (previousAns.answered === opt.key) {
                // If wrong, highlight it as incorrect. If it was a trap, we could style it.
                card.classList.add('incorrect-answer-reveal');
            }
        } else {
            // Setup clicks
            card.addEventListener('click', () => selectOption(opt.key));
        }

        optionsList.appendChild(card);
    });

    // Reset simulation panel
    document.getElementById('sim-play-pause-btn').disabled = true;
    document.getElementById('sim-reset-btn').disabled = true;
    document.getElementById('sim-status-label').textContent = 'Idle';
    document.getElementById('sim-explanation-text').textContent = 'Select an option to simulate the flow.';

    // Generate static simulation SVG schema
    renderSimulationSchema();

    // Show answers detail if already answered
    if (previousAns) {
        revealAnswerPanel(previousAns.answered, previousAns.correct);
        
        // Unlock simulation controls
        document.getElementById('sim-play-pause-btn').disabled = false;
        document.getElementById('sim-reset-btn').disabled = false;
        
        // Auto play animation
        startFlowSimulation(previousAns.answered);
    } else {
        document.getElementById('explanation-card').style.display = 'none';
    }
}

function selectOption(key) {
    state.selectedOption = key;
    
    // Highlight UI card
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => {
        if (c.dataset.key === key) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });

    document.getElementById('submit-answer-btn').disabled = false;
    
    // Draw pre-simulation schema for selected option
    renderSimulationSchema(key);
}

function submitAnswer() {
    if (!state.selectedOption || !state.activeQuest) return;

    const q = state.activeQuest;
    const topicId = state.activeTopic.id;
    const isCorrect = state.selectedOption === q.correct_answer;

    // Save progress locally
    if (!state.userProgress[topicId]) {
        state.userProgress[topicId] = {};
    }
    state.userProgress[topicId][q.id] = {
        answered: state.selectedOption,
        correct: isCorrect
    };
    localStorage.setItem('user_progress', JSON.stringify(state.userProgress));

    // Update progress charts
    updateOverallProgress();

    // Highlight options cards (Correct, Wrong, Trap)
    const cards = document.querySelectorAll('.option-card');
    cards.forEach(c => {
        c.classList.remove('selected');
        const key = c.dataset.key;
        if (key === q.correct_answer) {
            c.classList.add('correct-answer-reveal');
        } else if (key === state.selectedOption) {
            c.classList.add('incorrect-answer-reveal');
        }
        
        // Remove event listeners
        const newCard = c.cloneNode(true);
        c.parentNode.replaceChild(newCard, c);
    });

    // Reveal Answers details panel
    revealAnswerPanel(state.selectedOption, isCorrect);

    // Disable submit button, unlock simulation play/reset
    document.getElementById('submit-answer-btn').disabled = true;
    document.getElementById('sim-play-pause-btn').disabled = false;
    document.getElementById('sim-reset-btn').disabled = false;

    // Trigger simulation flow animation
    startFlowSimulation(state.selectedOption);
}

function revealAnswerPanel(answeredKey, isCorrect) {
    const q = state.activeQuest;
    const card = document.getElementById('explanation-card');
    card.style.display = 'block';

    const badge = document.getElementById('explanation-badge');
    const headerTitle = document.getElementById('explanation-status-header');

    badge.className = 'status-badge';
    if (isCorrect) {
        badge.classList.add('correct');
        badge.textContent = 'Correct Answer';
        document.getElementById('explanation-title-text').textContent = `Success: Why Option ${answeredKey} Wins`;
    } else {
        // Is it a trap answer? Let's check explanation text for "trap" keyword
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

    // Load correct explanation
    document.getElementById('explanation-body-text').innerHTML = formatExplanationText(q.explanations[q.correct_answer]);

    // Load other explanations
    const otherContainer = document.getElementById('other-options-explanations');
    otherContainer.innerHTML = '';

    Object.entries(q.explanations).forEach(([key, text]) => {
        if (key === q.correct_answer) return; // already displayed as main body
        
        const optDiv = document.createElement('div');
        optDiv.className = 'other-opt-exp';
        optDiv.innerHTML = `<strong>Option ${key}:</strong> ${formatExplanationText(text)}`;
        otherContainer.appendChild(optDiv);
    });
}

function formatExplanationText(text) {
    if (!text) return '';
    // Format bold checkmarks or ticks
    let clean = text.replace(/✓ CORRECT ANSWER/gi, '')
                    .replace(/✅/g, '✔️');
    return clean;
}

// ==========================================================================
// SVG Flow Simulation Engine
// ==========================================================================
function renderSimulationSchema(selectedKey = null) {
    const svg = document.getElementById('sim-svg-canvas');
    svg.innerHTML = ''; // Clear canvas
    
    if (!state.activeQuest) return;
    
    const category = state.activeQuest.category;
    const dayId = state.activeQuest.id;
    const topicId = state.activeTopic.id;

    // Define simulation nodes and paths based on category/day
    let schema = getSimulationSchema(topicId, category, dayId, selectedKey);
    
    // Draw Links
    schema.links.forEach(l => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', l.id);
        path.setAttribute('d', l.d);
        path.setAttribute('class', `sim-link ${l.style || ''}`);
        svg.appendChild(path);
    });

    // Draw Nodes
    schema.nodes.forEach(n => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', n.r || 24);
        circle.setAttribute('class', `node-circle ${n.status || ''}`);
        g.appendChild(circle);

        // Add FontAwesome Icon inside node
        if (n.icon) {
            const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            iconText.setAttribute('class', 'node-icon');
            iconText.setAttribute('y', -2);
            iconText.textContent = n.icon;
            g.appendChild(iconText);
        }

        // Add Labels
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
    const isCorrect = answeredKey === state.activeQuest.correct_answer;

    // Reset previous packets
    const oldPackets = svg.querySelectorAll('.packet');
    oldPackets.forEach(p => p.remove());

    let schema = getSimulationSchema(topicId, category, dayId, answeredKey);

    // Update nodes status to simulate action
    document.getElementById('sim-status-label').textContent = 'Simulating...';
    document.getElementById('sim-explanation-text').textContent = schema.explanationText;

    // Play/Pause button state
    const playBtn = document.getElementById('sim-play-pause-btn');
    playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    
    // Inject animated packets
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
    
    // Default base structure
    let nodes = [];
    let links = [];
    let flows = [];
    let explanationText = "";

    // 1. SYSTEM DESIGN TOPIC SIMULATOR DEFINITIONS
    if (topicId === 'system_design') {
        if (dayId === 1) {
            // Day 01: Decoupling Mobile from Backend Services
            if (selectedKey === 'A') { // API Gateway (Correct)
                nodes = [
                    { x: 100, y: 200, label: "Mobile App", icon: "📱", status: "active" },
                    { x: 280, y: 200, label: "API Gateway", icon: "🚪", status: "success" },
                    { x: 480, y: 100, label: "UserService", icon: "👤" },
                    { x: 480, y: 180, label: "OrderService", icon: "📦" },
                    { x: 480, y: 260, label: "PaymentService", icon: "💳" },
                    { x: 480, y: 340, label: "Notification", icon: "🔔", status: "active" } // new service
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
            } else { // Direct coupling / Load Balancer / BFF / Federation
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
            // Day 02: Killing the N+1 Query Problem
            if (selectedKey === 'A') { // JOIN (Correct)
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
            } else { // Lazy load N+1
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
            // Day 03: Rate Limiting Without Boundary Bursts
            if (selectedKey === 'C') { // Token Bucket (Correct)
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
            } else { // Fixed Window (A/B/D)
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
            // General Dynamic Simulation based on Category
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
                        { path: "M 124 200 Q 200 150 276 130", status: "success", dur: "1.5s" }, // hits cache
                        { path: "M 276 130 L 124 200", status: "success", dur: "1.5s", begin: "0.7s" }
                    ];
                    explanationText = "Cache hit! Read gets high-performance results from Redis immediately. Minimal load on Postgres source of truth.";
                } else {
                    flows = [
                        { path: "M 124 200 Q 200 150 276 130", status: "warning", dur: "1.5s" }, // miss
                        { path: "M 124 200 Q 280 230 426 240", status: "error", dur: "1s", begin: "0.5s" } // hit DB hard
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
                    { x: 500, y: 200, label: "Dependency API", icon: "🛑", status: "error" } // failing downstream
                ];
                links = [
                    { id: "g-to-s", d: "M 124 200 L 276 200" },
                    { id: "s-to-d", d: "M 324 200 L 476 200" }
                ];
                if (isCorrect) {
                    flows = [
                        { path: "M 124 200 L 276 200", status: "success", dur: "1.5s" },
                        { path: "M 276 200 L 124 200", status: "warning", dur: "1.5s", begin: "0.6s" } // fail fast
                    ];
                    explanationText = "Circuit breaker OPEN: Service detects dependency error, fails fast immediately, protecting thread pool from exhaustion.";
                } else {
                    flows = [
                        { path: "M 124 200 L 276 200", status: "error", dur: "2.5s" },
                        { path: "M 276 200 L 476 200", status: "error", dur: "2.5s", begin: "0.5s" } // slow / hangs
                    ];
                    explanationText = "No circuit isolation: connection pool hangs waiting on downstream timeouts. Thread pool starves and entire system crashes.";
                }
            } else {
                // Default fallback visual
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
        // 2. MOCK TOPICS (DSA, ETL, Spring) SIMULATOR DEFINITIONS
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
        animates.forEach(a => a.endElement()); // pauses the loops
        btn.innerHTML = '<i class="fas fa-play"></i> Resume';
        label.textContent = 'Paused';
    } else {
        animates.forEach(a => a.beginElement()); // resumes loops
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        label.textContent = 'Simulating...';
    }
});

// Reset simulation animation
document.getElementById('sim-reset-btn').addEventListener('click', () => {
    const answeredKey = state.userProgress[state.activeTopic.id][state.activeQuest.id].answered;
    startFlowSimulation(answeredKey);
});

// ==========================================================================
// Gemini LLM Diagnostic Feedback API Call
// ==========================================================================
async function generateAIFeedback() {
    const topicId = state.activeTopic.id;
    const progress = state.userProgress[topicId] || {};
    
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

    // Group scores by category
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
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gemini-API-Key': state.geminiApiKey // send key in custom header
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Server failed to generate feedback");
        }

        const data = await res.json();
        
        // Render markdown result using 'marked' library
        outputDiv.innerHTML = marked.parse(data.feedback);
        
    } catch (e) {
        console.error(e);
        outputDiv.innerHTML = `
            <div class="card error-message" style="border-color: var(--incorrect); background-color: var(--incorrect-glow); color: var(--text-primary); padding: 16px;">
                <h4><i class="fas fa-exclamation-triangle"></i> AI Report Failed</h4>
                <p style="margin-top: 8px; font-size: 0.9rem;">${e.message}</p>
                <p style="margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">Verify your Gemini API key is valid in settings (top right key icon) and that you are connected to the network.</p>
            </div>
        `;
    }
}
