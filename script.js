// Load data from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let borrows = JSON.parse(localStorage.getItem('borrows')) || [];

// DOM elements
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const borrowForm = document.getElementById('borrow-form');
const borrowList = document.getElementById('borrow-list');
const totalBalanceEl = document.getElementById('total-balance');
const totalLentEl = document.getElementById('total-lent');
const totalBorrowedEl = document.getElementById('total-borrowed');

// Render transactions
function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach((transaction, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${transaction.date} - ${transaction.type}: ₹${transaction.amount} (${transaction.category})</span>
            <button onclick="deleteTransaction(${index})">Delete</button>
        `;
        transactionList.appendChild(li);
    });
    updateSummary();
}

// Render borrows
function renderBorrows() {
    borrowList.innerHTML = '';
    borrows.forEach((borrow, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${borrow.date} - ${borrow.type}: ₹${borrow.amount} to/from ${borrow.person}</span>
            <button onclick="deleteBorrow(${index})">Delete</button>
        `;
        borrowList.appendChild(li);
    });
    updateSummary();
}

// Update summary
function updateSummary() {
    const totalBalance = transactions.reduce((sum, t) => {
        return t.type === 'receive' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount);
    }, 0);
    const totalLent = borrows.filter(b => b.type === 'lent').reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalBorrowed = borrows.filter(b => b.type === 'borrowed').reduce((sum, b) => sum + parseFloat(b.amount), 0);

    if (totalBalanceEl) totalBalanceEl.textContent = totalBalance.toFixed(2);
    if (totalLentEl) totalLentEl.textContent = totalLent.toFixed(2);
    if (totalBorrowedEl) totalBorrowedEl.textContent = totalBorrowed.toFixed(2);
}

// Add transaction
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    transactions.push({ amount, type, category, date });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
    transactionForm.reset();
});

// Add borrow
borrowForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = document.getElementById('borrow-amount').value;
    const type = document.getElementById('borrow-type').value;
    const person = document.getElementById('person').value;
    const date = document.getElementById('borrow-date').value;

    borrows.push({ amount, type, person, date });
    localStorage.setItem('borrows', JSON.stringify(borrows));
    renderBorrows();
    borrowForm.reset();
});

// Delete transaction
function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderTransactions();
}

// Delete borrow
function deleteBorrow(index) {
    borrows.splice(index, 1);
    localStorage.setItem('borrows', JSON.stringify(borrows));
    renderBorrows();
}

// Initial render
renderTransactions();
renderBorrows();