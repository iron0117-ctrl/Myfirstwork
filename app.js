// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // 設定今天的日期為預設值
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('weight-date').value = today;
    document.getElementById('meal-date').value = today;

    // 載入所有資料
    loadWeightRecords();
    loadWaterData();
    loadMeals();
}

// ==================== 標籤切換 ====================
function showTab(tabName) {
    // 隱藏所有標籤內容
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 移除所有按鈕的 active 類別
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(btn => btn.classList.remove('active'));

    // 顯示選中的標籤
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// ==================== 體重追蹤 ====================
function addWeight() {
    const date = document.getElementById('weight-date').value;
    const weight = document.getElementById('weight-value').value;

    if (!date || !weight) {
        alert('請填寫日期和體重！');
        return;
    }

    // 獲取現有記錄
    let weights = JSON.parse(localStorage.getItem('weights')) || [];

    // 新增記錄
    weights.push({
        id: Date.now(),
        date: date,
        weight: parseFloat(weight)
    });

    // 按日期排序（最新的在前）
    weights.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 儲存到 localStorage
    localStorage.setItem('weights', JSON.stringify(weights));

    // 清空輸入
    document.getElementById('weight-value').value = '';

    // 重新載入列表
    loadWeightRecords();

    alert('體重記錄新增成功！');
}

function loadWeightRecords() {
    const weights = JSON.parse(localStorage.getItem('weights')) || [];
    const list = document.getElementById('weight-list');

    if (weights.length === 0) {
        list.innerHTML = '<div class="empty-state">還沒有體重記錄，開始記錄你的第一筆資料吧！</div>';
        return;
    }

    list.innerHTML = weights.map(record => `
        <div class="record-item">
            <div class="record-info">
                <div class="record-date">${formatDate(record.date)}</div>
                <div class="record-value">${record.weight} 公斤</div>
            </div>
            <button class="delete-btn" onclick="deleteWeight(${record.id})">刪除</button>
        </div>
    `).join('');
}

function deleteWeight(id) {
    if (!confirm('確定要刪除這筆記錄嗎？')) {
        return;
    }

    let weights = JSON.parse(localStorage.getItem('weights')) || [];
    weights = weights.filter(w => w.id !== id);
    localStorage.setItem('weights', JSON.stringify(weights));
    loadWeightRecords();
}

// ==================== 喝水追蹤 ====================
function loadWaterData() {
    const today = new Date().toISOString().split('T')[0];
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    const todayData = waterData[today] || { amount: 0, records: [] };
    const goal = parseInt(localStorage.getItem('waterGoal')) || 2000;

    // 更新顯示
    document.getElementById('water-today').textContent = todayData.amount;
    document.getElementById('water-goal').textContent = goal;
    document.getElementById('water-goal-input').value = goal;

    // 更新進度條
    const percentage = Math.min((todayData.amount / goal) * 100, 100);
    document.getElementById('water-progress').style.width = percentage + '%';

    // 載入歷史記錄
    loadWaterHistory();
}

function addWater(amount) {
    const today = new Date().toISOString().split('T')[0];
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};

    if (!waterData[today]) {
        waterData[today] = { amount: 0, records: [] };
    }

    waterData[today].amount += amount;
    waterData[today].records.push({
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        amount: amount
    });

    localStorage.setItem('waterData', JSON.stringify(waterData));
    loadWaterData();
}

function addCustomWater() {
    const amount = parseInt(document.getElementById('water-amount').value);

    if (!amount || amount <= 0) {
        alert('請輸入有效的水量！');
        return;
    }

    addWater(amount);
    document.getElementById('water-amount').value = '';
}

function resetWater() {
    if (!confirm('確定要重置今日喝水記錄嗎？')) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    delete waterData[today];
    localStorage.setItem('waterData', JSON.stringify(waterData));
    loadWaterData();
}

function setWaterGoal() {
    const goal = parseInt(document.getElementById('water-goal-input').value);

    if (!goal || goal <= 0) {
        alert('請輸入有效的目標水量！');
        return;
    }

    localStorage.setItem('waterGoal', goal);
    loadWaterData();
    alert('目標設定成功！');
}

function loadWaterHistory() {
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    const list = document.getElementById('water-history');

    // 按日期排序
    const dates = Object.keys(waterData).sort().reverse();

    if (dates.length === 0) {
        list.innerHTML = '<div class="empty-state">還沒有喝水記錄</div>';
        return;
    }

    list.innerHTML = dates.map(date => {
        const data = waterData[date];
        const recordsHtml = data.records.map(r =>
            `<span style="margin-right: 10px;">${r.time}: ${r.amount}ml</span>`
        ).join('');

        return `
            <div class="record-item" style="flex-direction: column; align-items: flex-start;">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div class="record-info">
                        <div class="record-date">${formatDate(date)}</div>
                        <div class="record-value">總計：${data.amount} ml</div>
                    </div>
                    <button class="delete-btn" onclick="deleteWaterDay('${date}')">刪除</button>
                </div>
                <div class="record-detail">${recordsHtml}</div>
            </div>
        `;
    }).join('');
}

function deleteWaterDay(date) {
    if (!confirm('確定要刪除這一天的記錄嗎？')) {
        return;
    }

    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    delete waterData[date];
    localStorage.setItem('waterData', JSON.stringify(waterData));
    loadWaterData();
}

// ==================== 飲食計劃 ====================
function addMeal() {
    const date = document.getElementById('meal-date').value;
    const type = document.getElementById('meal-type').value;
    const description = document.getElementById('meal-description').value;
    const calories = document.getElementById('meal-calories').value;

    if (!date || !description) {
        alert('請填寫日期和內容！');
        return;
    }

    // 獲取現有記錄
    let meals = JSON.parse(localStorage.getItem('meals')) || [];

    // 新增記錄
    meals.push({
        id: Date.now(),
        date: date,
        type: type,
        description: description,
        calories: calories ? parseInt(calories) : null
    });

    // 按日期和餐別排序
    meals.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;

        const mealOrder = { '早餐': 1, '午餐': 2, '晚餐': 3, '點心': 4 };
        return mealOrder[a.type] - mealOrder[b.type];
    });

    // 儲存到 localStorage
    localStorage.setItem('meals', JSON.stringify(meals));

    // 清空輸入
    document.getElementById('meal-description').value = '';
    document.getElementById('meal-calories').value = '';

    // 重新載入列表
    loadMeals();

    alert('飲食記錄新增成功！');
}

function loadMeals() {
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    const list = document.getElementById('meals-list');

    if (meals.length === 0) {
        list.innerHTML = '<div class="empty-state">還沒有飲食記錄，開始記錄你的飲食計劃吧！</div>';
        return;
    }

    // 按日期分組
    const mealsByDate = {};
    meals.forEach(meal => {
        if (!mealsByDate[meal.date]) {
            mealsByDate[meal.date] = [];
        }
        mealsByDate[meal.date].push(meal);
    });

    // 生成 HTML
    list.innerHTML = Object.keys(mealsByDate).sort().reverse().map(date => {
        const dayMeals = mealsByDate[date];
        const totalCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

        const mealsHtml = dayMeals.map(meal => `
            <div class="record-item">
                <div class="record-info">
                    <div class="record-date">${meal.type}</div>
                    <div class="record-value">${meal.description}</div>
                    ${meal.calories ? `<div class="record-detail">熱量：${meal.calories} 大卡</div>` : ''}
                </div>
                <button class="delete-btn" onclick="deleteMeal(${meal.id})">刪除</button>
            </div>
        `).join('');

        return `
            <div style="margin-bottom: 30px;">
                <h3 style="color: #667eea; margin-bottom: 15px;">
                    ${formatDate(date)}
                    ${totalCalories > 0 ? `<span style="color: #666; font-size: 0.9em; margin-left: 10px;">總熱量：${totalCalories} 大卡</span>` : ''}
                </h3>
                ${mealsHtml}
            </div>
        `;
    }).join('');
}

function deleteMeal(id) {
    if (!confirm('確定要刪除這筆記錄嗎？')) {
        return;
    }

    let meals = JSON.parse(localStorage.getItem('meals')) || [];
    meals = meals.filter(m => m.id !== id);
    localStorage.setItem('meals', JSON.stringify(meals));
    loadMeals();
}

// ==================== 輔助函數 ====================
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];

    return `${year}/${month}/${day} (${weekday})`;
}
