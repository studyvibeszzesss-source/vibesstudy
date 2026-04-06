// ==========================
// MONTHLY CALENDAR LOGIC
// ==========================
function getStudyTimeForDay(day) {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), day);
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    
    let totalMinutes = 0;
    sessions.forEach(session => {
        if (session.date) {
            const sessionDate = new Date(session.date);
            if (sessionDate.toDateString() === targetDate.toDateString()) {
                totalMinutes += timeToMinutes(session.time);
            }
        }
    });
    
    const hours = Math.floor(Math.floor(totalMinutes) / 60);
    const minutes = Math.floor(totalMinutes) % 60;
    return { hours: Math.max(0, parseInt(hours) || 0), minutes: Math.max(0, parseInt(minutes) || 0) };
}

function timeToMinutes(timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    return Math.floor(h) * 60 + Math.floor(m);
}

function renderMonthlyCalendar() {
    const calendarContainer = document.getElementById('monthlyCalendarGrid');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    calendarContainer.innerHTML = ''; // Clear previous view

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
    const lighterShade = `rgba(${hexToRgb(accentColor)}, 0.3)`;
    const darkerShade = `rgba(${hexToRgb(accentColor)}, 0.6)`;
    const darkestShade = `rgba(${hexToRgb(accentColor)}, 1)`;

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
            bgColor = darkestShade;
        } else if (hours >= 4) {
            bgColor = darkerShade;
        } else if (hours >= 0.5) {
            bgColor = lighterShade;
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

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
}

// Initialize on page load
window.addEventListener('load', () => {
    renderMonthlyCalendar();
    renderDailyInsights();
    
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
}, 60000);
