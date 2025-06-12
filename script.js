const canvas = document.getElementById('scheduleClock');
const ctx = canvas.getContext('2d');

const activityForm = document.getElementById('activityForm');
const activityNameInput = document.getElementById('activityName');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const activityIndexInput = document.getElementById('activityIndex');
const saveActivityBtn = document.getElementById('saveActivityBtn');
const deleteActivityBtn = document.getElementById('deleteActivityBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const activityList = document.getElementById('activityList');
const timeMarker = document.querySelector('.current-time-marker');
const centerContent = document.querySelector('.center-content');

let activities = [];
let clockRadius;
let activeActivityColor = null;
let activeActivityName = null;
let currentActivityIndex = -1;

function setupCanvas() {
    const wrapper = canvas.parentElement;
    const size = Math.min(wrapper.offsetWidth, wrapper.offsetHeight);
    canvas.width = size;
    canvas.height = size;
    clockRadius = canvas.width / 2;
    drawClock();
    updateScheduleDisplay();
}

function drawClock() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(clockRadius, clockRadius);

    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, clockRadius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#6a0dad';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 24-hour numbers
    ctx.font = `${clockRadius * 0.08}px Poppins`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 24; i++) {
        const angle = (i * Math.PI / 12) - (Math.PI / 2);
        const x = (clockRadius * 0.78) * Math.cos(angle);
        const y = (clockRadius * 0.78) * Math.sin(angle);
        ctx.fillText(i.toString(), x, y);
    }

    // Minute markers
    for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI / 30) - (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(clockRadius * 0.9, 0);
        ctx.lineTo(clockRadius * 0.85, 0);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#bbb';
        ctx.save();
        ctx.rotate(angle);
        ctx.stroke();
        ctx.restore();
    }

    // Activity segments
    activities.forEach(activity => {
        const start = parseTime(activity.startTime);
        const end = parseTime(activity.endTime);
        let duration = end - start;
        if (duration < 0) duration += 1440;
        const startAngle = (start / 1440) * (2 * Math.PI) - Math.PI / 2;
        const endAngle = (end / 1440) * (2 * Math.PI) - Math.PI / 2;

        ctx.beginPath();
        ctx.arc(0, 0, clockRadius * 0.7, startAngle, endAngle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = activity.color;
        ctx.fill();

        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const labelX = (clockRadius * 0.5) * Math.cos(midAngle);
        const labelY = (clockRadius * 0.5) * Math.sin(midAngle);
        ctx.font = `${clockRadius * 0.06}px Poppins`;
        ctx.fillStyle = '#fff';
        ctx.fillText(activity.name, labelX, labelY);
    });

    drawHands();
    ctx.restore();
}

function drawHands() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    const secAngle = ((seconds * 6) + (milliseconds * 0.006)) - 90;
    drawHand(secAngle, clockRadius * 0.9, 2, '#ff4d4d');

    const minAngle = ((minutes * 6) + (seconds * 0.1)) - 90;
    drawHand(minAngle, clockRadius * 0.8, 4, activeActivityColor || '#555');

    const hrAngle = ((hours * 15) + (minutes * 0.25) + (seconds * (0.25 / 60))) - 90;
    drawHand(hrAngle, clockRadius * 0.6, 6, activeActivityColor || '#333');

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#6a0dad';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawHand(angleDegrees, length, width, color) {
    ctx.save();
    ctx.rotate((Math.PI / 180) * angleDegrees);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

function parseTime(timeString) {
    const [h, m] = timeString.split(':').map(Number);
    return h * 60 + m;
}

function updateTimeMarker() {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const angle = (totalMinutes / 1440) * (2 * Math.PI) - (Math.PI / 2);
    const markerRadius = canvas.parentElement.offsetWidth / 2;
    const markerDistance = markerRadius * 0.95;
    timeMarker.style.left = `${markerRadius + markerDistance * Math.cos(angle)}px`;
    timeMarker.style.top = `${markerRadius + markerDistance * Math.sin(angle)}px`;
    updateActiveActivity();
}

function updateScheduleDisplay() {
    activityList.innerHTML = '';
    activities.forEach((a, i) => {
        const li = document.createElement('li');
        li.dataset.index = i;
        li.innerHTML = `
            <div class="activity-details">
                <h4>${a.name}</h4>
                <p>${a.startTime} - ${a.endTime}</p>
            </div>
            <button class="edit-btn action-btn secondary-btn"><i class="fas fa-edit"></i></button>
        `;
        li.querySelector('.edit-btn').addEventListener('click', e => {
            e.stopPropagation();
            editActivity(i);
        });
        activityList.appendChild(li);
    });
    drawClock();
    updateActiveActivity();
}

function updateActiveActivity() {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    activeActivityColor = null;
    activeActivityName = null;

    activityList.querySelectorAll('li').forEach(li => li.classList.remove('active-activity'));

    activities.forEach((a, i) => {
        const start = parseTime(a.startTime);
        const end = parseTime(a.endTime);
        let isActive = false;

        if (start <= end) {
            isActive = totalMinutes >= start && totalMinutes < end;
        } else {
            isActive = totalMinutes >= start || totalMinutes < end;
        }

        if (isActive) {
            const li = activityList.querySelector(`li[data-index="${i}"]`);
            if (li) li.classList.add('active-activity');
            activeActivityColor = a.color;
            activeActivityName = a.name;
        }
    });

    const catIcon = centerContent.querySelector('.cat-icon');
    if (activeActivityName === "Waktu Luang" && catIcon) {
        catIcon.style.display = 'block';
    } else if (catIcon) {
        catIcon.style.display = 'none';
    }
}

function editActivity(index) {
    const a = activities[index];
    activityNameInput.value = a.name;
    startTimeInput.value = a.startTime;
    endTimeInput.value = a.endTime;
    activityIndexInput.value = index;
    saveActivityBtn.textContent = 'Update Activity';
    deleteActivityBtn.style.display = 'inline-block';
    cancelEditBtn.style.display = 'inline-block';
    currentActivityIndex = index;
}

function cancelEdit() {
    activityForm.reset();
    activityIndexInput.value = -1;
    saveActivityBtn.textContent = 'Add Activity';
    deleteActivityBtn.style.display = 'none';
    cancelEditBtn.style.display = 'none';
    currentActivityIndex = -1;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    return '#' + Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * 16)]).join('');
}

activityForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = activityNameInput.value;
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    if (currentActivityIndex > -1) {
        activities[currentActivityIndex] = { ...activities[currentActivityIndex], name, startTime: start, endTime: end };
    } else {
        activities.push({ name, startTime: start, endTime: end, color: getRandomColor() });
    }
    updateScheduleDisplay();
    cancelEdit();
});

deleteActivityBtn.addEventListener('click', () => {
    if (currentActivityIndex > -1) {
        activities.splice(currentActivityIndex, 1);
        updateScheduleDisplay();
        cancelEdit();
    }
});

cancelEditBtn.addEventListener('click', cancelEdit);

document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
});

window.addEventListener('resize', setupCanvas);

setInterval(() => {
    drawClock();
    updateTimeMarker();
}, 1000 / 60);
