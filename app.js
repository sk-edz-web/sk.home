import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4FPU1uapSWjbpyR1Jjf854T7V4qMV-TM",
  authDomain: "skedz-a13eb.firebaseapp.com",
  databaseURL: "https://skedz-a13eb-default-rtdb.firebaseio.com",
  projectId: "skedz-a13eb",
  storageBucket: "skedz-a13eb.firebasestorage.app",
  messagingSenderId: "318431223204",
  appId: "1:318431223204:web:90f2205f22aebc341eb531",
  measurementId: "G-2NRVJY33M5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUserUid = null;
let expenseChart = null;
let currentTab = 'spends'; 

// ==========================================
// CUSTOM IN-APP MODAL SYSTEM
// ==========================================

// 1. Message Modal
const msgModal = document.getElementById('app-modal');
const msgModalTitle = document.getElementById('modal-title');
const msgModalText = document.getElementById('modal-message');

function showModal(title, message) {
    msgModalTitle.innerText = title;
    msgModalText.innerText = message;
    msgModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('modal-content').classList.remove('scale-95'), 10);
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-content').classList.add('scale-95');
    setTimeout(() => msgModal.classList.add('hidden'), 200);
});

// 2. Input Modal (REPLACES prompt())
const inputModal = document.getElementById('input-modal');
let pendingAction = null;

function showInputModal(title, message, callback) {
    document.getElementById('input-modal-title').innerText = title;
    document.getElementById('input-modal-message').innerText = message;
    document.getElementById('input-modal-value').value = ''; 
    pendingAction = callback;

    inputModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('input-modal-content').classList.remove('scale-95'), 10);
    document.getElementById('input-modal-value').focus();
}

function closeInputModal() {
    document.getElementById('input-modal-content').classList.add('scale-95');
    setTimeout(() => inputModal.classList.add('hidden'), 200);
    pendingAction = null;
}

document.getElementById('btn-cancel-input').addEventListener('click', closeInputModal);
document.getElementById('btn-confirm-input').addEventListener('click', () => {
    const val = document.getElementById('input-modal-value').value;
    if (val && !isNaN(val) && pendingAction) {
        pendingAction(parseFloat(val));
    }
    closeInputModal();
});

// ==========================================
// DOM ELEMENTS & AUTH
// ==========================================
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(err => showModal("Login Failed", "Check your email and password."));
});

document.getElementById('btn-signup').addEventListener('click', () => {
    if(!emailInput.value || !passwordInput.value) return showModal("Hold On", "Email & Password required.");
    createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
        .catch(err => showModal("Registration Failed", err.message));
});

document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        initApp();
    } else {
        currentUserUid = null;
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
        emailInput.value = ''; passwordInput.value = '';
    }
});

// ==========================================
// TAB SWITCHING
// ==========================================
const tabSpends = document.getElementById('tab-spends');
const tabDreams = document.getElementById('tab-dreams');

tabSpends.addEventListener('click', () => switchTab('spends'));
tabDreams.addEventListener('click', () => switchTab('dreams'));

function switchTab(tab) {
    currentTab = tab;
    if(tab === 'spends') {
        tabSpends.classList.replace('tab-inactive', 'tab-active');
        tabDreams.classList.replace('tab-active', 'tab-inactive');
        document.getElementById('view-spends').classList.remove('hidden');
        document.getElementById('view-dreams').classList.add('hidden');
        document.getElementById('balance-label').innerText = "Total Spends";
        calculateTotalSpends();
    } else {
        tabDreams.classList.replace('tab-inactive', 'tab-active');
        tabSpends.classList.replace('tab-active', 'tab-inactive');
        document.getElementById('view-dreams').classList.remove('hidden');
        document.getElementById('view-spends').classList.add('hidden');
        document.getElementById('balance-label').innerText = "Total Savings";
        calculateTotalSavings();
    }
}

// ==========================================
// CORE APP LOGIC
// ==========================================
let allSpends = [];
let allDreams = [];

function initApp() {
    onValue(ref(db, `users/${currentUserUid}/expenses`), (snap) => {
        allSpends = snap.val() ? Object.entries(snap.val()).map(([id, data]) => ({id, ...data})) : [];
        if(currentTab === 'spends') renderSpends();
    });

    onValue(ref(db, `users/${currentUserUid}/dreams`), (snap) => {
        allDreams = snap.val() ? Object.entries(snap.val()).map(([id, data]) => ({id, ...data})) : [];
        if(currentTab === 'dreams') { renderDreams(); calculateTotalSavings(); }
        generateAITip();
    });
}

// --- SPENDS LOGIC ---
const expCat = document.getElementById('exp-category');
const expCustomCat = document.getElementById('exp-custom-cat');
const expForm = document.getElementById('expense-form');

expCat.addEventListener('change', (e) => {
    if(e.target.value === 'Custom') expCustomCat.classList.remove('hidden');
    else expCustomCat.classList.add('hidden');
});

expForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let category = expCat.value === 'Custom' ? expCustomCat.value || "Other" : expCat.value;
    
    push(ref(db, `users/${currentUserUid}/expenses`), {
        amount: parseFloat(document.getElementById('exp-amount').value),
        desc: document.getElementById('exp-desc').value,
        category: category,
        timestamp: Date.now()
    }).then(() => {
        expForm.reset();
        expCustomCat.classList.add('hidden');
        showModal("Success", "Expense logged successfully.");
    });
});

window.deleteItem = function(type, id) {
    remove(ref(db, `users/${currentUserUid}/${type}/${id}`));
};

function renderSpends() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    let total = 0; let catTotals = {};

    allSpends.sort((a,b) => b.timestamp - a.timestamp).forEach(exp => {
        total += exp.amount;
        catTotals[exp.category] = (catTotals[exp.category] || 0) + exp.amount;

        list.innerHTML += `
            <div class="flex items-center justify-between p-3.5 glass-card rounded-2xl">
                <div>
                    <p class="font-semibold text-sm">${exp.desc}</p>
                    <p class="text-xs text-slate-400">${exp.category}</p>
                </div>
                <div class="flex flex-col items-end">
                    <span class="font-bold text-sm text-red-400">-₹${exp.amount.toLocaleString('en-IN')}</span>
                    <button onclick="deleteItem('expenses', '${exp.id}')" class="text-[10px] text-slate-500 mt-1">Delete</button>
                </div>
            </div>`;
    });
    
    document.getElementById('total-balance').innerText = `₹${total.toLocaleString('en-IN')}`;
    updateChart(catTotals);
}

function calculateTotalSpends() {
    const total = allSpends.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('total-balance').innerText = `₹${total.toLocaleString('en-IN')}`;
}

// --- DREAMS & AI LOGIC ---
const dreamForm = document.getElementById('dream-form');

dreamForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const target = parseFloat(document.getElementById('dream-target').value);
    const saved = parseFloat(document.getElementById('dream-saved').value);

    if(saved > target) return showModal("Wait!", "Saved amount cannot be greater than target.");

    push(ref(db, `users/${currentUserUid}/dreams`), {
        name: document.getElementById('dream-name').value,
        target: target,
        saved: saved,
        category: document.getElementById('dream-category').value,
        timestamp: Date.now()
    }).then(() => {
        dreamForm.reset();
        showModal("Dream Added", "Stay focused. You can achieve this!");
    });
});

// REPLACED prompt() WITH CUSTOM UI
window.addFunds = function(id, currentSaved, target) {
    showInputModal("Add Funds", `How much are you adding towards this goal?`, (amountToAdd) => {
        if(amountToAdd <= 0) return;
        
        const newTotal = currentSaved + amountToAdd;
        if(newTotal > target) {
            showModal("Hold on", "This exceeds your target amount!");
            return;
        }
        
        update(ref(db, `users/${currentUserUid}/dreams/${id}`), { saved: newTotal });
    });
};

function renderDreams() {
    const list = document.getElementById('dreams-list');
    list.innerHTML = '';
    
    if(allDreams.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">No dreams yet. Start dreaming!</p>`;
        return;
    }

    allDreams.sort((a,b) => b.timestamp - a.timestamp).forEach(dream => {
        const percent = Math.min((dream.saved / dream.target) * 100, 100).toFixed(0);
        const isComplete = percent >= 100;
        
        list.innerHTML += `
            <div class="p-4 glass-card rounded-2xl relative overflow-hidden">
                ${isComplete ? '<div class="absolute inset-0 bg-emerald-500/10 z-0"></div>' : ''}
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-slate-100">${dream.name}</h4>
                            <p class="text-[10px] text-slate-400 uppercase tracking-wider">${dream.category}</p>
                        </div>
                        <button onclick="deleteItem('dreams', '${dream.id}')" class="text-slate-500 hover:text-red-400 text-xs">X</button>
                    </div>
                    
                    <div class="flex justify-between text-xs font-medium mb-1">
                        <span class="text-indigo-400">₹${dream.saved.toLocaleString('en-IN')}</span>
                        <span class="text-slate-400">of ₹${dream.target.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div class="w-full bg-slate-800 rounded-full h-2 mb-3">
                        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full progress-bar-fill" style="width: ${percent}%"></div>
                    </div>
                    
                    <div class="flex justify-between items-center mt-2">
                        <span class="text-xs font-bold ${isComplete ? 'text-emerald-400' : 'text-slate-300'}">${isComplete ? 'GOAL ACHIEVED! 🎉' : percent + '% Complete'}</span>
                        ${!isComplete ? `<button onclick="addFunds('${dream.id}', ${dream.saved}, ${dream.target})" class="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg active:bg-white/20">+ Add Funds</button>` : ''}
                    </div>
                </div>
            </div>`;
    });
}

function calculateTotalSavings() {
    const total = allDreams.reduce((sum, dream) => sum + dream.saved, 0);
    document.getElementById('total-balance').innerText = `₹${total.toLocaleString('en-IN')}`;
}

function generateAITip() {
    const totalSaved = allDreams.reduce((sum, d) => sum + d.saved, 0);
    const categories = allDreams.map(d => d.category);
    const textEl = document.getElementById('ai-tip-text');
    
    let tip = "Diversify your savings. Consider keeping an emergency fund in a high-yield savings account before investing in risky assets.";

    if (totalSaved > 500000) tip = "Great corpus! Protect it against inflation. Consider allocating a portion to Index Mutual Funds (like Nifty 50).";
    else if (categories.includes("Real Estate")) tip = "Saving for a home? Look into safe, fixed-income instruments like Government Bonds or Debt Mutual funds for capital protection.";
    else if (categories.includes("Emergency") && totalSaved < 50000) tip = "Prioritize your Emergency Fund. Try to save at least 3-6 months of living expenses in an FD.";
    else if (categories.includes("Vehicle")) tip = "Vehicles depreciate. Try to save at least 20% for the down payment to reduce your EMI, and invest the rest in an RD.";

    textEl.innerText = tip;
}

// ==========================================
// CHART.JS (SPENDS ONLY)
// ==========================================
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

function updateChart(dataTotals) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const labels = Object.keys(dataTotals);
    const data = Object.values(dataTotals);
    const isEmpty = data.reduce((a,b) => a+b, 0) === 0;

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: isEmpty ? [1] : data,
                backgroundColor: isEmpty ? ['#1e293b'] : ['#6366f1','#10b981','#f43f5e','#f59e0b','#a855f7','#64748b'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: !isEmpty, backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    callbacks: { label: (ctx) => ' ₹' + parseFloat(ctx.raw).toLocaleString('en-IN') }
                }
            }
        }
    });
}