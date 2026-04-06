// ==========================
// APP USAGE WARNING LOGIC
// ==========================

// Global variables for usage tracking
let usageChart = null;
let usageData = {};

// For demo, let's simulate app usage hours
// The app can show real phone usage when a native helper posts usage to the proxy (/usage).
// Fallback: localStorage-based tracking when no proxy is available.

const usageWarning = document.getElementById('usageWarning');
const socialUsageList = document.getElementById('socialUsageList');

// List of social app identifiers (package names or friendly keys) to monitor
const SOCIAL_APPS = [
    { id: 'com.instagram.android', label: 'Instagram' },
    { id: 'com.facebook.katana', label: 'Facebook' },
    { id: 'com.whatsapp', label: 'WhatsApp' },
    { id: 'com.twitter.android', label: 'X / Twitter' },
    { id: 'com.snapchat.android', label: 'Snapchat' },
    { id: 'com.reddit.frontpage', label: 'Reddit' },
    { id: 'com.google.android.youtube', label: 'YouTube' },
    { id: 'com.tiktok.android', label: 'TikTok' }
];

// thresholds in ms
const THRESHOLDS = [30 * 60 * 1000, 60 * 60 * 1000, 2 * 60 * 60 * 1000];

// get today's date key
function todayKey() { return new Date().toISOString().slice(0,10); }

// Read usage from local proxy (if running) for a given date
async function fetchUsageFromProxy(dateStr) {
    try {
        const url = `http://localhost:3000/usage?date=${encodeURIComponent(dateStr)}`;
        const resp = await fetch(url, { method: 'GET' });
        if (!resp.ok) throw new Error('Proxy not available');
        const data = await resp.json();
        // data.data is an object keyed by deviceId -> usage array
        // Merge usage arrays across devices into a map { package: ms }
        const merged = {};
        for (const deviceKey of Object.keys(data.data || {})) {
            const arr = data.data[deviceKey] || [];
            for (const it of arr) {
                const pkg = it.package || it.id || it.label || 'unknown';
                const ms = parseInt(it.ms || 0, 10) || 0;
                merged[pkg] = (merged[pkg] || 0) + ms;
            }
        }
        return merged;
    } catch (e) {
        console.warn('fetchUsageFromProxy failed', e.message);
        return null;
    }
}

// Fallback: read usage data from localStorage key 'wellUsageLocal' (format { date: { pkg: ms } })
function fetchUsageFromLocal(dateStr) {
    try {
        const raw = JSON.parse(localStorage.getItem('wellUsageLocal') || '{}');
        const localData = raw[dateStr] || {};
        const manualRaw = JSON.parse(localStorage.getItem('manualUsage') || '{}');
        const manualData = manualRaw[dateStr] || {};
        const merged = { ...localData };
        for (const pkg of Object.keys(manualData)) {
            merged[pkg] = (merged[pkg] || 0) + manualData[pkg];
        }
        return merged;
    } catch (e) { return {}; }
}

function storeManualUsageApps(date) {
    const raw = JSON.parse(localStorage.getItem('manualUsageApps') || '{}');
    raw[date] = getLastUsedPlatforms(date);
    localStorage.setItem('manualUsageApps', JSON.stringify(raw));
}

function getLastUsedPlatforms(date) {
    const raw = JSON.parse(localStorage.getItem('manualUsage') || '{}');
    const dates = Object.keys(raw).sort((a, b) => b.localeCompare(a));
    const seen = new Set();
    const platforms = [];
    for (const currentDate of dates) {
        if (currentDate !== date) continue;
        const dayData = raw[currentDate] || {};
        for (const platform of Object.keys(dayData)) {
            if (!seen.has(platform)) {
                seen.add(platform);
                platforms.push(platform);
            }
        }
        if (platforms.length >= 5) break;
    }
    return platforms.length > 0 ? platforms : ['Instagram', 'WhatsApp', 'YouTube', 'Snapchat', 'Reddit'];
}

function msToHMS(ms) {
    const s = Math.floor(ms/1000);
    const hh = Math.floor(s/3600);
    const mm = Math.floor((s%3600)/60);
    const ss = s%60;
    if (hh>0) return `${hh}h ${mm}m`;
    if (mm>0) return `${mm}m ${ss}s`;
    return `${ss}s`;
}

// Render usage boxes and trigger threshold alerts
function renderSocialUsage(usageMap) {
    socialUsageList.innerHTML = '';
    const date = todayKey();
    const notified = JSON.parse(localStorage.getItem('wellUsageNotified') || '{}');
    notified[date] = notified[date] || {};

    const platformKeys = Object.keys(usageMap);
    const orderedKeys = [];
    const seen = new Set();
    SOCIAL_APPS.forEach(app => {
        if (platformKeys.includes(app.id)) {
            orderedKeys.push(app.id);
            seen.add(app.id);
        }
    });
    platformKeys.forEach(key => {
        if (!seen.has(key)) orderedKeys.push(key);
    });

    orderedKeys.forEach(pkg => {
        const ms = usageMap[pkg] || 0;
        const app = SOCIAL_APPS.find(item => item.id === pkg);
        const label = app ? app.label : pkg;
        const box = document.createElement('div');
        box.classList.add('note-box');
        const left = document.createElement('div');
        left.innerHTML = `<strong>${label}</strong><div style="opacity:0.8;font-size:13px">${msToHMS(ms)}</div>`;

        const right = document.createElement('div');
        right.style.display = 'flex';
        right.style.flexDirection = 'column';
        right.style.gap = '6px';

        const clearBtn = document.createElement('button');
        clearBtn.classList.add('small-btn');
        clearBtn.textContent = 'Clear';
        clearBtn.onclick = () => {
            // clear localStore for this app
            const raw = JSON.parse(localStorage.getItem('wellUsageLocal') || '{}');
            if (raw[date] && raw[date][app.id]) delete raw[date][app.id];
            localStorage.setItem('wellUsageLocal', JSON.stringify(raw));
            // also patch proxy via POST if desired (not implemented here)
            // re-render
            loadAndRenderUsage();
        };

        right.appendChild(clearBtn);
        box.appendChild(left);
        box.appendChild(right);
        socialUsageList.appendChild(box);

        // thresholds notifications
        for (const t of THRESHOLDS) {
            if (ms >= t && !notified[date][app.id + '_' + t]) {
                // show alert
                const human = t >= 3600000 ? `${t/3600000} hour(s)` : `${t/60000} minute(s)`;
                alert(`Alert: You've used ${app.label} for ${msToHMS(ms)} today (threshold ${human}). Consider taking a break.`);
                notified[date][app.id + '_' + t] = true;
            }
        }
    });

    localStorage.setItem('wellUsageNotified', JSON.stringify(notified));
}

// Load usage (try proxy first, fallback to localStorage)
async function loadAndRenderUsage() {
    const date = todayKey();
    const proxy = await fetchUsageFromProxy(date);
    let usageMap = {};
    if (proxy) usageMap = proxy;
    else usageMap = fetchUsageFromLocal(date);

    usageData[date] = usageMap;

    // Render summary in usageWarning
    const totalMs = Object.values(usageMap).reduce((s,v)=>s+(v||0),0);
    if (totalMs < 3*3600000) {
        usageWarning.innerHTML = `<p style="color:green;">0s used today good!</p>`;
    } else if (totalMs < 5*3600000) {
        usageWarning.innerHTML = `<p style="color:orange;">⚠ Warning: You've used ${msToHMS(totalMs)} today. Take a small break!</p>`;
    } else {
        usageWarning.innerHTML = `<p style="color:red;">⛔ Stop! ${msToHMS(totalMs)} today. Time to relax and recharge!</p>`;
    }

    renderSocialUsage(usageMap);
    updateUsageChart(usageMap, date);
}

// Reset notifications and daily local counters at midnight
function scheduleMidnightReset() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = tomorrow - now + 1000;
    setTimeout(() => {
        // Reset midnight state so yesterday's data is not shown for the new day
        usageData = {};

        const notified = {};
        localStorage.setItem('wellUsageNotified', JSON.stringify(notified));

        loadAndRenderUsage();
        updateUsageChart();
        updateWellbeingUI(todayKey());
        scheduleMidnightReset();
    }, ms);
}

// initialize
// initialize: set date input to today and load
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('usageDate');
    const today = todayKey();
    if (dateInput) dateInput.value = today;
    loadAndRenderUsage();
    scheduleMidnightReset();
});

// Load usage for selected date (button)
async function loadSelectedDate() {
    const dateInput = document.getElementById('usageDate');
    const status = document.getElementById('usageStatus');
    if (!dateInput) return;
    const d = dateInput.value || todayKey();
    status.textContent = 'Loading...';
    try {
        const proxy = await fetchUsageFromProxy(d);
        let usageMap = {};
        if (proxy) usageMap = proxy;
        else usageMap = fetchUsageFromLocal(d);

        usageData[d] = usageMap;

        // show summary
        const totalMs = Object.values(usageMap).reduce((s,v)=>s+(v||0),0);
        status.textContent = `Total: ${msToHMS(totalMs)}`;
        renderSocialUsage(usageMap);
        updateUsageChart(usageMap, d);
        updateWellbeingUI(d);
    } catch (e) {
        status.textContent = `Failed: ${e.message}`;
    }
    setTimeout(()=>{ if (status) status.textContent = ''; }, 4000);
}

// Simulate sending sample usage to proxy for testing
async function simulateSendUsage() {
    const dateInput = document.getElementById('usageDate');
    const status = document.getElementById('usageStatus');
    const d = (dateInput && dateInput.value) ? dateInput.value : todayKey();
    status.textContent = 'Sending sample usage to proxy...';
    const sample = [
        { package: 'com.instagram.android', label: 'Instagram', ms: 45 * 60 * 1000 },
        { package: 'com.whatsapp', label: 'WhatsApp', ms: 20 * 60 * 1000 },
        { package: 'com.google.android.youtube', label: 'YouTube', ms: 75 * 60 * 1000 }
    ];
    try {
        const resp = await fetch('http://localhost:3000/usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: 'phone-sim', date: d, usage: sample })
        });
        if (!resp.ok) throw new Error(`Proxy returned ${resp.status}`);
        status.textContent = 'Sample sent. Loading...';
        await loadSelectedDate();
    } catch (err) {
        status.textContent = `Send failed: ${err.message}`;
        showToast('Proxy unreachable. Start the local proxy to accept usage data.', 'error');
    }
    setTimeout(()=>{ if (status) status.textContent = ''; }, 3500);
}

// Toast helper (in-page banners instead of alert)
function showToast(message, type='info', title='', duration=6000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.classList.add('toast');
    t.classList.add(type);
    if (title) {
        const h = document.createElement('div'); h.classList.add('title'); h.textContent = title; t.appendChild(h);
    }
    const m = document.createElement('div'); m.classList.add('msg'); m.textContent = message; t.appendChild(m);
    container.appendChild(t);
    // auto-dismiss with custom duration
    setTimeout(()=>{
        t.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        t.style.opacity = 0;
        t.style.transform = 'translateY(8px)';
        setTimeout(()=> container.removeChild(t), 400);
    }, duration);
}

// ==========================
// MOTIVATIONAL MESSAGE LOGIC
// ==========================
const motivationMessages = [
    "Stay focused, small steps lead to big wins! ✨",
    "Take a deep breath and keep going! 💙",
    "Remember: breaks make your brain stronger! 🧠",
    "You got this! One hour at a time. 🤌",
    "Focus now, chill later — balance is key!"
];

const motivationMsg = document.getElementById('motivationMsg');

function updateMotivation() {
    const randomIndex = Math.floor(Math.random() * motivationMessages.length);
    motivationMsg.textContent = motivationMessages[randomIndex];
}

updateMotivation();

// Optional: change message every 30s
setInterval(updateMotivation, 30000);

// ==========================
// PERSONAL NOTE AREA LOGIC
// ==========================
const personalNote = document.getElementById('personalNote');
const notesList = document.getElementById('notesList');

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('wellNotes')) || [];
    notesList.innerHTML = '';
    notes.forEach((note, idx) => {
        const box = document.createElement('div');
        box.classList.add('note-box');
        const text = document.createElement('div');
        text.classList.add('note-text');
        text.textContent = note;

        const del = document.createElement('button');
        del.classList.add('small-btn');
        del.textContent = 'Delete';
        del.onclick = () => {
            const all = JSON.parse(localStorage.getItem('wellNotes')) || [];
            all.splice(idx, 1);
            localStorage.setItem('wellNotes', JSON.stringify(all));
            loadNotes();
        };

        box.appendChild(text);
        box.appendChild(del);
        notesList.appendChild(box);
    });
}

function addWellNote() {
    const text = personalNote.value.trim();
    if (!text) return;
    const notes = JSON.parse(localStorage.getItem('wellNotes')) || [];
    notes.push(text);
    localStorage.setItem('wellNotes', JSON.stringify(notes));
    personalNote.value = '';
    loadNotes();
}

// initial load
loadNotes();

// ==========================
// MANUAL USAGE LOGGING & CHART
// ==========================

// Load Chart.js from CDN if not already loaded
if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);
}

function toggleCustomApp() {
    const platform = document.getElementById('platformSelect').value;
    const customInput = document.getElementById('customAppName');
    if (platform === 'Other') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

function getLastUsedPlatforms() {
    const raw = JSON.parse(localStorage.getItem('manualUsage') || '{}');
    const dates = Object.keys(raw).sort((a, b) => b.localeCompare(a));
    const seen = new Set();
    const platforms = [];
    for (const date of dates) {
        const dayData = raw[date] || {};
        for (const platform of Object.keys(dayData)) {
            if (!seen.has(platform)) {
                seen.add(platform);
                platforms.push(platform);
            }
        }
        if (platforms.length >= 5) break;
    }
    return platforms.length > 0 ? platforms : ['Instagram', 'WhatsApp', 'YouTube', 'Snapchat', 'Reddit'];
}

function logUsage() {
    let platform = document.getElementById('platformSelect').value;
    const customInput = document.getElementById('customAppName');
    const minutes = parseInt(document.getElementById('usageMinutes').value);
    
    if (!minutes || minutes <= 0) {
        showToast('Please enter a valid number of minutes.', 'error');
        return;
    }
    
    if (platform === 'Other') {
        platform = customInput.value.trim();
        if (!platform) {
            showToast('Please specify the app name.', 'error');
            return;
        }
    }
    
    const date = todayKey();
    const raw = JSON.parse(localStorage.getItem('manualUsage') || '{}');
    if (!raw[date]) raw[date] = {};
    
    // Store minutes directly (not milliseconds)
    raw[date][platform] = (raw[date][platform] || 0) + minutes;
    
    localStorage.setItem('manualUsage', JSON.stringify(raw));
    
    // Update usageData for immediate UI updates
    if (!usageData[date]) usageData[date] = {};
    usageData[date][platform] = (usageData[date][platform] || 0) + minutes;

    storeManualUsageApps(date);
    
    // Clear inputs
    document.getElementById('usageMinutes').value = '';
    
    // Update chart and advice
    updateUsageChart(usageData[date], date);
    updateWellbeingUI(todayKey());
    
    showToast(`Logged ${minutes} minutes on ${platform}!`, 'info');
}

function getChartColors(count) {
    const themeColors = [
        getComputedStyle(document.documentElement).getPropertyValue('--accent-1').trim() || '#7ab8e8',
        getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#a8c9d4',
        getComputedStyle(document.documentElement).getPropertyValue('--accent-3').trim() || '#6896d1',
        getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim() || '#333333'
    ];
    const palette = [];
    for (let i = 0; i < count; i++) {
        palette.push(themeColors[i % themeColors.length]);
    }
    return palette;
}

function formatMinutes(value) {
    if (value >= 60) {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
    }
    return `${value}m`;
}

function updateUsageChart(usageMap = null, date = todayKey()) {
    const dataMap = usageMap || usageData[date] || {};
    const hasData = Object.keys(dataMap).length > 0;
    const storedLabels = JSON.parse(localStorage.getItem('manualUsageApps') || '{}')[date] || [];
    const defaultLabels = ['Instagram', 'WhatsApp', 'YouTube', 'Snapchat', 'Reddit'];
    const platforms = hasData ? Object.keys(dataMap) : storedLabels.length > 0 ? storedLabels : defaultLabels;
    const effectivePlatforms = platforms.length > 0 ? platforms : defaultLabels;
    const minutesData = effectivePlatforms.map(p => dataMap[p] || 0);
    const colors = getChartColors(effectivePlatforms.length);
    const maxUsage = Math.max(60, ...minutesData);
    
    const ctx = document.getElementById('usageChart');
    if (!ctx) return;
    
    try {
        if (usageChart) {
            usageChart.destroy();
        }
        
        ctx.style.display = 'block';
        usageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: effectivePlatforms,
                datasets: [{
                    label: hasData ? 'Usage' : 'No data yet',
                    data: minutesData,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return ' ' + formatMinutes(value);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxUsage,
                        ticks: {
                            stepSize: 10,
                            callback: function(value) {
                                return formatMinutes(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Chart error:', e);
    }
}

function updateWellbeingUI(date) {
    const dayData = usageData[date] || {};
    let totalMinutes = 0;
    for (let p in dayData) totalMinutes += dayData[p];

    const adviceBox = document.getElementById('wellbeingAdvice');
    
    // Universal Feedback Logic
    if (totalMinutes === 0) {
        adviceBox.innerText = "Total focus achieved! You're ruling your schedule today. 🏆";
    } else if (totalMinutes < 45) {
        adviceBox.innerText = "Balanced and mindful. Taking short breaks keeps the brain sharp! 🧠✨";
    } else if (totalMinutes < 120) {
        adviceBox.innerText = "You've been scrolling for a while. How about a 5-minute stretch? 🧘‍♀️";
    } else {
        adviceBox.innerText = "Screen time is getting high! Remember: your goals need you more than your feed does. ⚡";
    }
}

// Updated AI Vibe Check for everyone
async function askAIAboutMyUsage() {
    const date = new Date().toISOString().slice(0, 10);
    const dayData = JSON.stringify(usageData[date]);
    
    // Broadened prompt: Works for any student/learner
    const prompt = `I am a student working on my goals. Today my social media usage was: ${dayData}. Give me a short, friendly, and helpful 'Vibe Check' to keep me productive.`;
    
    const response = await fetch('/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
    });
    const data = await response.json();
    document.getElementById('wellbeingAdvice').innerText = data.reply;
}

// Initialize chart and advice on page load
document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization...
    const dateInput = document.getElementById('usageDate');
    const today = todayKey();
    if (dateInput) dateInput.value = today;
    loadAndRenderUsage();
    scheduleMidnightReset();
    
    // Load saved usage data and render chart
    const initializeChartAndUI = function() {
        // Wait for Chart.js to load
        if (typeof Chart === 'undefined') {
            setTimeout(initializeChartAndUI, 100);
            return;
        }
        
        updateUsageChart();
        updateWellbeingUI(todayKey());
    }
    
    setTimeout(initializeChartAndUI, 500);
});

// ========== APPOINTMENT FORM HANDLER ==========
function handleAppointmentSubmit(event) {
    event.preventDefault();
    
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    const data = {
        category: formData.get('category'),
        lookingFor: formData.get('lookingFor'),
        serviceType: formData.get('serviceType'),
        submittedAt: new Date().toISOString()
    };
    
    // Store the data locally
    let appointmentSubmissions = JSON.parse(localStorage.getItem('appointmentSubmissions') || '[]');
    appointmentSubmissions.push(data);
    localStorage.setItem('appointmentSubmissions', JSON.stringify(appointmentSubmissions));
    
    // Show success message
    alert('✓ Your information has been submitted! You will now be directed to NIMHANS for further support.');
    
    // Open NIMHANS website in new tab
    window.open('https://www.nimhans.ac.in/', '_blank');
    
    // Reset form
    form.reset();
}
