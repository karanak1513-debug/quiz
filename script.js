// State Management
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 0;
let selectedQuestions = [];
let userAnswers = [];
let currentCategory = "";
let currentDifficulty = "";

// Configuration
const QUESTIONS_PER_QUIZ = 10;
const SECONDS_PER_QUESTION = 30;

// DOM Elements
const screens = document.querySelectorAll('.screen');
const homeScreen = document.getElementById('home-screen');
const categoryScreen = document.getElementById('category-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const reviewScreen = document.getElementById('review-screen');

const categoryList = document.getElementById('category-list');
const optionsContainer = document.getElementById('options-container');
const questionText = document.getElementById('question-text');
const currentQuestionNum = document.getElementById('current-question-num');
const progressBar = document.getElementById('progress-bar');
const timerDisplay = document.getElementById('quiz-timer');
const quizCategoryLabel = document.getElementById('quiz-category-label');

const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const submitBtn = document.getElementById('submit-btn');

// Categories Definition
const categories = [
    "Banking Basics", "Financial Accounting", "Business Economics",
    "Financial Management", "Stock Market Basics", "RBI & Monetary Policy",
    "Digital Banking", "GST & Taxation", "Insurance", "Management Principles"
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCategories();
    setupEventListeners();
    loadLastScore();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    }
}

function toggleTheme() {
    const isLightMode = document.body.classList.toggle('light-mode');
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');
    
    if (isLightMode) {
        localStorage.setItem('theme', 'light');
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
    } else {
        localStorage.setItem('theme', 'dark');
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    }
}

function initCategories() {
    categoryList.innerHTML = '';
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'cat-card';
        card.innerHTML = `<h3>${cat}</h3>`;
        card.onclick = () => selectCategory(cat);
        categoryList.appendChild(card);
    });
}

function setupEventListeners() {
    // Home Buttons
    document.getElementById('start-btn').onclick = () => showScreen('category-screen');
    document.getElementById('view-last-btn').onclick = () => {
        const lastScore = localStorage.getItem('lastQuizScore');
        if (lastScore) {
            showScreen('result-screen');
            displayResults(JSON.parse(lastScore));
        } else {
            alert("No previous quiz data found.");
        }
    };

    // Navigation Buttons
    document.querySelectorAll('.back-to-home').forEach(btn => {
        btn.onclick = () => showScreen('home-screen');
    });

    document.querySelectorAll('.back-to-category').forEach(btn => {
        btn.onclick = () => showScreen('category-screen');
    });

    document.querySelectorAll('.diff-card').forEach(card => {
        card.onclick = () => selectDifficulty(card.dataset.diff);
    });

    nextBtn.onclick = nextQuestion;
    prevBtn.onclick = prevQuestion;
    submitBtn.onclick = finishQuiz;
    
    document.getElementById('restart-btn').onclick = () => showScreen('home-screen');
    document.getElementById('review-btn').onclick = () => showScreen('review-screen');
    document.getElementById('back-to-result').onclick = () => showScreen('result-screen');
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.onclick = toggleTheme;
}

function showScreen(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function selectCategory(cat) {
    currentCategory = cat;
    showScreen('difficulty-screen');
}

function selectDifficulty(diff) {
    currentDifficulty = diff;
    startQuiz();
}

function startQuiz() {
    // Filter questions based on category and difficulty
    let filtered = window.quizQuestions.filter(q => 
        q.category === currentCategory && q.difficulty === currentDifficulty
    );

    // Fallback if not enough questions for specific combination
    if (filtered.length < QUESTIONS_PER_QUIZ) {
        filtered = window.quizQuestions.filter(q => q.category === currentCategory);
    }

    // Shuffle and pick 20
    selectedQuestions = shuffleArray(filtered).slice(0, QUESTIONS_PER_QUIZ);
    
    // Reset State
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(selectedQuestions.length).fill(null);
    
    // Start Timer
    timeLeft = selectedQuestions.length * SECONDS_PER_QUESTION;
    startTimer();

    // UI Updates
    quizCategoryLabel.innerText = currentCategory;
    showScreen('quiz-screen');
    displayQuestion();
}

function displayQuestion() {
    const q = selectedQuestions[currentQuestionIndex];
    questionText.innerText = q.question;
    currentQuestionNum.innerText = currentQuestionIndex + 1;
    
    // Update Progress
    const progress = ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Options
    optionsContainer.innerHTML = '';
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option';
        if (userAnswers[currentQuestionIndex] === opt) btn.classList.add('selected');
        btn.innerText = opt;
        btn.onclick = () => selectOption(opt);
        optionsContainer.appendChild(btn);
    });

    // Nav Buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    if (currentQuestionIndex === selectedQuestions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

function selectOption(opt) {
    userAnswers[currentQuestionIndex] = opt;
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(o => o.classList.remove('selected'));
    
    // Find the clicked option and highlight it
    const selectedBtn = Array.from(options).find(o => o.innerText === opt);
    if (selectedBtn) selectedBtn.classList.add('selected');
}

function nextQuestion() {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function startTimer() {
    clearInterval(timer);
    updateTimerDisplay();
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timer);
            finishQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft < 60) {
        timerDisplay.style.color = 'var(--error)';
    } else {
        timerDisplay.style.color = 'var(--neon-blue)';
    }
}

function finishQuiz() {
    clearInterval(timer);
    calculateResults();
}

function calculateResults() {
    let correct = 0;
    selectedQuestions.forEach((q, idx) => {
        if (userAnswers[idx] === q.answer) correct++;
    });

    const percentage = (correct / selectedQuestions.length) * 100;
    const wrong = selectedQuestions.length - correct;
    
    let grade = "F";
    let status = "Fail";
    if (percentage >= 90) { grade = "A+"; status = "Pass"; }
    else if (percentage >= 80) { grade = "A"; status = "Pass"; }
    else if (percentage >= 70) { grade = "B"; status = "Pass"; }
    else if (percentage >= 60) { grade = "C"; status = "Pass"; }
    else if (percentage >= 50) { grade = "D"; status = "Pass"; }
    else if (percentage >= 33) { grade = "E"; status = "Pass"; }

    const resultData = {
        score: correct,
        total: selectedQuestions.length,
        percentage: percentage.toFixed(1),
        correct: correct,
        wrong: wrong,
        grade: grade,
        status: status,
        date: new Date().toLocaleDateString(),
        answers: userAnswers,
        questions: selectedQuestions
    };

    // Save to LocalStorage
    localStorage.setItem('lastQuizScore', JSON.stringify(resultData));
    
    displayResults(resultData);
    populateReview(resultData);
    showScreen('result-screen');
}

function displayResults(data) {
    document.getElementById('res-score').innerText = `${data.score}/${data.total}`;
    document.getElementById('res-percent').innerText = `${data.percentage}%`;
    document.getElementById('res-correct').innerText = data.correct;
    document.getElementById('res-wrong').innerText = data.wrong;
    document.getElementById('result-grade').innerText = `Grade: ${data.grade}`;
    document.getElementById('result-status-text').innerText = data.status === "Pass" ? "Congratulations!" : "Keep Practicing!";
    document.getElementById('result-status-icon').innerText = data.status === "Pass" ? "✅" : "📚";
}

function populateReview(data) {
    const container = document.getElementById('review-container');
    container.innerHTML = '';

    data.questions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'review-item';
        
        const userAns = data.answers[idx];
        const isCorrect = userAns === q.answer;

        item.innerHTML = `
            <h4>${idx + 1}. ${q.question}</h4>
            <div class="review-opt ${isCorrect ? 'correct' : (userAns ? 'incorrect' : '')}">
                Your Answer: ${userAns || 'Not Answered'}
            </div>
            ${!isCorrect ? `<div class="review-opt correct">Correct Answer: ${q.answer}</div>` : ''}
        `;
        container.appendChild(item);
    });
}

function loadLastScore() {
    const lastScore = localStorage.getItem('lastQuizScore');
    const display = document.getElementById('last-score-display');
    if (lastScore) {
        const data = JSON.parse(lastScore);
        document.getElementById('last-score-val').innerText = `${data.score}/${data.total}`;
        document.getElementById('last-score-date').innerText = data.date;
        const gradeBadge = document.getElementById('last-score-grade');
        if (gradeBadge) {
            gradeBadge.innerText = `Grade ${data.grade}`;
            gradeBadge.style.color = data.status === "Pass" ? 'var(--success)' : 'var(--error)';
            gradeBadge.style.borderColor = data.status === "Pass" ? 'var(--success)' : 'var(--error)';
            gradeBadge.style.background = data.status === "Pass" ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        }
        display.classList.remove('hidden');
    }
}

// Utility: Shuffle Array
function shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
