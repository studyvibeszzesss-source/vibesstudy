// ========== MINI BAR GRAPH FOR SESSIONS ==========
function renderSessionBarGraph() {
    const graphContainer = document.getElementById('sessionBarGraph');
    if (!graphContainer) return;
    graphContainer.innerHTML = '';
    const allSessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    
    // Filter to show only today's sessions in the bar graph
    const today = new Date();
    const sessions = allSessions.filter(session => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === today.toDateString();
    });
    
    if (sessions.length === 0) {
        graphContainer.innerHTML = '<div style="opacity:0.7;text-align:center;">No sessions yet</div>';
        return;
    }
    // Find max duration for scaling
    const maxSec = Math.max(...sessions.map(s => timeToSeconds(s.time)));
    const colors = ['#7ad7f0','#a259ff','#f7b731','#fd5c63','#43e97b','#f857a6','#30cfd0','#e0c3fc'];
    sessions.forEach((s, idx) => {
        const bar = document.createElement('div');
        bar.style.height = '28px';
        bar.style.margin = '6px 0';
        bar.style.display = 'flex';
        bar.style.alignItems = 'center';
        const secs = timeToSeconds(s.time);
        bar.style.background = colors[idx % colors.length];
        bar.style.borderRadius = '8px';
        bar.style.boxShadow = '0 2px 8px #0001';
        bar.style.width = (maxSec ? (60 + 220 * secs / maxSec) : 60) + 'px';
        bar.style.position = 'relative';
        bar.innerHTML = `<span style="padding-left:12px;font-weight:bold;color:#fff;text-shadow:0 1px 4px #0007;">${s.label || 'Session'}</span><span style="margin-left:auto;padding-right:12px;color:#fff;">${s.time}</span>`;
        graphContainer.appendChild(bar);
    });
}

function timeToSeconds(t) {
    const parts = t.split(':').map(Number);
    return (parts[0]||0)*3600 + (parts[1]||0)*60 + (parts[2]||0);
}

// Call bar graph render on load and after save
window.addEventListener('load', renderSessionBarGraph);

// Initialize timer variables
let seconds = 0;
let minutes = 0;
let hours = 0;

let timerInterval = null;
let running = false;
let sessionStartTime = null; // Track when session starts

// Function to darken a hex color
function darkenHex(hex, factor) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.floor((num >> 16) * factor);
    const g = Math.floor(((num >> 8) & 0x00FF) * factor);
    const b = Math.floor((num & 0x0000FF) * factor);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

let colorIndex = 0;

function updateDisplay() {
    const display = document.getElementById("display");
    const container = document.getElementById("display").parentElement; // timer-display-container

    let h = hours.toString().padStart(2, "0");
    let m = minutes.toString().padStart(2, "0");
    let s = seconds.toString().padStart(2, "0");

    display.textContent = `${h}:${m}:${s}`;
    
    // Change text and border color every second through theme shades when running
    if (running) {
        const accentHex = getComputedStyle(document.body).getPropertyValue('--accent-1').trim();
        const factors = [1.0, 0.85, 0.7, 0.55, 0.4, 0.25, 0.1];
        const shades = factors.map(f => darkenHex(accentHex, f));
        const currentColor = shades[colorIndex % shades.length];
        display.style.color = currentColor;
        container.style.borderColor = currentColor;
        colorIndex++;
    }
}

// Start timer
function startTimer() {
    if (running) return;
    running = true;
    sessionStartTime = new Date(); // Capture session start time
    window.dispatchEvent(new Event('timerStatusChange'));
    colorIndex = 0;

    timerInterval = setInterval(() => {
        seconds++;

        if (seconds >= 60) {
            seconds = 0;
            minutes++;
        }

        if (minutes >= 60) {
            minutes = 0;
            hours++;
        }

        if (hours >= 24) {
            stopTimer();
            return;
        }

        updateDisplay();
    }, 1000);
}

// Stop timer
function stopTimer() {
    running = false;
    clearInterval(timerInterval);
    window.dispatchEvent(new Event('timerStatusChange'));

    // Optionally save on stop, keep behavior: do not auto-save here to allow manual save
}

// Reset timer
function resetTimer() {
    running = false;
    clearInterval(timerInterval);

    seconds = 0;
    minutes = 0;
    hours = 0;
    colorIndex = 0;
    sessionStartTime = null; // Reset session start time

    updateDisplay();
    // Reset colors
    const display = document.getElementById("display");
    display.style.color = '';
    const container = document.getElementById("display").parentElement;
    container.style.borderColor = '';
}

// Save session to list
function saveSession() {
    // Check for manual time entry first
    const hoursInput = document.getElementById('manualHours');
    const minutesInput = document.getElementById('manualMinutes');
    const manualHours = parseInt(hoursInput.value) || 0;
    const manualMinutes = parseInt(minutesInput.value) || 0;
    const totalManualMinutes = manualHours * 60 + manualMinutes;
    
    // If manual time is entered, validate and add it
    if (totalManualMinutes > 0) {
        if (totalManualMinutes < 30) {
            alert('Minimum manual time is 30 minutes');
            return;
        }
        if (totalManualMinutes > 360) {
            alert('Maximum manual time is 6 hours');
            return;
        }
        
        // Add manual time to timer
        hours += manualHours;
        minutes += manualMinutes;
        
        if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
        }
        
        updateDisplay();
    }
    
    // Now save the session
    const listEl = document.getElementById("sessionList");

    let h = hours.toString().padStart(2, "0");
    let m = minutes.toString().padStart(2, "0");
    let s = seconds.toString().padStart(2, "0");
    const sessionTime = `${h}:${m}:${s}`;

    if (h === '00' && m === '00' && s === '00') {
        if (!confirm('Timer is at 00:00:00. Do you still want to save a session with time 00:00:00?')) return;
    }

    // Get session name from appropriate input
    let label = '';
    if (totalManualMinutes > 0) {
        // Manual time entry - use manualSessionTitle
        const titleInput = document.getElementById('manualSessionTitle');
        label = titleInput ? titleInput.value.trim() : '';
    } else {
        // Timer was used - use timerSessionName
        const timerNameInput = document.getElementById('timerSessionName');
        label = timerNameInput ? timerNameInput.value.trim() : '';
    }
    if (!label) label = 'Study Session';

    // Use device time for start and end times
    let startTimeStr, endTimeStr;
    
    if (sessionStartTime) {
        // If timer was running, use captured start time
        startTimeStr = `${String(sessionStartTime.getHours()).padStart(2, '0')}:${String(sessionStartTime.getMinutes()).padStart(2, '0')}:${String(sessionStartTime.getSeconds()).padStart(2, '0')}`;
    } else {
        // If manual time entry, calculate start time from current time - duration
        const now = new Date();
        const durationMs = (Math.floor(hours) * 60 * 60 + Math.floor(minutes) * 60 + Math.floor(seconds)) * 1000;
        const startTime = new Date(now.getTime() - durationMs);
        startTimeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}:${String(startTime.getSeconds()).padStart(2, '0')}`;
    }
    
    // End time is current time
    const now = new Date();
    endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const isManualSession = totalManualMinutes > 0 && !sessionStartTime;
    
    // Create session object with device times
    const sessionObj = { time: sessionTime, label, date: now.toISOString(), startTime: startTimeStr, endTime: endTimeStr, isManual: isManualSession };
    listEl.insertAdjacentHTML('beforeend', createSessionCard(sessionTime, label, sessionObj));

    // Save to localStorage as an array of objects
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    sessions.push(sessionObj);
    localStorage.setItem('timerSessions', JSON.stringify(sessions));

    // Reset timer and clear all inputs after saving
    resetTimer();
    const titleInput = document.getElementById('manualSessionTitle');
    const timerNameInput = document.getElementById('timerSessionName');
    hoursInput.value = '';
    minutesInput.value = '';
    if (titleInput) titleInput.value = '';
    if (timerNameInput) timerNameInput.value = '';
}

// Override saveSession to also update the bar graph
const originalSaveSession = saveSession;
saveSession = function() {
    originalSaveSession.apply(this, arguments);
    renderSessionBarGraph();
};

// Create session card HTML
function createSessionCard(time, label = 'Study Session', sessionObj = null) {
    const subjectLabel = label || 'Study Session';
    return `
    <div class="session-item mid-translucent" style="border-left: 5px solid var(--accent-1); padding: 15px; margin: 8px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div>
                <span style="font-weight: bold; color: var(--text-main); font-size: 1.1em;">${time}</span>
                <div style="margin-top: 6px; color: var(--text-main); opacity: 0.8; font-size: 0.95em;">Subject: ${subjectLabel}${sessionObj?.isManual ? ' · Manually added' : ''}</div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="small-btn" style="background: var(--accent-1); color: white; padding: 6px 12px; border-radius: 8px;" onclick="editSession('${sessionObj.date}', '${sessionObj.time}')">Edit</button>
                <button class="small-btn" style="background: #ff6b6b; color: white; padding: 6px 12px; border-radius: 8px;" onclick="deleteSession('${sessionObj.date}', '${sessionObj.time}')">Delete</button>
            </div>
        </div>
    </div>
    `;
}

// Delete session function
function deleteSession(date, time) {
    if (confirm('Are you sure you want to delete this session?')) {
        // remove from localStorage
        const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
        const filtered = sessions.filter(s => s.date !== date || s.time !== time);
        localStorage.setItem('timerSessions', JSON.stringify(filtered));
        
        // reload sessions
        loadSessions();
        renderSessionBarGraph();
    }
}

// Edit session function
function editSession(date, time) {
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    const session = sessions.find(s => s.date === date && s.time === time);
    
    if (session) {
        // Populate the manual entry fields with current session data
        const titleInput = document.getElementById('manualSessionTitle');
        const hoursInput = document.getElementById('manualHours');
        const minutesInput = document.getElementById('manualMinutes');
        
        if (titleInput) titleInput.value = session.label || '';
        
        // Parse time
        const [hours, minutes, seconds] = session.time.split(':').map(Number);
        if (hoursInput) hoursInput.value = hours || 0;
        if (minutesInput) minutesInput.value = minutes || 0;
        
        // Remove the old session
        const filtered = sessions.filter(s => s.date !== date || s.time !== time);
        localStorage.setItem('timerSessions', JSON.stringify(filtered));
        
        // Update display and reload
        loadSessions();
        renderSessionBarGraph();
        
        // Scroll to the manual entry section
        document.querySelector('.manual-time-entry').scrollIntoView({ behavior: 'smooth' });
    }
}

// Append a session card to container
function appendSessionBox(sessionObj, container) {
    container.insertAdjacentHTML('beforeend', createSessionCard(sessionObj.time, sessionObj.label, sessionObj));
}

// Load sessions on page load
function loadSessions() {
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    const listEl = document.getElementById('sessionList');
    listEl.innerHTML = '';
    
    // Filter to show only today's sessions
    const today = new Date();
    const todaySessions = sessions.filter(session => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        return sessionDate.toDateString() === today.toDateString();
    });
    
    // Show message if no sessions today
    if (todaySessions.length === 0) {
        listEl.innerHTML = '<div style="opacity:0.6;text-align:center;padding:20px;">No sessions yet today. Start studying!</div>';
        renderSessionBarGraph();
        return;
    }
    
    todaySessions.forEach(s => {
        listEl.insertAdjacentHTML('beforeend', createSessionCard(s.time, s.label, s));
    });
    renderSessionBarGraph();
}

// initialize display
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    const display = document.getElementById("display");
    display.style.color = '';
    const container = document.getElementById("display").parentElement;
    container.style.borderColor = '';
    loadSessions();
    renderSessionBarGraph();
});
 