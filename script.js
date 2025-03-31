import { scenarios, rewards, badges, levels, TIME_LIMIT, STREAK_REQUIREMENT } from './config.js';

// Game state
let currentScenarioIndex = 0;
let score = 0;
let highScore = localStorage.getItem('eqHighScore') || 0;
let earnedRewards = [];
let earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || [];
let currentStreak = 0;
let bestStreak = parseInt(localStorage.getItem('bestStreak') || 0);
let currentLevel = 1;
let timeLeft = TIME_LIMIT;
let timerInterval;
let lastAnswerTime = 0;

// DOM elements
const homePage = document.getElementById('home-page');
const gameContent = document.getElementById('game-content');
const startGameBtn = document.getElementById('start-game-btn');
const scenarioText = document.getElementById('scenario-text');
const strengthBtn = document.getElementById('strength-btn');
const weaknessBtn = document.getElementById('weakness-btn');
const opportunityBtn = document.getElementById('opportunity-btn');
const threatBtn = document.getElementById('threat-btn');
const feedback = document.getElementById('feedback');
const feedbackText = document.getElementById('feedback-text');
const nextBtn = document.getElementById('next-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const rewardsContainer = document.getElementById('rewards-container');
const rewardIcon = document.getElementById('reward-icon');
const rewardMessage = document.getElementById('reward-message');
const continueBtn = document.getElementById('continue-btn');
const progressBar = document.getElementById('progress-bar');
const levelDisplay = document.getElementById('level-display');
const streakCounter = document.getElementById('streak-counter');
const badgesContainer = document.getElementById('badges-container');
const streakDisplay = document.getElementById('streak-display');
const bestStreakDisplay = document.getElementById('best-streak-display');
const timeBar = document.getElementById('time-bar');

// Initialize the application
function initApp() {
    // Show home page first
    homePage.classList.remove('hidden');
    gameContent.classList.add('hidden');
    
    // Add event listener for start button
    startGameBtn.addEventListener('click', startGame);
    
    // Update the high score display
    highScoreElement.textContent = highScore;
}

// Start the game
function startGame() {
    // Hide home page and show game content
    homePage.classList.add('hidden');
    gameContent.classList.remove('hidden');
    
    // Shuffle the scenarios array
    shuffleArray(scenarios);
    
    // Create badge elements
    createBadges();
    
    // Update stats
    updateStats();
    
    // Show the first scenario
    showScenario();
    
    // Add event listeners for SWOT buttons
    strengthBtn.addEventListener('click', () => checkAnswer('strength'));
    weaknessBtn.addEventListener('click', () => checkAnswer('weakness'));
    opportunityBtn.addEventListener('click', () => checkAnswer('opportunity'));
    threatBtn.addEventListener('click', () => checkAnswer('threat'));
    
    nextBtn.addEventListener('click', nextScenario);
    continueBtn.addEventListener('click', closeRewardModal);
}

// Create badge elements
function createBadges() {
    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge';
        badgeElement.id = `badge-${badge.id}`;
        badgeElement.innerHTML = badge.icon;
        badgeElement.title = `${badge.name}: ${badge.requirement}`;
        
        // If this badge is already earned, show it as active
        if (earnedBadges.includes(badge.id)) {
            badgeElement.classList.add('earned');
        }
        
        badgesContainer.appendChild(badgeElement);
    });
}

// Update game stats displays
function updateStats() {
    streakDisplay.textContent = currentStreak;
    bestStreakDisplay.textContent = bestStreak;
    
    // Update progress bar based on current scenario
    const progress = (currentScenarioIndex / scenarios.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update level indicator
    updateLevel();
}

// Update player level based on score
function updateLevel() {
    for (let i = levels.length - 1; i >= 0; i--) {
        if (score >= levels[i].minScore) {
            currentLevel = levels[i].level;
            levelDisplay.textContent = `Level ${currentLevel}: ${levels[i].name}`;
            break;
        }
    }
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Display the current scenario
function showScenario() {
    if (currentScenarioIndex < scenarios.length) {
        const scenario = scenarios[currentScenarioIndex];
        scenarioText.textContent = scenario.text;
        feedback.classList.add('hidden');
        
        // Enable all SWOT buttons
        strengthBtn.disabled = false;
        weaknessBtn.disabled = false;
        opportunityBtn.disabled = false;
        threatBtn.disabled = false;
        
        // Reset and start timer
        timeLeft = TIME_LIMIT;
        updateTimeBar();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        
        lastAnswerTime = Date.now();
    } else {
        endGame();
    }
}

// Update the timer
function updateTimer() {
    timeLeft--;
    updateTimeBar();
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        checkAnswer('timeout');
    }
}

// Update the time bar
function updateTimeBar() {
    const percentage = (timeLeft / TIME_LIMIT) * 100;
    timeBar.style.width = `${percentage}%`;
}

// Check if the user's answer is correct
function checkAnswer(answer) {
    clearInterval(timerInterval);
    
    const correctAnswer = scenarios[currentScenarioIndex].answer;
    const isCorrect = answer === correctAnswer;
    const answerTime = (Date.now() - lastAnswerTime) / 1000;
    
    // Disable all SWOT buttons
    strengthBtn.disabled = true;
    weaknessBtn.disabled = true;
    opportunityBtn.disabled = true;
    threatBtn.disabled = true;
    
    // Handle streaks and feedback
    if (isCorrect) {
        currentStreak++;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            localStorage.setItem('bestStreak', bestStreak);
        }
        if (currentStreak >= 2) {
            showStreakNotification();
        }
        
        score++;
        scoreElement.textContent = score;
        feedbackText.textContent = `Correct! ${scenarios[currentScenarioIndex].explanation}`;
        
        animateScoreIncrease();
        checkForBadges(answerTime);
        checkForRewards();
        
        feedback.classList.add('correct');
        feedback.classList.remove('incorrect');
    } else {
        currentStreak = 0;
        feedbackText.textContent = `Incorrect. ${scenarios[currentScenarioIndex].explanation}`;
        feedback.classList.add('incorrect');
        feedback.classList.remove('correct');
    }
    
    feedback.classList.remove('hidden');
    updateStats();
}

// Show streak notification
function showStreakNotification() {
    streakCounter.textContent = `${currentStreak}x Streak!`;
    streakCounter.classList.add('active');
    
    setTimeout(() => {
        streakCounter.classList.remove('active');
    }, 2000);
}

// Animate score increase
function animateScoreIncrease() {
    const animation = document.createElement('div');
    animation.className = 'score-animation';
    animation.textContent = '+1';
    animation.style.top = `${scoreElement.getBoundingClientRect().top}px`;
    animation.style.left = `${scoreElement.getBoundingClientRect().left}px`;
    document.body.appendChild(animation);
    
    setTimeout(() => {
        document.body.removeChild(animation);
    }, 1000);
}

// Check for badges earned
function checkForBadges(answerTime) {
    // First correct answer badge
    if (score === 1 && !earnedBadges.includes(1)) {
        earnBadge(1);
    }
    
    // Streak badge
    if (currentStreak >= STREAK_REQUIREMENT && !earnedBadges.includes(2)) {
        earnBadge(2);
    }
    
    // Speed badge
    if (answerTime < 5 && !earnedBadges.includes(3)) {
        earnBadge(3);
    }
    
    // Score badge
    if (score >= 5 && !earnedBadges.includes(4)) {
        earnBadge(4);
    }
}

// Award a badge to the player
function earnBadge(badgeId) {
    earnedBadges.push(badgeId);
    localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
    
    const badgeElement = document.getElementById(`badge-${badgeId}`);
    badgeElement.classList.add('earned');
    
    // Find the badge details
    const badge = badges.find(b => b.id === badgeId);
    
    // Show temporary notification
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.innerHTML = `
        <h3>Badge Unlocked! ${badge.icon}</h3>
        <p>${badge.name}: ${badge.requirement}</p>
    `;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.zIndex = '100';
    notification.style.animation = 'slide-in 0.5s forwards';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slide-out 0.5s forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Move to the next scenario
function nextScenario() {
    currentScenarioIndex++;
    showScenario();
}

// Check if the user earned any new rewards
function checkForRewards() {
    for (const reward of rewards) {
        if (score === reward.score && !earnedRewards.includes(reward.score)) {
            earnedRewards.push(reward.score);
            showReward(reward);
            break;
        }
    }
}

// Display the reward notification
function showReward(reward) {
    rewardIcon.textContent = reward.icon;
    rewardMessage.innerHTML = `<strong>${reward.title}</strong><br>${reward.message}`;
    rewardsContainer.classList.remove('hidden');
}

// Close the reward modal
function closeRewardModal() {
    rewardsContainer.classList.add('hidden');
}

// End game and show final score
function endGame() {
    clearInterval(timerInterval);
    scenarioText.textContent = "Game Over! You've completed all scenarios.";
    
    // Check for new high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('eqHighScore', highScore);
        highScoreElement.textContent = highScore;
        
        // Create a restart button
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'New High Score! Play Again?';
        restartBtn.addEventListener('click', restartGame);
        restartBtn.style.backgroundColor = '#f39c12';
        restartBtn.style.margin = '20px auto';
        restartBtn.style.display = 'block';
        
        document.querySelector('.game-container').appendChild(restartBtn);
    } else {
        // Create a restart button
        const restartBtn = document.createElement('button');
        restartBtn.textContent = 'Play Again';
        restartBtn.addEventListener('click', restartGame);
        restartBtn.style.backgroundColor = '#6c757d';
        restartBtn.style.margin = '20px auto';
        restartBtn.style.display = 'block';
        
        document.querySelector('.game-container').appendChild(restartBtn);
    }
    
    // Hide other game elements
    feedback.classList.add('hidden');
    document.querySelector('.buttons-container').style.display = 'none';
    document.querySelector('.time-bar-container').style.display = 'none';
}

// Restart the game
function restartGame() {
    // Reset game state
    currentScenarioIndex = 0;
    score = 0;
    scoreElement.textContent = score;
    earnedRewards = [];
    currentStreak = 0;
    
    // Reset UI
    document.querySelector('.buttons-container').style.display = 'flex';
    document.querySelector('.time-bar-container').style.display = 'block';
    const restartBtn = document.querySelector('.game-container button:not(#next-btn):not(#strength-btn):not(#weakness-btn):not(#opportunity-btn):not(#threat-btn)');
    if (restartBtn) {
        restartBtn.remove();
    }
    
    // Update stats
    updateStats();
    
    // Reshuffle scenarios and start again
    shuffleArray(scenarios);
    showScenario();
}

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', initApp);