// Инициализация данных
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentTheme = localStorage.getItem('theme') || 'light'; // "light", "dark"
let filteredTransactions = transactions;
let incomeChart, expenseChart, monthlyChart;

// Основные функции
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('transaction-form').addEventListener('submit', addTransaction);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('filter-btn').addEventListener('click', filterTransactions);
    document.getElementById('save-to-file-btn').addEventListener('click', saveToFile);

    fillFilterOptions();
    renderTransactions(filteredTransactions);
    renderCharts();
    updateTheme();
    updateTotalBalances();
});

function addTransaction(event) {
    event.preventDefault();
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const category = document.getElementById('transaction-category').value.trim();
    const date = new Date().toISOString();

    if (amount > 0 && category) {
        const transaction = { id: Date.now(), type, amount, category, date };
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        document.getElementById('transaction-form').reset();
        filteredTransactions = transactions;

        renderTransactions(filteredTransactions);

        // Добавляем анимацию появления
        const newTransaction = document.getElementById(`transaction-${transaction.id}`);
        if (newTransaction) {
            newTransaction.classList.add('transaction-added');
        }

        renderCharts();
        updateTotalBalances();
        showNotification('Транзакция добавлена', 'success');
    } else {
        showNotification('Введите корректные данные', 'error');
    }
}


function deleteTransaction(id) {
    const transactionToDelete = document.getElementById(`transaction-${id}`);
    if (transactionToDelete) {
        transactionToDelete.classList.add('transaction-deleting'); // Добавляем класс для анимации

        // Ждём завершения анимации перед удалением
        setTimeout(() => {
            transactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            filteredTransactions = transactions;
            renderTransactions(filteredTransactions);
            renderCharts();
            updateTotalBalances();
            showNotification('Транзакция удалена', 'success');
        }, 400); // Время соответствует длительности анимации fadeOut
    }
}


function renderTransactions(transactionsToRender) {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    transactionsToRender.forEach(transaction => {
        const li = document.createElement('li');
        li.id = `transaction-${transaction.id}`; // Уникальный идентификатор
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-category">${transaction.type === 'income' ? 'Доход' : 'Расход'}</div>
                <div class="transaction-details">
                    <span>${transaction.category}</span>
                    <span>${new Date(transaction.date).toLocaleString()}</span>
                    <span>${transaction.amount} руб.</span>
                </div>
            </div>
        `;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));
        li.appendChild(deleteButton);
        transactionList.appendChild(li);
    });
}


function renderCharts() {
    renderPieChart('income', 'income-chart', ['#16a085', '#f39c12', '#2980b9']);
    renderPieChart('expense', 'expense-chart', ['#e74c3c', '#f39c12', '#9b59b6']);
    renderMonthlyChart();
}

function renderPieChart(type, chartId, colors) {
    const transactionsOfType = filteredTransactions.filter(t => t.type === type);
    const categories = [...new Set(transactionsOfType.map(t => t.category))];
    const amounts = categories.map(category =>
        transactionsOfType.filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0)
    );
    const ctx = document.getElementById(chartId).getContext('2d');
    if (type === 'income' && incomeChart) incomeChart.destroy();
    if (type === 'expense' && expenseChart) expenseChart.destroy();
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            plugins: { legend: { position: 'right' } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
    if (type === 'income') incomeChart = chart;
    if (type === 'expense') expenseChart = chart;
}

function renderMonthlyChart() {
    const monthlyData = Array(12).fill(0).map((_, i) => {
        const monthTransactions = filteredTransactions.filter(t => new Date(t.date).getMonth() === i);
        const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return income - expense;
    });
    const ctx = document.getElementById('monthly-finances-chart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            datasets: [{ label: 'Доходы и расходы по месяцам', data: monthlyData, borderColor: '#3498db', fill: false, tension: 0.1 }]
        },
        options: {
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    updateTheme();
}

function updateTheme() {
    document.body.setAttribute('data-theme', currentTheme);
}

function fillFilterOptions() {
    const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort();
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const yearSelect = document.getElementById('filter-year');
    const monthSelect = document.getElementById('filter-month');
    yearSelect.innerHTML = '<option value="">Выберите год</option>';
    monthSelect.innerHTML = '<option value="">Выберите месяц</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
    months.forEach((month, index) => {
        monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
    });
}

function filterTransactions() {
    const selectedYear = parseInt(document.getElementById('filter-year').value);
    const selectedMonth = parseInt(document.getElementById('filter-month').value);
    const selectedType = document.getElementById('filter-type').value;

    filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return (!selectedYear || transactionDate.getFullYear() === selectedYear) &&
               (!selectedMonth || transactionDate.getMonth() + 1 === selectedMonth) &&
               (selectedType === 'all' || t.type === selectedType);
    });

    if (filteredTransactions.length === 0) showNotification('Транзакции в этот период времени отсутствуют', 'error');
    renderTransactions(filteredTransactions);
    renderCharts();
    updateTotalBalances();
}

function showNotification(message, type) {
    const notification = document.getElementById('notifications');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 2000);
}

function updateTotalBalances() {
    const totalBalance = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
    const currentMonth = new Date().getMonth();
    const monthlyBalance = transactions.filter(t => new Date(t.date).getMonth() === currentMonth)
        .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
    document.getElementById('total-balance').textContent = `Общий баланс за всё время: ${totalBalance} руб.`;
    document.getElementById('monthly-balance').textContent = `Общий баланс за текущий месяц: ${monthlyBalance} руб.`;
}

function saveToFile() {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.json';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Файл сохранён', 'success');
}
