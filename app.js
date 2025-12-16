document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expense-list');
    const totalAmountSpan = document.getElementById('total-amount');
    const exportBtn = document.getElementById('export-btn');
    const timeFilter = document.getElementById('time-filter');
    let currentExpenses = [];
    let filteredExpenses = [];

    // Chart color palette
    const chartColors = {
        primary: ['#6366f1', '#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'],
        gradients: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(56, 189, 248, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)'
        ]
    };

    // Initialize all charts
    let pieChart, doughnutChart, barChart, horizontalBarChart;

    function initializeCharts() {
        // Pie Chart
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: chartColors.primary,
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Doughnut Chart
        const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
        doughnutChart = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: chartColors.primary,
                    borderWidth: 2,
                    borderColor: '#0f172a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Bar Chart - Spending Over Time
        const barCtx = document.getElementById('barChart').getContext('2d');
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Spending',
                    data: [],
                    backgroundColor: chartColors.gradients,
                    borderColor: chartColors.primary,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            callback: function (value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ₹' + context.parsed.y.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });

        // Horizontal Bar Chart - Category Comparison
        const hBarCtx = document.getElementById('horizontalBarChart').getContext('2d');
        horizontalBarChart = new Chart(hBarCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Amount Spent',
                    data: [],
                    backgroundColor: chartColors.gradients,
                    borderColor: chartColors.primary,
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            callback: function (value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Spent: ₹' + context.parsed.x.toLocaleString('en-IN');
                            }
                        }
                    }
                }
            }
        });
    }

    initializeCharts();

    // Local Storage Helpers
    function getLocalExpenses() {
        const stored = localStorage.getItem('orbit_expenses');
        return stored ? JSON.parse(stored) : [];
    }

    function saveLocalExpenses(expenses) {
        localStorage.setItem('orbit_expenses', JSON.stringify(expenses));
    }

    // Time-based filtering
    function filterExpensesByTime(expenses, period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return expenses.filter(e => new Date(e.date) >= weekAgo);

            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return expenses.filter(e => new Date(e.date) >= monthStart);

            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                return expenses.filter(e => new Date(e.date) >= yearStart);

            case 'all':
            default:
                return expenses;
        }
    }

    // Update statistics cards
    function updateStatistics(expenses) {
        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        });

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const average = expenses.length > 0 ? total / expenses.length : 0;
        const highest = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
        const count = expenses.length;

        document.getElementById('stat-total').textContent = formatter.format(total);
        document.getElementById('stat-average').textContent = formatter.format(average);
        document.getElementById('stat-highest').textContent = formatter.format(highest);
        document.getElementById('stat-count').textContent = count;
    }

    // Update category breakdown list
    function updateCategoryBreakdown(expenses) {
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);

        const container = document.getElementById('category-breakdown');
        container.innerHTML = '';

        if (sortedCategories.length === 0) {
            container.innerHTML = '<div class="no-data">No expenses to display</div>';
            return;
        }

        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        });

        sortedCategories.forEach(([category, amount], index) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            const colorIndex = index % chartColors.primary.length;

            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background: ${chartColors.primary[colorIndex]}"></div>
                    <div class="category-name">${category}</div>
                </div>
                <div class="category-stats">
                    <div class="category-amount">${formatter.format(amount)}</div>
                    <div class="category-percentage">${percentage}%</div>
                </div>
                <div class="category-bar">
                    <div class="category-bar-fill" style="width: ${percentage}%; background: ${chartColors.primary[colorIndex]}"></div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // Update all charts
    function updateAllCharts(expenses) {
        // Category-based data
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });

        const categoryLabels = Object.keys(categories);
        const categoryData = Object.values(categories);

        // Update Pie Chart
        pieChart.data.labels = categoryLabels;
        pieChart.data.datasets[0].data = categoryData;
        pieChart.update();

        // Update Doughnut Chart
        doughnutChart.data.labels = categoryLabels;
        doughnutChart.data.datasets[0].data = categoryData;
        doughnutChart.update();

        // Update Horizontal Bar Chart
        horizontalBarChart.data.labels = categoryLabels;
        horizontalBarChart.data.datasets[0].data = categoryData;
        horizontalBarChart.update();

        // Update Bar Chart - Daily spending
        const dailyData = {};
        expenses.forEach(e => {
            const date = e.date;
            dailyData[date] = (dailyData[date] || 0) + e.amount;
        });

        const sortedDates = Object.keys(dailyData).sort();
        const dailyAmounts = sortedDates.map(date => dailyData[date]);

        barChart.data.labels = sortedDates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        });
        barChart.data.datasets[0].data = dailyAmounts;
        barChart.update();
    }

    // Load and display expenses from LocalStorage
    function loadExpenses() {
        const data = getLocalExpenses();
        currentExpenses = data;
        applyFilters();
    }

    // Apply current filters
    function applyFilters() {
        const timePeriod = timeFilter.value;
        filteredExpenses = filterExpensesByTime(currentExpenses, timePeriod);

        renderList(filteredExpenses);
        updateAllCharts(filteredExpenses);
        updateStatistics(filteredExpenses);
        updateCategoryBreakdown(filteredExpenses);
    }

    // Time filter change handler
    timeFilter.addEventListener('change', () => {
        applyFilters();
        showNotification(`Filter applied: ${timeFilter.options[timeFilter.selectedIndex].text}`, 'info');
    });

    // Notification System
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('hiding');
            notification.addEventListener('animationend', () => {
                if (notification.parentElement) {
                    notification.remove();
                }
            });
        }, 3000);
    }

    // Custom Comparison Modal
    function showConfirm() {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmation-modal');
            const confirmBtn = document.getElementById('confirm-delete');
            const cancelBtn = document.getElementById('cancel-delete');

            function close() {
                modal.classList.remove('visible');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
            }

            function onConfirm() {
                close();
                resolve(true);
            }

            function onCancel() {
                close();
                resolve(false);
            }

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);

            modal.classList.add('visible');
        });
    }

    // Export PDF Logic
    exportBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241); // Primary color
        doc.text("Orbit Analytics Report", 105, 20, null, null, "center");

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, null, null, "center");

        // Chart Snapshot
        const chartCanvas = document.getElementById('pieChart');
        const chartImg = chartCanvas.toDataURL("image/png", 1.0);

        // Add chart to PDF (centered)
        // A4 width is ~210mm. Img width 100mm, x = (210-100)/2 = 55
        doc.text("Spending Breakdown", 14, 45);
        doc.addImage(chartImg, 'PNG', 55, 50, 100, 100);

        // Transactions Table
        doc.text("Recent Transactions", 14, 160);

        const tableBody = currentExpenses.map(e => [
            e.date,
            e.description,
            e.category,
            `Rs. ${e.amount.toLocaleString('en-IN')}`
        ]);

        doc.autoTable({
            startY: 165,
            head: [['Date', 'Description', 'Category', 'Amount']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
            styles: { fontSize: 10 }
        });

        // Save File Logic
        try {
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: 'orbit-report.pdf',
                    types: [{
                        description: 'PDF Document',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(doc.output('blob'));
                await writable.close();
                showNotification('Report saved successfully', 'success');
            } else {
                // Fallback for browsers that don't support the API
                doc.save("orbit-report.pdf");
                showNotification('Report downloaded', 'success');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to save file:', err);
                showNotification('Failed to save file', 'error');
            }
        }
    });

    // Render list
    function renderList(expenses) {
        expenseList.innerHTML = '';
        let total = 0;

        const formatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        });

        expenses.forEach(expense => {
            total += expense.amount;
            const li = document.createElement('li');
            li.className = 'expense-item';
            li.innerHTML = `
                <div class="expense-info">
                    <strong>${expense.description}</strong>
                    <span>${expense.date} • ${expense.category}</span>
                </div>
                <div class="expense-actions">
                    <span class="expense-amount">${formatter.format(expense.amount)}</span>
                    <button class="delete-btn" onclick="deleteExpense('${expense.id}')">&times;</button>
                </div>
            `;
            expenseList.appendChild(li);
        });

        totalAmountSpan.textContent = formatter.format(total);
    }

    // Update Chart
    function updateChart(expenses) {
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });

        expenseChart.data.labels = Object.keys(categories);
        expenseChart.data.datasets[0].data = Object.values(categories);
        expenseChart.update();
    }

    // Add Expense
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newExpense = {
            id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : 'id-' + Date.now(),
            description: document.getElementById('desc').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };

        const expenses = getLocalExpenses();
        expenses.push(newExpense);
        saveLocalExpenses(expenses);

        expenseForm.reset();
        // Set default date to today again
        document.getElementById('date').valueAsDate = new Date();
        loadExpenses();
        showNotification('Expense added successfully', 'success');
    });

    // Delete Expense
    window.deleteExpense = async function (id) {
        const confirmed = await showConfirm();
        if (confirmed) {
            let expenses = getLocalExpenses();
            expenses = expenses.filter(e => e.id !== id);
            saveLocalExpenses(expenses);
            loadExpenses();
            showNotification('Expense deleted', 'info');
        }
    };

    // Initialize date picker to today
    document.getElementById('date').valueAsDate = new Date();
    loadExpenses();
});
