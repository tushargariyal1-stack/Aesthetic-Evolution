/**
 * AESTHETIC & HEIGHT EVOLUTION
 * 180-Day Transformation Tracker
 * Main JavaScript Application
 */

// ========================================
// GLOBAL STATE & CONFIGURATION
// ========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker Registered!'))
    .catch(err => console.log('Service Worker Failed!', err));
}

const CONFIG = {
    startWeight: 48,
    targetWeight: 60,
    height: 170,
    age: 21,
    waterGoal: 4000
};

// State management
let state = {
    currentWeight: 48,
    weightHistory: [],
    waterIntake: 0,
    postureExercises: {},
    muscleExercises: {},
    currentSplit: 'push',
    chart: null
};

// ========================================
// LOCAL STORAGE MANAGEMENT
// ========================================

const Storage = {
    keys: {
        weightHistory: 'ae_weightHistory',
        currentWeight: 'ae_currentWeight',
        waterIntake: 'ae_waterIntake',
        postureExercises: 'ae_postureExercises',
        muscleExercises: 'ae_muscleExercises',
        lastReset: 'ae_lastReset'
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('LocalStorage not available');
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },

    clear() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadData();
    initializeChart();
    setupEventListeners();
    updateUI();
    setDefaultDate();
    checkDailyReset();
}

function loadData() {
    // Load weight data
    state.weightHistory = Storage.load(Storage.keys.weightHistory, [
        { date: 'Day 1', weight: CONFIG.startWeight, change: 'Start' }
    ]);
    
    const savedWeight = Storage.load(Storage.keys.currentWeight);
    state.currentWeight = savedWeight || CONFIG.startWeight;
    
    // Load water intake
    state.waterIntake = Storage.load(Storage.keys.waterIntake, 0);
    
    // Load exercise progress
    state.postureExercises = Storage.load(Storage.keys.postureExercises, {});
    state.muscleExercises = Storage.load(Storage.keys.muscleExercises, {});
}

function setDefaultDate() {
    const dateInput = document.getElementById('weightDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

function checkDailyReset() {
    const lastReset = Storage.load(Storage.keys.lastReset);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
        // Reset daily exercises
        state.postureExercises = {};
        state.muscleExercises = {};
        Storage.save(Storage.keys.postureExercises, {});
        Storage.save(Storage.keys.muscleExercises, {});
        Storage.save(Storage.keys.lastReset, today);
    }
}

// ========================================
// CHART.JS INITIALIZATION
// ========================================

function initializeChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 242, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');

    const labels = state.weightHistory.map(entry => entry.date);
    const data = state.weightHistory.map(entry => entry.weight);

    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: data,
                borderColor: '#00f2ff',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f2ff',
                pointBorderColor: '#0f172a',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#00f2ff',
                    borderColor: 'rgba(0, 242, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Weight: ${context.parsed.y} kg`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    min: 45,
                    max: 65,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ========================================
// BMI CALCULATOR
// ========================================

function calculateBMI() {
    const heightInput = document.getElementById('bmiHeight');
    const weightInput = document.getElementById('bmiWeight');
    
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    
    if (!height || !weight) {
        showNotification('Please enter valid height and weight', 'error');
        return;
    }
    
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    
    const bmiNumber = document.getElementById('bmiNumber');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiProgress = document.getElementById('bmiProgress');
    
    bmiNumber.textContent = bmi;
    
    let category, progressPercent, color;
    
    if (bmi < 18.5) {
        category = 'Underweight';
        progressPercent = (bmi / 18.5) * 18.5;
        color = '#3b82f6';
    } else if (bmi < 25) {
        category = 'Normal Weight';
        progressPercent = 18.5 + ((bmi - 18.5) / 6.5) * 6.5;
        color = '#10b981';
    } else if (bmi < 30) {
        category = 'Overweight';
        progressPercent = 25 + ((bmi - 25) / 5) * 5;
        color = '#f59e0b';
    } else {
        category = 'Obese';
        progressPercent = Math.min(30 + ((bmi - 30) / 10) * 5, 40);
        color = '#ef4444';
    }
    
    bmiCategory.textContent = category;
    bmiCategory.style.background = `${color}20`;
    bmiCategory.style.color = color;
    bmiNumber.style.color = color;
    bmiProgress.style.width = `${Math.min(progressPercent, 100)}%`;
    bmiProgress.style.background = color;
}

// ========================================
// WEIGHT TRACKER
// ========================================

function addWeightEntry() {
    const weightInput = document.getElementById('newWeight');
    const dateInput = document.getElementById('weightDate');
    
    const weight = parseFloat(weightInput.value);
    const date = dateInput.value;
    
    if (!weight || weight < 30 || weight > 150) {
        showNotification('Please enter a valid weight', 'error');
        return;
    }
    
    const lastEntry = state.weightHistory[state.weightHistory.length - 1];
    const weightChange = weight - lastEntry.weight;
    
    let changeText;
    if (weightChange > 0) {
        changeText = `+${weightChange.toFixed(1)} kg`;
    } else if (weightChange < 0) {
        changeText = `${weightChange.toFixed(1)} kg`;
    } else {
        changeText = 'No change';
    }
    
    const dayNumber = state.weightHistory.length + 1;
    const dateLabel = date ? `Day ${dayNumber}` : `Day ${dayNumber}`;
    
    const newEntry = {
        date: dateLabel,
        weight: weight,
        change: changeText,
        rawDate: date
    };
    
    state.weightHistory.push(newEntry);
    state.currentWeight = weight;
    
    // Save to local storage
    Storage.save(Storage.keys.weightHistory, state.weightHistory);
    Storage.save(Storage.keys.currentWeight, state.currentWeight);
    
    // Update chart
    updateChart();
    
    // Update UI
    updateEntriesList();
    updateProgressOverview();
    
    // Clear input
    weightInput.value = '';
    
    showNotification(`Weight updated to ${weight} kg!`, 'success');
}

function quickAddWeight(amount) {
    const lastEntry = state.weightHistory[state.weightHistory.length - 1];
    const newWeight = lastEntry.weight + amount;
    
    document.getElementById('newWeight').value = newWeight.toFixed(1);
    addWeightEntry();
}

function updateChart() {
    if (!state.chart) return;
    
    state.chart.data.labels = state.weightHistory.map(entry => entry.date);
    state.chart.data.datasets[0].data = state.weightHistory.map(entry => entry.weight);
    state.chart.update();
}

function updateEntriesList() {
    const entriesList = document.getElementById('entriesList');
    if (!entriesList) return;
    
    entriesList.innerHTML = state.weightHistory.map((entry, index) => `
        <div class="entry-item">
            <span class="entry-date">${entry.date}</span>
            <span class="entry-weight">${entry.weight.toFixed(1)} kg</span>
            <span class="entry-change" style="${getChangeStyle(entry.change)}">${entry.change}</span>
        </div>
    `).reverse().join('');
}

function getChangeStyle(change) {
    if (change === 'Start') return 'background: rgba(0, 242, 255, 0.2); color: #00f2ff;';
    if (change.includes('+')) return 'background: rgba(16, 185, 129, 0.2); color: #10b981;';
    if (change.includes('-')) return 'background: rgba(239, 68, 68, 0.2); color: #ef4444;';
    return 'background: rgba(148, 163, 184, 0.2); color: #94a3b8;';
}

function resetChart() {
    if (confirm('Are you sure you want to reset all weight data?')) {
        state.weightHistory = [{ date: 'Day 1', weight: CONFIG.startWeight, change: 'Start' }];
        state.currentWeight = CONFIG.startWeight;
        
        Storage.save(Storage.keys.weightHistory, state.weightHistory);
        Storage.save(Storage.keys.currentWeight, state.currentWeight);
        
        updateChart();
        updateEntriesList();
        updateProgressOverview();
        
        showNotification('Weight data reset successfully', 'success');
    }
}

// ========================================
// PROGRESS OVERVIEW
// ========================================

function updateProgressOverview() {
    const currentWeightDisplay = document.getElementById('currentWeightDisplay');
    const weightGained = document.getElementById('weightGained');
    const weightRemaining = document.getElementById('weightRemaining');
    const progressPercent = document.getElementById('progressPercent');
    const progressRing = document.getElementById('progressRing');
    const currentWeightStat = document.getElementById('currentWeightStat');
    
    if (currentWeightDisplay) currentWeightDisplay.textContent = state.currentWeight.toFixed(1);
    if (currentWeightStat) currentWeightStat.textContent = state.currentWeight.toFixed(1) + ' kg';
    
    const gained = state.currentWeight - CONFIG.startWeight;
    const remaining = CONFIG.targetWeight - state.currentWeight;
    const percent = Math.min((gained / (CONFIG.targetWeight - CONFIG.startWeight)) * 100, 100);
    
    if (weightGained) weightGained.textContent = `${gained.toFixed(1)} kg`;
    if (weightRemaining) weightRemaining.textContent = `${remaining.toFixed(1)} kg`;
    if (progressPercent) progressPercent.textContent = `${percent.toFixed(0)}%`;
    
    // Update progress ring
    if (progressRing) {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (percent / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
    }
}

// ========================================
// WORKOUT ENGINE
// ========================================

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
}

function switchSplit(split) {
    state.currentSplit = split;
    
    // Update split buttons
    document.querySelectorAll('.split-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update split content
    document.querySelectorAll('.split-content').forEach(content => content.classList.remove('active'));
    document.getElementById(split + 'Split').classList.add('active');
    
    // Update muscle progress
    updateMuscleProgress();
}

function toggleExercise(exerciseId) {
    const checkbox = document.getElementById(exerciseId);
    const card = document.querySelector(`[data-exercise="${exerciseId}"]`);
    
    state.postureExercises[exerciseId] = checkbox.checked;
    Storage.save(Storage.keys.postureExercises, state.postureExercises);
    
    if (checkbox.checked) {
        card.classList.add('completed');
    } else {
        card.classList.remove('completed');
    }
    
    updatePostureProgress();
}

function toggleMuscleExercise(exerciseId) {
    const checkbox = document.getElementById(exerciseId);
    const card = document.querySelector(`[data-exercise="${exerciseId}"]`);
    
    if (!state.muscleExercises[state.currentSplit]) {
        state.muscleExercises[state.currentSplit] = {};
    }
    
    state.muscleExercises[state.currentSplit][exerciseId] = checkbox.checked;
    Storage.save(Storage.keys.muscleExercises, state.muscleExercises);
    
    if (checkbox.checked) {
        card.classList.add('completed');
    } else {
        card.classList.remove('completed');
    }
    
    updateMuscleProgress();
}

function updatePostureProgress() {
    const exercises = ['hanging', 'cobra', 'catcow', 'wallslides'];
    const completed = exercises.filter(ex => state.postureExercises[ex]).length;
    const percent = (completed / exercises.length) * 100;
    
    const progressFill = document.getElementById('postureProgress');
    const progressText = document.getElementById('postureProgressText');
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${completed}/${exercises.length} exercises completed`;
}

function updateMuscleProgress() {
    const splitExercises = state.muscleExercises[state.currentSplit] || {};
    const currentSplitElement = document.getElementById(state.currentSplit + 'Split');
    
    if (!currentSplitElement) return;
    
    const totalExercises = currentSplitElement.querySelectorAll('.exercise-card.muscle').length;
    const completed = Object.values(splitExercises).filter(v => v).length;
    const percent = totalExercises > 0 ? (completed / totalExercises) * 100 : 0;
    
    const progressFill = document.getElementById('muscleProgress');
    const progressText = document.getElementById('muscleProgressText');
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${completed}/${totalExercises} exercises completed`;
}

function restoreExerciseStates() {
    // Restore posture exercises
    Object.entries(state.postureExercises).forEach(([id, checked]) => {
        const checkbox = document.getElementById(id);
        const card = document.querySelector(`[data-exercise="${id}"]`);
        if (checkbox && checked) {
            checkbox.checked = true;
            if (card) card.classList.add('completed');
        }
    });
    
    // Restore muscle exercises
    Object.entries(state.muscleExercises).forEach(([split, exercises]) => {
        Object.entries(exercises).forEach(([id, checked]) => {
            const checkbox = document.getElementById(id);
            const card = document.querySelector(`[data-exercise="${id}"]`);
            if (checkbox && checked) {
                checkbox.checked = true;
                if (card) card.classList.add('completed');
            }
        });
    });
    
    updatePostureProgress();
    updateMuscleProgress();
}

// ========================================
// WATER TRACKER
// ========================================

function addWater(amount) {
    state.waterIntake += amount;
    
    if (state.waterIntake > CONFIG.waterGoal) {
        state.waterIntake = CONFIG.waterGoal;
    }
    
    Storage.save(Storage.keys.waterIntake, state.waterIntake);
    updateWaterDisplay();
    
    if (state.waterIntake === CONFIG.waterGoal) {
        showNotification('Congratulations! You reached your daily water goal!', 'success');
    }
}

function resetWater() {
    state.waterIntake = 0;
    Storage.save(Storage.keys.waterIntake, 0);
    updateWaterDisplay();
}

function updateWaterDisplay() {
    const waterAmount = document.getElementById('waterAmount');
    const waterPercentage = document.getElementById('waterPercentage');
    const waterLevel = document.getElementById('waterLevel');
    
    const percent = (state.waterIntake / CONFIG.waterGoal) * 100;
    
    if (waterAmount) waterAmount.textContent = state.waterIntake;
    if (waterPercentage) waterPercentage.textContent = `${Math.round(percent)}%`;
    if (waterLevel) waterLevel.style.height = `${percent}%`;
}

// ========================================
// NAVIGATION & UI
// ========================================

function setupEventListeners() {
    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Close menu on link click
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Restore exercise states after DOM is ready
    setTimeout(restoreExerciseStates, 100);
}

function updateUI() {
    updateEntriesList();
    updateProgressOverview();
    updateWaterDisplay();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#00f2ff'};
        color: ${type === 'info' ? '#0f172a' : '#fff'};
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function startDayOne() {
    // Scroll to dashboard
    document.getElementById('dashboard').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    showNotification('Welcome to Day 1! Let\'s begin your transformation!', 'success');
}

function resetAllData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
        Storage.clear();
        
        state = {
            currentWeight: CONFIG.startWeight,
            weightHistory: [{ date: 'Day 1', weight: CONFIG.startWeight, change: 'Start' }],
            waterIntake: 0,
            postureExercises: {},
            muscleExercises: {},
            currentSplit: 'push',
            chart: state.chart
        };
        
        updateChart();
        updateUI();
        
        // Uncheck all exercises
        document.querySelectorAll('.exercise-checkbox input').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('.exercise-card').forEach(card => {
            card.classList.remove('completed');
        });
        
        showNotification('All data has been reset. Good luck on your journey!', 'success');
    }
}

// ========================================
// EXPORT FOR GLOBAL ACCESS
// ========================================

window.calculateBMI = calculateBMI;
window.addWeightEntry = addWeightEntry;
window.quickAddWeight = quickAddWeight;
window.resetChart = resetChart;
window.switchTab = switchTab;
window.switchSplit = switchSplit;
window.toggleExercise = toggleExercise;
window.toggleMuscleExercise = toggleMuscleExercise;
window.addWater = addWater;
window.resetWater = resetWater;
window.startDayOne = startDayOne;
window.resetAllData = resetAllData;
