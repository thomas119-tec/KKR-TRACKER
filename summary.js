const summaryChartEl = document.getElementById('summary-chart');
const detailTitleEl = document.getElementById('detail-title');
const detailListEl = document.getElementById('detail-list');
const yearSelect = document.getElementById('year-select');
const monthSelect = document.getElementById('month-select');
const daySelect = document.getElementById('day-select');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let borrows = JSON.parse(localStorage.getItem('borrows')) || [];
let filteredTransactions = [...transactions];
let filteredBorrows = [...borrows];

// Populate year, month, day selects
function populateFilters() {
    const years = new Set();
    const months = new Set();
    const days = new Set();

    transactions.forEach(tx => {
        const date = new Date(tx.date);
        years.add(date.getFullYear());
        months.add(date.getMonth() + 1); // 1-12
        days.add(date.getDate());
    });

    borrows.forEach(b => {
        const date = new Date(b.date);
        years.add(date.getFullYear());
        months.add(date.getMonth() + 1);
        days.add(date.getDate());
    });

    // Populate year select
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Populate month select
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = new Date(0, i - 1).toLocaleString('default', { month: 'long' });
        monthSelect.appendChild(option);
    }

    // Populate day select
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
}

// Filter data based on selects
function filterData() {
    const selectedYear = yearSelect.value;
    const selectedMonth = monthSelect.value;
    const selectedDay = daySelect.value;

    filteredTransactions = transactions.filter(tx => {
        const date = new Date(tx.date);
        const yearMatch = selectedYear === 'all' || date.getFullYear() == selectedYear;
        const monthMatch = selectedMonth === 'all' || date.getMonth() + 1 == selectedMonth;
        const dayMatch = selectedDay === 'all' || date.getDate() == selectedDay;
        return yearMatch && monthMatch && dayMatch;
    });

    filteredBorrows = borrows.filter(b => {
        const date = new Date(b.date);
        const yearMatch = selectedYear === 'all' || date.getFullYear() == selectedYear;
        const monthMatch = selectedMonth === 'all' || date.getMonth() + 1 == selectedMonth;
        const dayMatch = selectedDay === 'all' || date.getDate() == selectedDay;
        return yearMatch && monthMatch && dayMatch;
    });

    updateChartAndDetails();
}

// Update chart and details with filtered data
function updateChartAndDetails() {
    const spendTransactions = filteredTransactions.filter(t => t.type === 'spend');
    const spendByCategory = spendTransactions.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + parseFloat(tx.amount);
        return acc;
    }, {});

    const categories = Object.keys(spendByCategory);
    const values = categories.map(cat => spendByCategory[cat]);

    // Update chart
    chart.data.labels = categories;
    chart.data.datasets[0].data = values;
    chart.update();

    // Update details title
    if (categories.length === 0) {
        detailTitleEl.textContent = 'No spending data for selected period.';
        detailListEl.innerHTML = '';
    } else {
        detailTitleEl.textContent = 'Click a slice to view detailed transactions.';
        detailListEl.innerHTML = '';
    }
}

// Event listeners for filters
yearSelect.addEventListener('change', filterData);
monthSelect.addEventListener('change', filterData);
daySelect.addEventListener('change', filterData);

// Initial setup
const chart = new Chart(summaryChartEl, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#6f42c1', '#20c997'],
            borderWidth: 2,
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const amount = context.parsed.toFixed(2);
                        return `${context.label}: ₹${amount}`;
                    }
                }
            }
        },
        onClick: (event) => {
            const points = chart.getElementsAtEventForMode(event, 'nearest', {intersect: true}, true);
            if (!points.length) return;
            const index = points[0].index;
            const category = chart.data.labels[index];
            showDetails(category);
        }
    }
});

populateFilters();
filterData(); // Initial load with all data

// Chart and showDetails remain similar, but use filteredTransactions
function showDetails(category) {
    const selected = filteredTransactions.filter(tx => tx.category === category && tx.type === 'spend');
    detailTitleEl.textContent = `${category.toUpperCase()} transactions (${selected.length})`;
    detailListEl.innerHTML = '';
    if (!selected.length) {
        const li = document.createElement('li');
        li.textContent = 'No transactions found.';
        detailListEl.appendChild(li);
        return;
    }
    selected.forEach(tx => {
        const li = document.createElement('li');
        li.textContent = `${tx.date} - ₹${parseFloat(tx.amount).toFixed(2)} (${tx.type})`;
        detailListEl.appendChild(li);
    });
}

// PDF now uses filtered data
document.getElementById('download-pdf').addEventListener('click', generatePDF);

function generatePDF() {
    const jsPDF = window.jsPDF;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('K.K.RAYAN FINANCE TRACKER - Detailed Report', 20, 30);

    // Summary for filtered data
    const totalBalance = filteredTransactions.reduce((sum, t) => {
        return t.type === 'receive' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount);
    }, 0);
    const totalLent = filteredBorrows.filter(b => b.type === 'lent').reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalBorrowed = filteredBorrows.filter(b => b.type === 'borrowed').reduce((sum, b) => sum + parseFloat(b.amount), 0);

    doc.setFontSize(14);
    doc.text(`Total Balance: Rs. ${totalBalance.toFixed(2)}`, 20, 50);
    doc.text(`Total Lent: Rs. ${totalLent.toFixed(2)}`, 20, 60);
    doc.text(`Total Borrowed: Rs. ${totalBorrowed.toFixed(2)}`, 20, 70);

    // Transactions
    doc.setFontSize(16);
    doc.text('Transactions:', 20, 90);
    let y = 100;
    filteredTransactions.forEach(tx => {
        doc.setFontSize(12);
        doc.text(`${tx.date} - ${tx.type}: Rs. ${tx.amount} (${tx.category})`, 20, y);
        y += 10;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Borrows
    doc.setFontSize(16);
    doc.text('Borrows:', 20, y + 10);
    y += 20;
    filteredBorrows.forEach(borrow => {
        doc.setFontSize(12);
        doc.text(`${borrow.date} - ${borrow.type}: Rs. ${borrow.amount} to/from ${borrow.person}`, 20, y);
        y += 10;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Save the PDF
    doc.save('finance-report.pdf');
}