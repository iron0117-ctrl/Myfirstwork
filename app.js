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

    // 如果切換到備份標籤，載入備份資訊
    if (tabName === 'backup') {
        loadBackupInfo();
    }
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

    // 顯示鼓勵訊息
    showMotivationalMessage('weight');

    // 檢查成就
    checkAchievements();
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
    const goal = parseInt(localStorage.getItem('waterGoal')) || 2000;

    if (!waterData[today]) {
        waterData[today] = { amount: 0, records: [] };
    }

    const oldAmount = waterData[today].amount;
    waterData[today].amount += amount;
    waterData[today].records.push({
        time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        amount: amount
    });

    localStorage.setItem('waterData', JSON.stringify(waterData));
    loadWaterData();

    // 數字跳動動畫
    animateNumber('water-today');

    // 檢查是否達成目標
    if (oldAmount < goal && waterData[today].amount >= goal) {
        showMotivationalMessage('waterGoal');
        createCelebration();
    } else {
        showMotivationalMessage('water');
    }

    // 檢查成就
    checkAchievements();
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

    // 顯示鼓勵訊息
    showMotivationalMessage('meal');

    // 檢查成就
    checkAchievements();
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

// ==================== 鼓勵訊息系統 ====================
const motivationalMessages = {
    weight: [
        '太棒了！堅持記錄是成功的第一步！💪',
        '每一次記錄都是進步的證明！⭐',
        '你做得很好！持續追蹤會看到成果！🎯',
        '加油！健康的身體從現在開始！🌟'
    ],
    water: [
        '好棒！記得多喝水保持健康！💧',
        '太好了！你正在養成好習慣！✨',
        '繼續保持！水分補充很重要！🌊',
        '做得好！你的身體會感謝你！💙'
    ],
    waterGoal: [
        '🎉 太棒了！你達成今日喝水目標了！',
        '🌟 恭喜！繼續保持這個好習慣！',
        '⭐ 太厲害了！你做到了！',
        '💪 成功達標！為自己驕傲吧！'
    ],
    meal: [
        '很好！記錄飲食幫助你更了解自己！🍽️',
        '太棒了！健康飲食從記錄開始！🥗',
        '做得好！你正在變得更健康！🌱',
        '加油！每一餐都很重要！✨'
    ]
};

function showMotivationalMessage(type) {
    const messages = motivationalMessages[type];
    const message = messages[Math.floor(Math.random() * messages.length)];

    // 創建訊息元素
    const messageEl = document.createElement('div');
    messageEl.className = 'motivational-message';
    messageEl.textContent = message;

    // 找到當前標籤頁的第一個卡片並插入訊息
    const activeTab = document.querySelector('.tab-content.active');
    const firstCard = activeTab.querySelector('.card');
    firstCard.parentNode.insertBefore(messageEl, firstCard);

    // 3秒後移除訊息
    setTimeout(() => {
        messageEl.style.transition = 'all 0.5s ease-out';
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(-20px)';
        setTimeout(() => messageEl.remove(), 500);
    }, 3000);
}

// ==================== 慶祝特效 ====================
function createCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    document.body.appendChild(celebration);

    // 創建彩紙
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        celebration.appendChild(confetti);
    }

    // 3秒後移除慶祝效果
    setTimeout(() => celebration.remove(), 3000);
}

// ==================== 成就系統 ====================
function checkAchievements() {
    const weights = JSON.parse(localStorage.getItem('weights')) || [];
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];

    const newAchievements = [];

    // 體重記錄成就
    if (weights.length >= 1 && !achievements.includes('first_weight')) {
        newAchievements.push({ id: 'first_weight', text: '🎯 首次記錄體重' });
    }
    if (weights.length >= 7 && !achievements.includes('week_weight')) {
        newAchievements.push({ id: 'week_weight', text: '📊 連續記錄7天體重' });
    }
    if (weights.length >= 30 && !achievements.includes('month_weight')) {
        newAchievements.push({ id: 'month_weight', text: '🏆 記錄30天體重' });
    }

    // 喝水記錄成就
    const waterDays = Object.keys(waterData).length;
    if (waterDays >= 1 && !achievements.includes('first_water')) {
        newAchievements.push({ id: 'first_water', text: '💧 首次記錄喝水' });
    }
    if (waterDays >= 7 && !achievements.includes('week_water')) {
        newAchievements.push({ id: 'week_water', text: '🌊 連續記錄7天喝水' });
    }

    // 飲食記錄成就
    if (meals.length >= 1 && !achievements.includes('first_meal')) {
        newAchievements.push({ id: 'first_meal', text: '🍽️ 首次記錄飲食' });
    }
    if (meals.length >= 21 && !achievements.includes('week_meals')) {
        newAchievements.push({ id: 'week_meals', text: '🥗 記錄一週三餐' });
    }

    // 顯示新成就
    if (newAchievements.length > 0) {
        showAchievements(newAchievements);
        // 儲存成就
        newAchievements.forEach(a => achievements.push(a.id));
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }
}

function showAchievements(achievements) {
    const activeTab = document.querySelector('.tab-content.active');
    const firstCard = activeTab.querySelector('.card');

    const container = document.createElement('div');
    container.className = 'achievement-container';
    container.innerHTML = `
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #FF6B00;">
            🎉 恭喜獲得新成就！
        </div>
        ${achievements.map(a => `<span class="achievement-badge">${a.text}</span>`).join('')}
    `;

    firstCard.parentNode.insertBefore(container, firstCard);

    // 播放慶祝動畫
    createCelebration();

    // 5秒後移除
    setTimeout(() => {
        container.style.transition = 'all 0.5s ease-out';
        container.style.opacity = '0';
        container.style.transform = 'translateY(-20px)';
        setTimeout(() => container.remove(), 500);
    }, 5000);
}

// ==================== 數字跳動效果 ====================
function animateNumber(elementId) {
    const element = document.getElementById(elementId);
    element.classList.add('number-pop');
    setTimeout(() => element.classList.remove('number-pop'), 300);
}

// ==================== 備份與恢復 ====================
function loadBackupInfo() {
    const weights = JSON.parse(localStorage.getItem('weights')) || [];
    const waterData = JSON.parse(localStorage.getItem('waterData')) || {};
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    const achievements = JSON.parse(localStorage.getItem('achievements')) || [];

    document.getElementById('backup-weight-count').textContent = `${weights.length} 筆`;
    document.getElementById('backup-water-count').textContent = `${Object.keys(waterData).length} 天`;
    document.getElementById('backup-meal-count').textContent = `${meals.length} 筆`;
    document.getElementById('backup-achievement-count').textContent = `${achievements.length} 個`;
}

function exportData() {
    try {
        // 收集所有資料
        const allData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                weights: JSON.parse(localStorage.getItem('weights')) || [],
                waterData: JSON.parse(localStorage.getItem('waterData')) || {},
                waterGoal: localStorage.getItem('waterGoal') || '2000',
                meals: JSON.parse(localStorage.getItem('meals')) || [],
                achievements: JSON.parse(localStorage.getItem('achievements')) || []
            }
        };

        // 轉換為 JSON 字串
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // 建立下載連結
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;

        // 檔案名稱包含日期
        const date = new Date().toISOString().split('T')[0];
        link.download = `健康追蹤備份_${date}.json`;

        // 觸發下載
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // 顯示成功訊息
        alert('✅ 資料已成功匯出！\n檔案已儲存到你的手機下載資料夾。');

    } catch (error) {
        console.error('匯出失敗：', error);
        alert('❌ 匯出失敗，請稍後再試。');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 確認操作
    if (!confirm('⚠️ 匯入資料會覆蓋目前所有記錄！\n\n確定要繼續嗎？')) {
        event.target.value = ''; // 清空檔案選擇
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // 驗證資料格式
            if (!importedData.version || !importedData.data) {
                throw new Error('無效的備份檔案格式');
            }

            // 恢復所有資料
            localStorage.setItem('weights', JSON.stringify(importedData.data.weights || []));
            localStorage.setItem('waterData', JSON.stringify(importedData.data.waterData || {}));
            localStorage.setItem('waterGoal', importedData.data.waterGoal || '2000');
            localStorage.setItem('meals', JSON.stringify(importedData.data.meals || []));
            localStorage.setItem('achievements', JSON.stringify(importedData.data.achievements || []));

            // 重新載入所有資料
            loadWeightRecords();
            loadWaterData();
            loadMeals();
            loadBackupInfo();

            alert('✅ 資料已成功匯入！\n\n所有記錄已恢復。');

        } catch (error) {
            console.error('匯入失敗：', error);
            alert('❌ 匯入失敗！\n請確認檔案格式正確。');
        }

        // 清空檔案選擇
        event.target.value = '';
    };

    reader.onerror = function() {
        alert('❌ 讀取檔案失敗，請稍後再試。');
        event.target.value = '';
    };

    reader.readAsText(file);
}

function clearAllData() {
    // 二次確認
    if (!confirm('⚠️ 警告！此操作將永久刪除所有記錄！\n\n確定要繼續嗎？')) {
        return;
    }

    if (!confirm('⚠️ 最後確認！\n\n真的要刪除所有資料嗎？此操作無法復原！')) {
        return;
    }

    try {
        // 清除所有 localStorage 資料
        localStorage.removeItem('weights');
        localStorage.removeItem('waterData');
        localStorage.removeItem('waterGoal');
        localStorage.removeItem('meals');
        localStorage.removeItem('achievements');

        // 重新載入所有頁面
        loadWeightRecords();
        loadWaterData();
        loadMeals();
        loadBackupInfo();

        alert('✅ 所有資料已清除！');

    } catch (error) {
        console.error('清除失敗：', error);
        alert('❌ 清除失敗，請稍後再試。');
    }
}
