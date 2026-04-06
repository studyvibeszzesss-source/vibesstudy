// Tab Navigation
function showTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.navbar .tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// Theme helper
function applyTheme(theme) {
    const root = document.documentElement;
    const normalizedTheme = theme === 'default' ? 'pastel-breeze' : theme;

    // Apply the theme data attribute
    root.setAttribute('data-theme', normalizedTheme);

    // Save to localStorage for other pages
    localStorage.setItem('selected-theme', normalizedTheme);
}

function setTheme(themeName) {
    applyTheme(themeName);
}

function resetTheme() {
    applyTheme('pastel-breeze');
}

function updateDarkModeState(state, save = true) {
    const isDark = state === 'on';
    document.body.classList.toggle('dark-mode', isDark);
    if (save) {
        localStorage.setItem('dark-mode', isDark ? 'on' : 'off');
    }
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

function toggleDarkMode() {
    const nextState = document.body.classList.contains('dark-mode') ? 'off' : 'on';
    updateDarkModeState(nextState);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('vibeUser');
        window.location.href = 'login.html';
    }
}

// Update welcome header on home page
function updateWelcomeHeader() {
    const welcomeHeader = document.getElementById('welcomeHeader');
    if (!welcomeHeader) return;
    
    const userData = JSON.parse(localStorage.getItem('vibeUser') || 'null');
    if (userData && userData.name) {
        welcomeHeader.textContent = `✨ WELCOME ${userData.name.toUpperCase()}`;
    }
}

// Load theme preference and check login on page load
window.addEventListener('load', () => {
    // Apply selected theme before anything else
    const savedTheme = localStorage.getItem('selected-theme') || localStorage.getItem('selectedTheme') || 'pastel-breeze';
    applyTheme(savedTheme);
    const darkModeState = localStorage.getItem('dark-mode') || 'off';
    updateDarkModeState(darkModeState, false);

    // Redirect to login if user info not set and not already on login page
    const userData = JSON.parse(localStorage.getItem('vibeUser') || 'null');
    if (!userData && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize user status
    updateUserStatus();
    
    // Update welcome header
    updateWelcomeHeader();
});

// User Status System
function updateUserStatus() {
    const status = getUserStatus();
    localStorage.setItem('userStatus', status);
    // Update group if in one
    updateGroupUserStatus();
    // Update home page display
    updateHomeStatusDisplay(status);
}

function updateHomeStatusDisplay(status) {
    const dot = document.getElementById('userStatusDot');
    const text = document.getElementById('userStatusText');
    if (!dot || !text) return;

    dot.className = 'dot';
    let statusText = '';

    switch(status) {
        case 'studying':
            dot.classList.add('studying');
            statusText = '🔥 Studying now';
            break;
        case 'online':
            dot.classList.add('online');
            statusText = '🟢 Online';
            break;
        case 'offline':
            dot.classList.add('offline');
            statusText = '⚫ Offline';
            break;
    }

    text.textContent = statusText;
}

function getUserStatus() {
    // Check if timer is running (from timer.js global)
    if (typeof running !== 'undefined' && running) {
        return 'studying';
    }
    // Check if page is visible
    if (document.visibilityState === 'visible') {
        return 'online';
    }
    return 'offline';
}

function updateGroupUserStatus() {
    const currentGroup = localStorage.getItem('currentGroupCode');
    if (!currentGroup) return;

    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[currentGroup];
    if (!group) return;

    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';
    const memberIndex = group.members.findIndex(m => m.name === userName);
    if (memberIndex !== -1) {
        group.members[memberIndex].status = getUserStatus();
        group.members[memberIndex].lastSeen = new Date().toISOString();
        localStorage.setItem('studyGroups', JSON.stringify(groups));
    }
}

// Listen for visibility changes
document.addEventListener('visibilitychange', updateUserStatus);

// Listen for timer start/stop (will be called from timer.js)
window.addEventListener('timerStatusChange', updateUserStatus);

// ========== HOME DASHBOARD FUNCTIONS ==========
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}

function getDailyStudyTime() {
    const today = getTodayDate();
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    let totalMinutes = 0;
    
    sessions.forEach(session => {
        if (session.date && session.date.startsWith(today)) {
            const [h, m, s] = session.time.split(':').map(Number);
            totalMinutes += Math.floor(h) * 60 + Math.floor(m);
        }
    });
    
    const hours = Math.floor(Math.floor(totalMinutes) / 60);
    const minutes = Math.floor(totalMinutes) % 60;
    return { hours: Math.max(0, parseInt(hours) || 0), minutes: Math.max(0, parseInt(minutes) || 0), totalMinutes };
}

function getDailyTasksCount() {
    const todoTasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
    const completedTasks = todoTasks.filter(task => task.completed).length;
    return { completed: completedTasks, total: todoTasks.length };
}

function renderDailyInsights() {
    const studyTime = getDailyStudyTime();
    const tasksCount = getDailyTasksCount();
    
    // Update study time display with strict integer formatting
    const timeElement = document.getElementById('dailyTotalTime');
    if (timeElement) {
        const displayHours = Math.max(0, parseInt(studyTime.hours) || 0);
        const displayMinutes = Math.max(0, parseInt(studyTime.minutes) || 0);
        timeElement.textContent = `${displayHours}h ${String(displayMinutes).padStart(2, '0')}m`;
    }
    
    // Update tasks count
    const tasksElement = document.getElementById('dailyGoalsCount');
    if (tasksElement) {
        tasksElement.textContent = `${tasksCount.completed}/${tasksCount.total} Tasks`;
    }
}

function renderDailyStudyBlocks(dayNumber) {
    const sessionsForDay = getSessionsForDay(dayNumber);
    if (sessionsForDay.length === 0) {
        return '<div class="session-item" style="opacity:0.5; text-align: center; padding: 20px;">No study sessions recorded for this day</div>';
    }

    return `
        <div class="detail-section-title">Study Sessions</div>
        <div class="session-grid">
            ${sessionsForDay.map((session) => {
                const subject = session.label || 'Study Session';
                const startTime = inferStartTime(session);
                const endTime = inferEndTime(session);
                const duration = session.time || '00:00:00';
                const isManual = session.isManual || (!session.startTime && !session.endTime);
                const manualLabel = isManual ? '<span class="manual-label">(Manually Added)</span>' : '';
                // Calculate minutes for validation
                const [h, m, s] = duration.split(':').map(Number);
                const totalMinutes = h * 60 + m;
                const isValidTime = !isManual || (totalMinutes >= 30 && totalMinutes <= 240);
                const invalidLabel = !isValidTime ? '<span class="invalid-label">(Invalid: 30min-4hr required)</span>' : '';
                return `
                    <div class="session-card ${!isValidTime ? 'invalid-session' : ''}">
                        <div class="session-card-header">
                            <div class="session-card-title">📚 ${subject} ${manualLabel} ${invalidLabel}</div>
                            <div class="session-card-duration">${duration}</div>
                        </div>
                        <div class="session-card-times">
                            <div class="session-time-block">
                                <div class="session-time-label">🕐 Start</div>
                                <div class="session-time-value">${startTime}</div>
                            </div>
                            <div class="session-time-block">
                                <div class="session-time-label">🕑 End</div>
                                <div class="session-time-value">${endTime}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderDailyTaskBreakdown(dayNumber) {
    const todoTasks = JSON.parse(localStorage.getItem('todoTasks')) || [];

    if (todoTasks.length === 0) {
        return '<div style="opacity: 0.7; text-align: center;">No tasks yet. Add one to get started!</div>';
    }

    let html = '<div class="detail-section-title">Tasks</div>';
    html += '<div class="task-list-section">';
    todoTasks.forEach(task => {
        const checked = task.completed ? 'checked' : '';
        const labelStyle = task.completed ? 'text-decoration: line-through; opacity: 0.6;' : '';
        html += `
            <div class="task-item-row">
                <input type="checkbox" disabled ${checked} />
                <span style="${labelStyle}">${task.text}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function updateDailyInsight(dayNumber) {
    // Track which day is currently selected
    currentlySelectedDay = dayNumber;
    
    const dateTitle = document.getElementById('viewDateTitle');
    const timeDisplay = document.getElementById('dailyTotalTime');
    const studyBlocks = document.getElementById('dailyStudyBlocks');
    const taskBreakdown = document.getElementById('dailyTaskBreakdown');
    
    if (!dateTitle || !timeDisplay || !studyBlocks || !taskBreakdown) return;

    // Update the Header with month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const monthName = monthNames[now.getMonth()];
    dateTitle.textContent = `📊 Insight for ${monthName} ${dayNumber}`;

    // Get study time for this specific day
    const timeData = getStudyTimeForDay(dayNumber);
    const rawHours = Math.max(0, parseInt(timeData.hours) || 0);
    const rawMinutes = Math.max(0, parseInt(timeData.minutes) || 0);
    timeDisplay.textContent = `${rawHours}h ${String(rawMinutes).padStart(2, '0')}m`;
    
    // Render study sessions and task list in details
    studyBlocks.innerHTML = renderDailyStudyBlocks(dayNumber);
    taskBreakdown.innerHTML = renderDailyTaskBreakdown(dayNumber);

    // Only render chart if overview tab is active
    const overviewPanel = document.getElementById('insightOverview');
    if (overviewPanel && !overviewPanel.classList.contains('hidden')) {
        const sessionsForDay = getSessionsForDay(dayNumber);
        renderTopicPieChart(sessionsForDay, dayNumber);
    }
}


// Get all sessions for a specific day
function getSessionsForDay(dayNumber) {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth();
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    
    return sessions.filter(session => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        return sessionDate.getFullYear() === targetYear &&
               sessionDate.getMonth() === targetMonth &&
               sessionDate.getDate() === dayNumber;
    });
}

// Get study time for a specific day
function getStudyTimeForDay(dayNumber) {
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth();
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    
    let totalMinutes = 0;
    sessions.forEach(session => {
        if (!session.date) return;
        const sessionDate = new Date(session.date);
        if (sessionDate.getFullYear() === targetYear &&
            sessionDate.getMonth() === targetMonth &&
            sessionDate.getDate() === dayNumber) {
            const [h, m, s] = session.time.split(':').map(Number);
            totalMinutes += Math.floor(h) * 60 + Math.floor(m);
        }
    });
    
    const hours = Math.floor(Math.floor(totalMinutes) / 60);
    const minutes = Math.floor(totalMinutes) % 60;
    return { hours: Math.max(0, parseInt(hours) || 0), minutes: Math.max(0, parseInt(minutes) || 0) };
}

function getLocalTimeString(date) {
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function inferStartTime(session) {
    if (session.startTime) return session.startTime;
    if (!session.date || !session.time) return 'N/A';
    const endDate = new Date(session.date);
    const [h, m, s] = session.time.split(':').map(Number);
    const durationMs = (Math.floor(h) * 3600 + Math.floor(m) * 60 + Math.floor(s)) * 1000;
    const startDate = new Date(endDate.getTime() - durationMs);
    return getLocalTimeString(startDate);
}

let topicPieChartInstance = null;
let currentlySelectedDay = null; // Track which day is currently selected in planner

function inferEndTime(session) {
    if (session.endTime) return session.endTime;
    if (!session.date) return 'N/A';
    return getLocalTimeString(session.date);
}

function buildTopicSummary(sessions) {
    const summary = {};
    sessions.forEach(session => {
        const subject = session.label ? session.label.trim() : 'Study Session';
        const [h, m, s] = (session.time || '00:00:00').split(':').map(Number);
        const minutes = Math.floor(h) * 60 + Math.floor(m);
        summary[subject] = (summary[subject] || 0) + minutes;
    });
    return summary;
}

let streakBarChartInstance = null;

function renderTopicPieChart(sessions, dayNumber) {
    const canvas = document.getElementById('topicPieChart');
    const hoursText = document.getElementById('hoursText');
    const legendContainer = document.getElementById('pieLegend');
    const streakSection = document.getElementById('streakSection');
    const streakCanvas = document.getElementById('streakBarChart');
    if (!canvas || !hoursText || !legendContainer || !streakSection || !streakCanvas) {
        console.error('Chart elements not found');
        return;
    }

    if (typeof Chart === 'undefined') {
        hoursText.textContent = 'Chart.js not loaded. Please refresh the page.';
        canvas.style.display = 'none';
        streakSection.style.display = 'none';
        return;
    }

    hoursText.textContent = 'Rendering overview...';
    const topicData = buildTopicSummary(sessions);
    const labels = Object.keys(topicData);
    const values = Object.values(topicData);
    const totalMinutes = values.reduce((sum, value) => sum + value, 0);

    if (topicPieChartInstance) {
        topicPieChartInstance.destroy();
        topicPieChartInstance = null;
    }

    if (labels.length === 0) {
        canvas.style.display = 'none';
        hoursText.textContent = 'No study data for this day';
        streakSection.style.display = 'none';
        return;
    }

    canvas.style.display = 'block';
    canvas.width = 250;
    canvas.height = 280;

    // Get theme colors
    const root = document.documentElement;
    const accent1 = getComputedStyle(root).getPropertyValue('--accent-1').trim();
    const accent2 = getComputedStyle(root).getPropertyValue('--accent-2').trim();
    const accent3Raw = getComputedStyle(root).getPropertyValue('--accent-3').trim();
    const accent3 = accent3Raw || accent2;
    const colors = [
        `rgba(${hexToRgbHome(accent1)}, 0.85)`,
        `rgba(${hexToRgbHome(accent2)}, 0.85)`,
        `rgba(${hexToRgbHome(accent3)}, 0.85)`,
        `rgba(${hexToRgbHome(accent1)}, 0.55)`,
        `rgba(${hexToRgbHome(accent2)}, 0.55)`,
        `rgba(${hexToRgbHome(accent3)}, 0.55)`,
        'rgba(234, 179, 8, 0.85)',
        'rgba(244, 63, 94, 0.85)'
    ];

    const chartColors = labels.map((_, index) => colors[index % colors.length]);

    try {
        topicPieChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: chartColors,
                    borderColor: 'rgba(255,255,255,0.8)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: false,
                cutout: '50%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                const minutes = context.raw;
                                const percent = totalMinutes ? ((minutes / totalMinutes) * 100).toFixed(1) : '0.0';
                                return `${context.label}: ${minutes} min (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating pie chart:', error);
        canvas.style.display = 'none';
        hoursText.textContent = 'Error loading chart';
        streakSection.style.display = 'none';
        return;
    }

    // Set hours text
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    hoursText.textContent = `Total: ${totalHours}h ${remainingMinutes}m studied`;

    legendContainer.innerHTML = labels.map((label, index) => {
        const minutes = values[index];
        const percent = totalMinutes ? ((minutes / totalMinutes) * 100).toFixed(1) : '0.0';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const durationText = `${hours}h ${String(mins).padStart(2, '0')}m`;
        return `
            <div class="pie-legend-item">
                <div class="pie-legend-title">
                    <span class="pie-legend-swatch" style="background:${chartColors[index]};"></span>
                    <span>${label}</span>
                </div>
                <div class="pie-legend-details">
                    <span>${durationText}</span>
                    <span>${percent}%</span>
                </div>
            </div>
        `;
    }).join('');

    // Hide streak section for now
    streakSection.style.display = 'none';
}

function renderStreakBarChart(canvas) {
    if (!canvas) return;

    if (streakBarChartInstance) {
        streakBarChartInstance.destroy();
        streakBarChartInstance = null;
    }

    canvas.width = 300;
    canvas.height = 280;

    // Get last 7 days study data
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayStr = date.toISOString().slice(0, 10);
        const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
        let minutes = 0;
        sessions.forEach(session => {
            if (session.date && session.date.startsWith(dayStr)) {
                const [h, m] = session.time.split(':').map(Number);
                minutes += h * 60 + m;
            }
        });
        labels.push(`Day ${7 - i}`);
        data.push(Math.floor(minutes / 60)); // hours
    }

    try {
        streakBarChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Hours Studied',
                    data,
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (error) {
        console.error('Error creating bar chart:', error);
    }
}

function setupInsightTabs() {
    const tabs = document.querySelectorAll('.insight-tab');
    const panels = document.querySelectorAll('.insight-tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', (event) => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(panel => panel.classList.add('hidden'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            const activePanel = document.querySelector(`#insight${target.charAt(0).toUpperCase() + target.slice(1)}`);
            if (activePanel) activePanel.classList.remove('hidden');

            if (target === 'overview') {
                setTimeout(() => {
                    // Use the currently selected day, or fall back to today
                    const dayNumber = currentlySelectedDay || new Date().getDate();
                    const sessionsForDay = getSessionsForDay(dayNumber);
                    renderTopicPieChart(sessionsForDay, dayNumber);
                }, 100);
            } else if (target === 'details') {
                // Destroy chart when switching away to free resources
                if (topicPieChartInstance) {
                    topicPieChartInstance.destroy();
                    topicPieChartInstance = null;
                }
            }
        });
    });
}

function renderMonthlyCalendarHome() {
    const calendarContainer = document.getElementById('monthlyCalendarGrid');
    if (!calendarContainer) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    calendarContainer.innerHTML = '';

    // Add month/year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthYearHeader = document.createElement('div');
    monthYearHeader.className = 'calendar-header';
    monthYearHeader.textContent = `${monthNames[month]} ${year}`;
    calendarContainer.appendChild(monthYearHeader);

    // Add weekday names
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdayNames.forEach(day => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'calendar-weekday';
        weekdayEl.textContent = day;
        calendarContainer.appendChild(weekdayEl);
    });

    // Get current theme accent color
    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent-1').trim();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-empty';
        calendarContainer.appendChild(emptyCell);
    }

    // Add day tiles
    for (let day = 1; day <= daysInMonth; day++) {
        const dayTile = document.createElement('div');
        dayTile.className = 'calendar-day';
        
        const timeData = getStudyTimeForDay(day);
        const { hours, minutes } = timeData;
        let bgColor = 'transparent';
        if (hours >= 7) {
            bgColor = accentColor;
            bgColor = `rgba(${hexToRgbHome(accentColor)}, 1)`;
        } else if (hours >= 4) {
            bgColor = `rgba(${hexToRgbHome(accentColor)}, 0.6)`;
        } else if (hours >= 0.5) {
            bgColor = `rgba(${hexToRgbHome(accentColor)}, 0.3)`;
        }
        
        dayTile.style.backgroundColor = bgColor;
        dayTile.style.color = bgColor !== 'transparent' ? 'white' : 'inherit';
        const displayHours = Math.max(0, parseInt(hours) || 0);
        const displayMinutes = Math.max(0, parseInt(minutes) || 0);
        dayTile.innerHTML = `<span>${day}</span><br><small>${displayHours}h ${String(displayMinutes).padStart(2, '0')}m</small>`;
        
        // Add click handler for day selection
        dayTile.style.cursor = 'pointer';
        dayTile.addEventListener('click', () => {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected-day'));
            dayTile.classList.add('selected-day');
            updateDailyInsight(day);
        });
        
        calendarContainer.appendChild(dayTile);
    }
}

function hexToRgbHome(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
}

// Initialize dashboard on page load
window.addEventListener('load', () => {
    renderDailyInsights();
    renderMonthlyCalendarHome();
    setupInsightTabs();
    
    // Select today's date by default and show insights
    const today = new Date().getDate();
    const dayTiles = document.querySelectorAll('.calendar-day');
    if (dayTiles[today - 1]) {
        dayTiles[today - 1].classList.add('selected-day');
    }
    updateDailyInsight(today);
});

// Update dashboard every minute
setInterval(() => {
    renderDailyInsights();
    renderMonthlyCalendarHome();
}, 60000);

// ========== GLOBAL ALARM SYSTEM ==========
let alarmTimeouts = {};

function ensureAlarmModal() {
    if (document.getElementById('alarmModal')) return;
    const modal = document.createElement('div');
    modal.id = 'alarmModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        align-items: center;
        justify-content: center;
        font-family: inherit;
    `;
    modal.innerHTML = `
        <div style="
            background: var(--bg-1);
            color: var(--text-1);
            padding: 32px 24px;
            border-radius: 16px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 320px;
            margin: auto;
            border: 2px solid var(--accent-1);
        ">
            <h3 id="alarmTaskTitle" style="margin: 0 0 16px 0; color: var(--accent-1);">Task Alarm</h3>
            <p id="alarmTaskTime" style="margin: 0 0 24px 0; opacity: 0.8;"></p>
            <button onclick="startAlarmTask()" style="
                background: var(--accent-1);
                color: var(--text-1);
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                margin-right: 12px;
                font-weight: bold;
            ">Start Task</button>
            <button onclick="snoozeAlarmTask()" style="
                background: var(--bg-2);
                color: var(--text-1);
                border: 1px solid var(--accent-1);
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            ">Snooze 10 min</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function scheduleAlarmForTask(li) {
    if (!li || !li.dataset.time || li.dataset.alarmDone === "1" || li.classList.contains('completed')) return;

    if (alarmTimeouts[li.dataset.task]) {
        clearTimeout(alarmTimeouts[li.dataset.task]);
        delete alarmTimeouts[li.dataset.task];
    }

    const now = new Date();
    const [hRaw, mRaw] = li.dataset.time.split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (Number.isNaN(h) || Number.isNaN(m)) return;

    const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    let delay = alarmTime - now;
    if (delay < 0) {
        delay = 1000;
    }

    alarmTimeouts[li.dataset.task] = setTimeout(() => {
        checkPendingAlarms();
    }, delay);
}

function getTaskDueTime(li) {
    const now = new Date();
    const [hRaw, mRaw] = li.dataset.time.split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
}

function checkPendingAlarms() {
    const now = Date.now();
    document.querySelectorAll('#taskList li').forEach(li => {
        if (!li.dataset.time || li.dataset.alarmDone === "1" || li.classList.contains('completed')) return;

        const snoozeUntil = Number(li.dataset.snoozeUntil || '0');
        if (snoozeUntil && now < snoozeUntil) return;

        const dueTime = getTaskDueTime(li);
        if (!dueTime) return;

        if (now >= dueTime.getTime() || (snoozeUntil && now >= snoozeUntil)) {
            if (!window.currentAlarmTask || window.currentAlarmTask !== li) {
                showAlarmModal(li);
            }
        }
    });
}

function showAlarmModal(li) {
    ensureAlarmModal();
    const modal = document.getElementById('alarmModal');
    document.getElementById('alarmTaskTitle').textContent = li.dataset.task;
    document.getElementById('alarmTaskTime').textContent = `Scheduled at ${li.dataset.time}`;
    modal.style.display = 'flex';
    window.currentAlarmTask = li;
    li.classList.add('glow-purple');
}

function startAlarmTask() {
    const modal = document.getElementById('alarmModal');
    modal.style.display = 'none';
    if (window.currentAlarmTask) {
        if (alarmTimeouts[window.currentAlarmTask.dataset.task]) {
            clearTimeout(alarmTimeouts[window.currentAlarmTask.dataset.task]);
            delete alarmTimeouts[window.currentAlarmTask.dataset.task];
        }
        window.currentAlarmTask.classList.remove('glow-purple');
        window.currentAlarmTask.dataset.alarmDone = "1";
        window.currentAlarmTask.dataset.snoozeUntil = "";
        saveTodoTasksGlobal();
    }
    window.currentAlarmTask = null;
}

function snoozeAlarmTask() {
    const modal = document.getElementById('alarmModal');
    modal.style.display = 'none';
    if (window.currentAlarmTask) {
        if (window.currentAlarmTask.dataset.snoozed === "1") {
            window.currentAlarmTask.dataset.alarmDone = "1";
            saveTodoTasksGlobal();
            window.currentAlarmTask = null;
            return;
        }
        window.currentAlarmTask.dataset.snoozed = "1";
        window.currentAlarmTask.dataset.snoozeUntil = String(Date.now() + 10 * 60 * 1000);
        saveTodoTasksGlobal();

        if (alarmTimeouts[window.currentAlarmTask.dataset.task]) {
            clearTimeout(alarmTimeouts[window.currentAlarmTask.dataset.task]);
            delete alarmTimeouts[window.currentAlarmTask.dataset.task];
        }

        alarmTimeouts[window.currentAlarmTask.dataset.task] = setTimeout(() => {
            checkPendingAlarms();
        }, 10 * 60 * 1000);
    }
}

function saveTodoTasksGlobal() {
    const tasks = [];
    document.querySelectorAll('#taskList li').forEach(li => {
        tasks.push({
            text: li.dataset.task,
            time: li.dataset.time,
            snoozed: li.dataset.snoozed,
            snoozeUntil: li.dataset.snoozeUntil || '',
            alarmDone: li.dataset.alarmDone,
            completed: li.classList.contains('completed')
        });
    });
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// Initialize alarms on page load
window.addEventListener('load', () => {
    ensureAlarmModal();
    // Check for pending alarms every 15 seconds
    setInterval(checkPendingAlarms, 15000);
    // Initial check
    setTimeout(checkPendingAlarms, 1000);
});

// Add purple glow style
const alarmStyle = document.createElement('style');
alarmStyle.textContent = `.glow-purple { box-shadow: 0 0 12px 2px var(--accent-1), 0 0 0 2px var(--accent-1); background: rgba(var(--accent-1-rgb), 0.1) !important; }`;
document.head.appendChild(alarmStyle);
