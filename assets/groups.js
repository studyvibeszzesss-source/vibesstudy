// ========== GROUPS MANAGEMENT ==========

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function getUserPFP() {
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    
    // If Gmail user with profile pic, return it (simulated)
    if (userData.isGmail && userData.profilePic) {
        return userData.profilePic;
    }
    
    // Otherwise, return first letter of Gmail name or regular name
    const displayName = userData.gmailName || userData.name || 'User';
    return displayName.charAt(0).toUpperCase();
}

function generateGroupCode() {
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
}

function generateNewCode() {
    const code = generateGroupCode();
    document.getElementById('generatedCode').textContent = code;
    window.currentGroupCode = code;
}

function showCreateModal() {
    generateNewCode();
    document.getElementById('createGroupModal').style.display = 'flex';
}

function closeCreateModal() {
    document.getElementById('createGroupModal').style.display = 'none';
}

function createGroup() {
    const name = document.getElementById('groupName').value.trim();
    const desc = document.getElementById('groupDesc').value.trim();
    const code = window.currentGroupCode;

    if (!name) {
        alert('Please enter a group name');
        return;
    }

    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';

    const group = {
        code,
        name,
        description: desc,
        createdAt: new Date().toISOString(),
        admin: userName,
        members: [{ 
            name: userName,
            gmailName: userData.gmailName || userName,
            joinedAt: new Date().toISOString(),
            theme: localStorage.getItem('selected-theme') || 'pastel-breeze',
            pfp: getUserPFP(),
            status: 'online',
            isAdmin: true,
            bio: 'Group Admin',
            reminders: []
        }],
        joinRequests: [],
        studyTime: {}
    };

    // Load existing groups
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    
    // Check if code already exists
    if (groups[code]) {
        alert('This group code already exists. Generate a new one.');
        generateNewCode();
        return;
    }

    groups[code] = group;
    localStorage.setItem('studyGroups', JSON.stringify(groups));
    localStorage.setItem('currentGroupCode', code);

    // Add to user's group list
    let userGroups = JSON.parse(localStorage.getItem('userGroupsList') || '[]');
    if (!userGroups.includes(code)) {
        userGroups.push(code);
        localStorage.setItem('userGroupsList', JSON.stringify(userGroups));
    }

    // Save group data for dashboard persistence
    const groupData = { code: code, name: name };
    localStorage.setItem('myStudyGroup', JSON.stringify(groupData));

    closeCreateModal();
    alert('Group created successfully!');
    loadGroupInfo();
}

function joinGroup(code) {
    // If no code provided, get from input field
    if (!code) {
        code = document.getElementById('groupCodeInput').value.trim().toUpperCase();
    }

    if (!code) {
        alert('Please enter a group code');
        return;
    }

    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};

    if (!groups[code]) {
        alert('Group not found. Check the code and try again.');
        return;
    }

    const group = groups[code];
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'Anonymous User';

    // Check if user already in group
    if (group.members.some(m => m.name === userName)) {
        alert('You are already a member of this group!');
        return;
    }

    let userGroups = JSON.parse(localStorage.getItem('userGroupsList') || '[]');
    if (userGroups.length >= 3 && !userGroups.includes(code)) {
        alert('❌ You can only join a maximum of 3 groups. Please leave another group first.');
        return;
    }

    const description = group.description ? `\nDescription: ${group.description}` : '';
    const confirmMessage = `Join "${group.name}"?\nMembers: ${group.members.length}${description}`;

    if (!confirm(confirmMessage)) {
        return;
    }

    group.members = group.members || [];
    group.members.push({
        name: userName,
        gmailName: userData.gmailName || userName,
        joinedAt: new Date().toISOString(),
        theme: localStorage.getItem('selected-theme') || 'pastel-breeze',
        pfp: getUserPFP(),
        status: 'online',
        isAdmin: false,
        bio: 'Study Buddy',
        reminders: []
    });

    groups[code] = group;
    localStorage.setItem('studyGroups', JSON.stringify(groups));

    if (!userGroups.includes(code)) {
        userGroups.push(code);
        localStorage.setItem('userGroupsList', JSON.stringify(userGroups));
    }

    const groupData = { code, name: group.name };
    localStorage.setItem('myStudyGroup', JSON.stringify(groupData));
    localStorage.setItem('currentGroupCode', code);
    document.getElementById('groupCodeInput').value = '';
    alert('✓ You have joined the group successfully.');
    loadGroupInfo();
}

function loadGroupInfo() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};

    if (code && groups[code]) {
        const group = groups[code];
        const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
        const userName = userData.gmailName || userData.name || 'You';
        const isAdmin = group.admin === userName;
        
        // Show banner with group name prominently at top
        const banner = document.getElementById('currentGroupDisplay');
        const bannerName = document.getElementById('bannerGroupName');
        const bannerStats = document.getElementById('bannerGroupStats');
        const editBtn = document.getElementById('editGroupNameBannerBtn');
        
        banner.style.display = 'block';
        bannerName.textContent = `📚 ${group.name}`;
        bannerStats.textContent = `${group.members.length} members • ${group.members.filter(m => m.status === 'studying' || m.status === 'online').length} active`;
        
        const bannerDesc = document.getElementById('bannerGroupDesc');
        const bannerCode = document.getElementById('bannerGroupCode');
        const groupInfo = document.getElementById('groupInfo');
        const groupCodeDisplay = document.getElementById('groupCodeDisplay');

        // Show edit button only for admin
        if (editBtn) {
            editBtn.style.display = isAdmin ? 'inline-block' : 'none';
        }

        bannerDesc.textContent = group.description || '';
        bannerCode.textContent = group.code ? `Group Code: ${group.code}` : '';
        groupCodeDisplay.textContent = group.code ? `Group Code: ${group.code}` : '';

        if (groupInfo) {
            groupInfo.style.display = 'block';
        }

        // Show admin approval banner if user is admin
        setTimeout(() => {
            showAdminApprovalBanner();
            showLowStudyHourReminders();
            showReceivedReminders();
            showActivityFeed();
        }, 100);
    } else {
        document.getElementById('currentGroupDisplay').style.display = 'none';
        const groupInfo = document.getElementById('groupInfo');
        if (groupInfo) {
            groupInfo.style.display = 'none';
        }
    }

    loadLeaderboard();
}

function switchRankingTab(tab) {
    // Update active tab
    document.querySelectorAll('.tab-btn-small').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    loadLeaderboard(tab);
}

function loadLeaderboard(period = 'today') {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const leaderboard = document.getElementById('leaderboard');

    if (!code || !groups[code]) {
        leaderboard.innerHTML = '<p style="text-align:center;opacity:0.7;">Join or create a group to see rankings</p>';
        return;
    }

    const group = groups[code];
    const members = group.members || [];
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const currentUserName = userData.gmailName || userData.name || 'You';

    // Calculate actual study time for each member based on period
    const rankings = members.map((member, idx) => {
        const studyTime = calculateMemberStudyTime(member.name, period);
        const extendedData = getMemberExtendedData(member);
        const adminReminders = member.reminders || [];
        const unreadReminders = adminReminders.filter(r => !r.read).length;
        
        return {
            rank: idx + 1,
            name: member.name,
            gmailName: member.gmailName || member.name,
            pfp: member.pfp || member.name.charAt(0).toUpperCase(),
            theme: member.theme || 'pastel-breeze',
            time: studyTime,
            status: member.status || 'online',
            streak: extendedData.streak,
            achievements: extendedData.achievements,
            bio: extendedData.bio,
            unreadReminders
        };
    }).sort((a, b) => b.time - a.time);

    // Update ranking numbers after sorting
    rankings.forEach((entry, idx) => {
        entry.rank = idx + 1;
    });

    leaderboard.innerHTML = rankings.map((entry, idx) => {
        const achievementBadges = entry.achievements.slice(0, 2).map(a => `<span class="achievement-badge" title="${a.name}">${a.icon}</span>`).join('');
        const reminderBadge = entry.unreadReminders > 0 ? `<span class="reminder-badge">${entry.unreadReminders}</span>` : '';
        
        return `
        <div class="rank-card ${idx === 0 ? 'gold-tint' : ''}" style="border-left-color: var(--accent-1);">
            <span class="rank-num">#${entry.rank}</span>
            <div class="user-avatar" style="background: var(--accent-1); color: white;">
                ${entry.pfp.startsWith('http') ? `<img src="${entry.pfp}" alt="${entry.name}" style="width:100%;height:100%;border-radius:50%;">` : entry.pfp}
            </div>
            <div class="user-info">
                <strong>${entry.gmailName}</strong>
                <p class="status-text">${getStatusText(entry.status)} ${entry.streak > 0 ? `• 🔥${entry.streak}d` : ''}</p>
                <div class="achievement-row">${achievementBadges}</div>
            </div>
            <div class="user-time">
                ${formatTimeDisplay(entry.time, period)}
                ${reminderBadge}
            </div>
        </div>
    `}).join('');
}

function getStatusText(status) {
    switch(status) {
        case 'studying': return '🔥 Studying';
        case 'online': return '🟢 Online';
        case 'offline': return '⚫ Offline';
        default: return '✅ Active';
    }
}

function setGroupTheme(theme) {
    const code = localStorage.getItem('currentGroupCode');
    if (!code) return;

    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[code];
    if (!group) return;

    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';
    const memberIndex = group.members.findIndex(m => m.name === userName);
    if (memberIndex !== -1) {
        group.members[memberIndex].theme = theme;
        localStorage.setItem('studyGroups', JSON.stringify(groups));
        loadLeaderboard(); // Refresh to show updated theme
    }
}

function updateMemberBio(newBio) {
    const code = localStorage.getItem('currentGroupCode');
    if (!code) return;

    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[code];
    if (!group) return;

    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';
    const memberIndex = group.members.findIndex(m => m.name === userName);
    if (memberIndex !== -1) {
        group.members[memberIndex].bio = newBio || 'No bio yet';
        localStorage.setItem('studyGroups', JSON.stringify(groups));
        loadLeaderboard();
    }
}

function showBioEditModal() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';

    if (!code || !groups[code]) return;

    const group = groups[code];
    const member = group.members.find(m => m.name === userName);
    if (!member) return;

    const currentBio = member.bio || '';
    const newBio = prompt('📝 Update your bio (max 60 chars):', currentBio);
    
    if (newBio !== null) {
        const limitedBio = newBio.substring(0, 60);
        updateMemberBio(limitedBio);
        alert('✓ Bio updated!');
    }
}

function editGroupName() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';

    if (!code || !groups[code]) return;

    const group = groups[code];
    
    // Check if user is admin
    if (group.admin !== userName) {
        alert('❌ Only the group admin can edit the group name');
        return;
    }

    const currentName = group.name;
    const newName = prompt('📝 Edit group name (max 50 chars):', currentName);
    
    if (newName !== null && newName.trim()) {
        const limitedName = newName.substring(0, 50).trim();
        group.name = limitedName;
        localStorage.setItem('studyGroups', JSON.stringify(groups));
        loadGroupInfo(); // Refresh to show updated name
        loadLeaderboard(); // Refresh leaderboard
        alert('✓ Group name updated!');
    }
}

// ========== MEMBER ACTIVITY FEED ==========
function getMemberActivityFeed(groupCode, limit = 10) {
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[groupCode];
    if (!group) return [];

    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const currentUserName = userData.gmailName || userData.name || 'You';
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];

    const activities = [];

    group.members.forEach(member => {
        // Filter sessions for this member (match by name)
        const memberSessions = sessions.filter(s => s.date && s.label);
        
        const memberActivities = memberSessions.map(s => {
            const isManual = s.isManual || (!s.startTime && !s.endTime);
            const manualLabel = isManual ? ' (Manually added)' : '';
            
            return {
                type: 'study',
                memberName: member.name,
                gmailName: member.gmailName, // Will be set if available
                pfp: member.pfp,
                description: `studied ${s.label} for ${s.time}${manualLabel}`,
                time: s.date,
                isManual: isManual
            };
        });
        
        activities.push(...memberActivities);
    });

    return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, limit);
}

function showActivityFeed() {
    const code = localStorage.getItem('currentGroupCode');
    if (!code) return;

    const activities = getMemberActivityFeed(code, 8);
    
    if (activities.length === 0) return;

    let feedHTML = `
        <div class="activity-feed-section">
            <h4>📊 Recent Activity</h4>
            <div class="activity-list">
    `;

    activities.forEach(activity => {
        const timeAgo = getTimeAgoString(activity.time);
        const displayName = activity.gmailName || activity.memberName;
        const manualBadge = activity.isManual ? '<span class="manual-badge" title="Manually added">📝</span>' : '';
        
        feedHTML += `
            <div class="activity-item">
                <span class="activity-avatar">${activity.pfp}</span>
                <div class="activity-details">
                    <strong>${displayName}</strong> ${activity.description}
                    <p class="activity-time">${timeAgo} ${manualBadge}</p>
                </div>
            </div>
        `;
    });

    feedHTML += `
            </div>
        </div>
    `;

    const leaderboardSection = document.querySelector('.section-card:nth-child(2)');
    if (leaderboardSection) {
        leaderboardSection.insertAdjacentHTML('afterend', feedHTML);
    }
}

function getTimeAgoString(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// Run this when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const savedGroup = localStorage.getItem('myStudyGroup');
    if (savedGroup) {
        // If a group was saved, automatically show the dashboard 
        // instead of the "Join" screen
        const groupData = JSON.parse(savedGroup);
        localStorage.setItem('currentGroupCode', groupData.code);
        loadGroupInfo();
    }
});

function leaveGroup() {
    // Only remove it when they explicitly click "Leave"
    localStorage.removeItem('myStudyGroup');
    localStorage.removeItem('currentGroupCode');
    location.reload(); 
}

// Calculate actual study time for a member based on period
function calculateMemberStudyTime(memberName, period) {
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    const now = new Date();
    let totalMinutes = 0;

    sessions.forEach(session => {
        // Check if session belongs to this member (in a real app, sessions would be tagged with user)
        // For now, we'll assume all sessions belong to the current user
        const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
        const currentUserName = userData.gmailName || userData.name || 'You';
        
        if (memberName === currentUserName && session.date) {
            const sessionDate = new Date(session.date);
            
            // Check if session falls within the requested period
            if (isSessionInPeriod(sessionDate, now, period)) {
                totalMinutes += timeStringToMinutes(session.time);
            }
        }
    });

    return totalMinutes;
}

// Get member data including streak and achievements
function getMemberExtendedData(member) {
    const streak = calculateMemberStreak(member.name);
    const achievements = calculateMemberAchievements(member.name, streak);
    return {
        streak,
        achievements,
        bio: member.bio || 'No bio yet'
    };
}

// Calculate study streak (consecutive days studied)
function calculateMemberStreak(memberName) {
    const sessions = JSON.parse(localStorage.getItem('timerSessions')) || [];
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const currentUserName = userData.gmailName || userData.name || 'You';
    
    if (memberName !== currentUserName) return 0;

    const sessionDates = sessions
        .filter(s => s.date)
        .map(s => new Date(s.date).toDateString())
        .filter((date, idx, arr) => arr.indexOf(date) === idx) // Unique dates
        .sort((a, b) => new Date(b) - new Date(a)); // Sort descending

    if (sessionDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of sessionDates) {
        const sessionDate = new Date(dateStr);
        const diffDays = Math.floor((currentDate - sessionDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Calculate achievements and badges
function calculateMemberAchievements(memberName, streak) {
    const weekTime = calculateMemberStudyTime(memberName, 'week');
    const monthTime = calculateMemberStudyTime(memberName, 'month');
    const achievements = [];

    // Streak achievements
    if (streak >= 7) achievements.push({ icon: '🔥', name: 'Week Warrior', desc: '7 day streak' });
    if (streak >= 14) achievements.push({ icon: '⚡', name: 'Legend', desc: '14 day streak' });
    if (streak >= 30) achievements.push({ icon: '👑', name: 'Master', desc: '30 day streak' });

    // Study time achievements
    if (weekTime >= 21 * 60) achievements.push({ icon: '💪', name: 'Week Champion', desc: '21+ hours/week' });
    if (monthTime >= 100 * 60) achievements.push({ icon: '🏆', name: 'Month Master', desc: '100+ hours/month' });

    return achievements;
}

// Get study hour status for admin reminders
function getStudyHourStatus(memberName) {
    const weekTime = calculateMemberStudyTime(memberName, 'week');
    const weekHours = Math.floor(weekTime / 60);
    return {
        hours: weekHours,
        status: weekHours >= 10 ? 'active' : weekHours >= 5 ? 'moderate' : 'low'
    };
}

// Check if a session date falls within the specified period
function isSessionInPeriod(sessionDate, now, period) {
    const sessionYear = sessionDate.getFullYear();
    const sessionMonth = sessionDate.getMonth();
    const sessionDay = sessionDate.getDate();
    const sessionWeek = getWeekNumber(sessionDate);
    
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();
    const nowWeek = getWeekNumber(now);

    switch (period) {
        case 'today':
            return sessionYear === nowYear && sessionMonth === nowMonth && sessionDay === nowDay;
        case 'week':
            return sessionYear === nowYear && sessionWeek === nowWeek;
        case 'month':
            return sessionYear === nowYear && sessionMonth === nowMonth;
        default:
            return false;
    }
}

// Get week number of the year
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Convert time string (HH:MM:SS) to minutes
function timeStringToMinutes(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 60 + minutes + (seconds || 0) / 60;
}

// Format time display based on period
function formatTimeDisplay(minutes, period) {
    switch (period) {
        case 'today':
            return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
        case 'week':
            const hours = Math.floor(minutes / 60);
            return `${hours}h`;
        case 'month':
            const monthHours = Math.floor(minutes / 60);
            return `${monthHours}h`;
        default:
            return `${Math.floor(minutes / 60)}h ${Math.floor(minutes % 60)}m`;
    }
}

// ========== ADMIN REMINDER SYSTEM ==========
function showLowStudyHourReminders() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const currentUserName = userData.gmailName || userData.name || 'You';

    if (!code || !groups[code]) return;

    const group = groups[code];
    const isAdmin = group.admin === currentUserName;

    if (!isAdmin) return;

    // Find members with low study hours
    const lowStudyMembers = group.members
        .map(member => ({
            ...member,
            status: getStudyHourStatus(member.name)
        }))
        .filter(m => m.status.status === 'low' && m.name !== currentUserName);

    if (lowStudyMembers.length === 0) return;

    let reminderHTML = `
        <div id="lowStudyBanner" class="low-study-banner">
            <div class="banner-header">
                <h4>📊 Members Needing Study Boost</h4>
                <span class="close-btn" onclick="document.getElementById('lowStudyBanner').remove()">✕</span>
            </div>
            <div class="low-study-list">
    `;

    lowStudyMembers.forEach(member => {
        reminderHTML += `
            <div class="low-study-item">
                <div class="member-info">
                    <span class="small-avatar">${member.pfp}</span>
                    <div>
                        <strong>${member.name}</strong>
                        <p>${member.status.hours}h this week</p>
                    </div>
                </div>
                <button class="send-reminder-btn" onclick="sendStudyReminder('${code}', '${member.name}')">📢 Send Reminder</button>
            </div>
        `;
    });

    reminderHTML += `
            </div>
        </div>
    `;

    const banner = document.getElementById('approvalBanner');
    if (banner) {
        banner.insertAdjacentHTML('afterend', reminderHTML);
    } else {
        const groupInfo = document.getElementById('groupInfo');
        if (groupInfo) {
            groupInfo.insertAdjacentHTML('beforebegin', reminderHTML);
        }
    }
}

function sendStudyReminder(code, memberName) {
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[code];
    
    if (!group) return;

    const memberIdx = group.members.findIndex(m => m.name === memberName);
    if (memberIdx === -1) return;

    // Add reminder to member's record
    if (!group.members[memberIdx].reminders) {
        group.members[memberIdx].reminders = [];
    }

    group.members[memberIdx].reminders.push({
        id: Date.now(),
        message: '📚 Admin sent you a study reminder! Keep studying! 💪',
        sentAt: new Date().toISOString(),
        read: false
    });

    groups[code] = group;
    localStorage.setItem('studyGroups', JSON.stringify(groups));

    alert(`✓ Reminder sent to ${memberName}!`);
    showLowStudyHourReminders();
}

// Show reminders banner to user when page loads
function showReceivedReminders() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const currentUserName = userData.gmailName || userData.name || 'You';

    if (!code || !groups[code]) return;

    const group = groups[code];
    const member = group.members.find(m => m.name === currentUserName);
    
    if (!member || !member.reminders || member.reminders.length === 0) return;

    const unreadReminders = member.reminders.filter(r => !r.read);
    
    unreadReminders.forEach(reminder => {
        let reminderBannerHTML = `
            <div class="reminder-received-banner" id="reminder-${reminder.id}">
                <div class="reminder-content">
                    <span>${reminder.message}</span>
                </div>
                <button class="remove-reminder-btn" onclick="removeReminderBanner(${reminder.id})">✕</button>
            </div>
        `;

        const container = document.querySelector('.content-container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', reminderBannerHTML);
        }

        // Mark as read
        const memberIdx = group.members.findIndex(m => m.name === currentUserName);
        if (memberIdx !== -1) {
            const reminderIdx = group.members[memberIdx].reminders.findIndex(r => r.id === reminder.id);
            if (reminderIdx !== -1) {
                group.members[memberIdx].reminders[reminderIdx].read = true;
                groups[code] = group;
                localStorage.setItem('studyGroups', JSON.stringify(groups));
            }
        }
    });
}

function removeReminderBanner(reminderId) {
    const banner = document.getElementById(`reminder-${reminderId}`);
    if (banner) banner.remove();
}

// ========== ADMIN APPROVAL SYSTEM ==========
function showAdminApprovalBanner() {
    const code = localStorage.getItem('currentGroupCode');
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const userData = JSON.parse(localStorage.getItem('vibeUser') || '{}');
    const userName = userData.gmailName || userData.name || 'You';

    if (!code || !groups[code]) return;

    const group = groups[code];
    const isAdmin = group.admin === userName;
    const hasPendingRequests = group.joinRequests && group.joinRequests.length > 0;

    if (!isAdmin || !hasPendingRequests) return;

    let bannerHTML = `
        <div id="approvalBanner" class="admin-approval-banner">
            <div class="approval-banner-header">
                <h4>📬 Pending Join Requests (${group.joinRequests.length})</h4>
                <button class="close-btn" onclick="closeApprovalBanner()">✕</button>
            </div>
            <div class="approval-requests-list">
    `;

    group.joinRequests.forEach((request, idx) => {
        bannerHTML += `
            <div class="approval-request-card">
                <div class="request-user">
                    <span class="user-badge">${request.pfp}</span>
                    <span>${request.name}</span>
                </div>
                <div class="request-actions">
                    <button class="approve-btn" onclick="approveJoinRequest('${code}', ${idx})">✓ Approve</button>
                    <button class="reject-btn" onclick="rejectJoinRequest('${code}', ${idx})">✗ Reject</button>
                </div>
            </div>
        `;
    });

    bannerHTML += `
            </div>
        </div>
    `;

    const existingBanner = document.getElementById('approvalBanner');
    if (existingBanner) existingBanner.remove();

    const groupInfo = document.getElementById('groupInfo');
    if (groupInfo) {
        groupInfo.insertAdjacentHTML('beforebegin', bannerHTML);
    }
}

function approveJoinRequest(code, requestIdx) {
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[code];

    if (!group || !group.joinRequests || !group.joinRequests[requestIdx]) return;

    const request = group.joinRequests[requestIdx];
    
    // Add to members
    group.members.push({
        name: request.name,
        gmailName: request.gmailName || request.name,
        joinedAt: new Date().toISOString(),
        theme: localStorage.getItem('selected-theme') || 'pastel-breeze',
        pfp: request.pfp,
        status: 'online',
        isAdmin: false,
        bio: 'No bio yet',
        reminders: []
    });

    // Remove from requests
    group.joinRequests.splice(requestIdx, 1);

    groups[code] = group;
    localStorage.setItem('studyGroups', JSON.stringify(groups));

    // Add group to their group list
    let userGroups = JSON.parse(localStorage.getItem('userGroupsList') || '[]');
    if (!userGroups.includes(code)) {
        userGroups.push(code);
        localStorage.setItem('userGroupsList', JSON.stringify(userGroups));
    }

    alert(`✓ ${request.name} has been approved and added to the group!`);
    showAdminApprovalBanner();
    loadLeaderboard();
}

function rejectJoinRequest(code, requestIdx) {
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const group = groups[code];

    if (!group || !group.joinRequests || !group.joinRequests[requestIdx]) return;

    const request = group.joinRequests[requestIdx];
    group.joinRequests.splice(requestIdx, 1);

    groups[code] = group;
    localStorage.setItem('studyGroups', JSON.stringify(groups));

    alert(`✗ ${request.name}'s join request has been rejected.`);
    showAdminApprovalBanner();
}

function closeApprovalBanner() {
    const banner = document.getElementById('approvalBanner');
    if (banner) banner.remove();
}

// ========== BROWSE ALL GROUPS ==========
function showBrowseAllGroups() {
    const groups = JSON.parse(localStorage.getItem('studyGroups')) || {};
    const allGroupsHTML = Object.values(groups).map(group => `
        <div class="all-groups-card">
            <div class="group-info-card">
                <h4>📚 ${group.name}</h4>
                <p class="group-desc">${group.description || 'No description provided'}</p>
                <p class="group-stats">👥 ${group.members.length} members • Code: <strong>${group.code}</strong></p>
            </div>
            <button class="join-group-btn" onclick="document.getElementById('groupCodeInput').value='${group.code}'; joinGroup('${group.code}')">Join Group</button>
        </div>
    `).join('');

    let container = document.getElementById('browseGroupsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'browseGroupsContainer';
        container.className = 'section-card';
        document.querySelector('.content-container').insertBefore(container, document.querySelector('.section-card:nth-child(2)'));
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>🌐 All Available Groups</h3>
            <button class="close-btn" onclick="document.getElementById('browseGroupsContainer').remove()">✕</button>
        </div>
        <div class="all-groups-grid">
            ${allGroupsHTML || '<p style="text-align: center; opacity: 0.7;">No groups available yet.</p>'}
        </div>
    `;
}
