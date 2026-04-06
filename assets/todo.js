// ========== ENHANCED TODO WITH ALARM ==========

function addTask() {
    const input = document.getElementById("taskInput");
    const timeInput = document.getElementById("taskTime");
    const taskText = input.value.trim();
    const taskTime = timeInput.value;

    if (taskText === "" || !taskTime) return;

    const li = document.createElement("li");
    li.classList.add('task-item');

    li.innerHTML = `
        <span class="task-title">${taskText}</span>
        <span class="task-time">${taskTime}</span>
        <div class="task-actions">
            <input type="checkbox" class="task-check">
            <button class="delete-btn" onclick="deleteTask(this)">✖</button>
        </div>
    `;

    li.dataset.task = taskText;
    li.dataset.time = taskTime;
    li.dataset.snoozed = "0";
    li.dataset.snoozeUntil = "";
    li.dataset.alarmDone = "0";

    li.querySelector('.task-check').addEventListener('change', function () {
        li.classList.toggle('completed');
        if (li.classList.contains('completed')) {
            li.classList.remove('glow-purple');
        }
        saveTodoTasks();
    });

    document.getElementById("taskList").appendChild(li);
    input.value = "";
    timeInput.value = "";
    saveTodoTasks();
    scheduleAlarmForTask(li);
}

function saveTodoTasks() {
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

function deleteTask(button) {
    const li = button.closest('li');
    if (!li) return;
    li.remove();
    saveTodoTasks();
}

function scheduleAlarmForTask(li) {
    // Global function now handles this
}

// Load tasks on page load
window.addEventListener('load', () => {
    const tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
    const listEl = document.getElementById('taskList');
    listEl.innerHTML = '';
    tasks.forEach(t => {
        const li = document.createElement('li');
        li.classList.add('todo-task');
        li.innerHTML = `
            <span class="task-title">${t.text}</span>
            <span class="task-time">${t.time}</span>
            <div class="task-actions">
                <input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''}>
                <button class="delete-btn" onclick="deleteTask(this)">✖</button>
            </div>
        `;
        li.dataset.task = t.text;
        li.dataset.time = t.time;
        li.dataset.snoozed = t.snoozed || "0";
        li.dataset.snoozeUntil = t.snoozeUntil || "";
        li.dataset.alarmDone = t.alarmDone || "0";
        if (t.completed) li.classList.add('completed');
        if (!t.completed && t.alarmDone !== "1") li.classList.add('glow-purple');
        li.querySelector('.task-check').addEventListener('change', function () {
            li.classList.toggle('completed');
            if (li.classList.contains('completed')) {
                li.classList.remove('glow-purple');
            }
            saveTodoTasks();
        });
        listEl.appendChild(li);
        scheduleAlarmForTask(li);
    });
});