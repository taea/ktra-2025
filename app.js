// タスク管理のメインクラス
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditingTaskId = null;
        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 新規タスクフォーム
        document.getElementById('new-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // 編集フォーム
        document.getElementById('edit-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });

        // 週間サマリーボタン
        document.getElementById('week-summary-btn').addEventListener('click', () => {
            this.toggleWeekSummary();
        });
    }

    // タスクの追加
    addTask() {
        const titleInput = document.getElementById('task-title');
        const pointsInput = document.querySelector('input[name="points"]:checked');
        
        const task = {
            id: Date.now().toString(),
            title: titleInput.value.trim(),
            points: parseInt(pointsInput.value),
            status: 'unstarted', // unstarted, doing, done
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task); // 新しいタスクを先頭に追加
        this.saveTasks();
        this.render();

        // フォームをリセット
        titleInput.value = '';
        document.querySelector('input[name="points"][value="0"]').checked = true;
    }

    // タスクのステータス変更
    cycleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // ステータスのサイクル: unstarted -> doing -> done -> unstarted
        const statusCycle = {
            'unstarted': 'doing',
            'doing': 'done',
            'done': 'unstarted'
        };

        task.status = statusCycle[task.status];
        
        // 完了時刻の記録
        if (task.status === 'done') {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }

        this.saveTasks();
        this.render();
    }

    // タスクの編集モーダルを開く
    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditingTaskId = taskId;
        
        document.getElementById('edit-task-id').value = taskId;
        document.getElementById('edit-task-title').value = task.title;
        document.querySelector(`input[name="edit-points"][value="${task.points}"]`).checked = true;
        
        // ステータスボタンの状態を更新
        this.updateStatusButtons(task.status);
        
        document.getElementById('edit-modal').classList.remove('hidden');
    }

    // タスクの更新
    updateTask() {
        const task = this.tasks.find(t => t.id === this.currentEditingTaskId);
        if (!task) return;

        task.title = document.getElementById('edit-task-title').value.trim();
        task.points = parseInt(document.querySelector('input[name="edit-points"]:checked').value);

        this.saveTasks();
        this.render();
        this.closeEditModal();
    }

    // タスクの削除
    deleteTask() {
        if (!this.currentEditingTaskId) return;
        
        if (confirm('本当にこのタスクを削除しますか？')) {
            this.tasks = this.tasks.filter(t => t.id !== this.currentEditingTaskId);
            this.saveTasks();
            this.render();
            this.closeEditModal();
        }
    }

    // 編集モーダルを閉じる
    closeEditModal() {
        document.getElementById('edit-modal').classList.add('hidden');
        this.currentEditingTaskId = null;
    }

    // モーダルからステータスを変更
    setTaskStatusFromModal(status) {
        const task = this.tasks.find(t => t.id === this.currentEditingTaskId);
        if (!task) return;
        
        task.status = status;
        
        // 完了時刻の記録
        if (task.status === 'done') {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }
        
        this.updateStatusButtons(status);
        this.saveTasks();
        this.render();
    }

    // ステータスボタンの表示を更新
    updateStatusButtons(status) {
        // すべてのボタンからアクティブクラスを削除
        document.querySelectorAll('.btn-status').forEach(btn => {
            btn.classList.remove('active', 'active-done');
        });
        
        // 現在のステータスに応じてアクティブクラスを追加
        if (status === 'unstarted') {
            document.getElementById('status-unstarted').classList.add('active');
        } else if (status === 'doing') {
            document.getElementById('status-doing').classList.add('active');
        } else if (status === 'done') {
            document.getElementById('status-done').classList.add('active-done');
        }
    }

    // 週間サマリーの表示切り替え
    toggleWeekSummary() {
        const summaryContent = document.getElementById('week-summary-content');
        summaryContent.classList.toggle('hidden');
        
        if (!summaryContent.classList.contains('hidden')) {
            this.renderWeekSummary();
        }
    }

    // 週間サマリーのレンダリング
    renderWeekSummary() {
        const summaryContent = document.getElementById('week-summary-content');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weekTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= oneWeekAgo;
        });

        const completedTasks = weekTasks.filter(t => t.status === 'done');
        const totalPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);
        const doingPoints = weekTasks
            .filter(t => t.status === 'doing')
            .reduce((sum, t) => sum + t.points, 0);

        summaryContent.innerHTML = `
            <h3>今週の実績</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="stat-label">完了タスク:</span>
                    <span class="stat-value">${completedTasks.length}個</span>
                </div>
                <div class="stat">
                    <span class="stat-label">獲得ポイント:</span>
                    <span class="stat-value">${totalPoints}pt</span>
                </div>
                <div class="stat">
                    <span class="stat-label">進行中:</span>
                    <span class="stat-value">${doingPoints}pt</span>
                </div>
            </div>
            <div class="summary-chart">
                ${this.renderPointChart(weekTasks)}
            </div>
        `;
    }

    // ポイントチャート
    renderPointChart(tasks) {
        const pointGroups = [0, 1, 2, 3, 5, 8];
        const counts = {};
        
        pointGroups.forEach(pt => {
            counts[pt] = tasks.filter(t => t.points === pt && t.status === 'done').length;
        });

        return `
            <div class="point-chart">
                ${pointGroups.map(pt => `
                    <div class="chart-bar">
                        <div class="bar-fill pt-${pt}" style="height: ${counts[pt] * 20}px"></div>
                        <div class="bar-label">${pt}pt</div>
                        <div class="bar-count">${counts[pt]}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // タスクリストのレンダリング
    render() {
        const tasksList = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');

        if (this.tasks.length === 0) {
            tasksList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        tasksList.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // アクティブなタスク（未完了）を上に、完了タスクを下に
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return 0;
        });

        tasksList.innerHTML = sortedTasks.map(task => this.renderTask(task)).join('');

        // イベントリスナーを再設定
        this.attachTaskEventListeners();
    }

    // 個別タスクのレンダリング
    renderTask(task) {
        const statusIcon = {
            'unstarted': '<i class="fas fa-play"></i>',
            'doing': '<i class="fas fa-play"></i>',
            'done': '<i class="fas fa-check"></i>'
        };

        return `
            <div class="task-item ${task.status}" data-task-id="${task.id}">
                <button class="task-status-btn" data-action="status" data-task-id="${task.id}">
                    ${statusIcon[task.status]}
                </button>
                <div class="task-content">
                    <span class="task-title">${this.escapeHtml(task.title)}</span>
                    <span class="task-point pt-${task.points}">${task.points}pt</span>
                </div>
            </div>
        `;
    }

    // タスクイベントリスナーの設定
    attachTaskEventListeners() {
        document.querySelectorAll('[data-action="status"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.taskId;
                this.cycleTaskStatus(taskId);
            });
        });

        // タスクアイテム全体のクリックで編集モーダルを開く（ステータスボタン以外）
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // ステータスボタンクリックの場合は何もしない
                if (e.target.closest('.task-status-btn')) {
                    return;
                }
                this.openEditModal(item.dataset.taskId);
            });
        });
    }

    // Local Storageへの保存
    saveTasks() {
        localStorage.setItem('ktra_tasks', JSON.stringify(this.tasks));
    }

    // Local Storageからの読み込み
    loadTasks() {
        const saved = localStorage.getItem('ktra_tasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load tasks:', e);
                this.tasks = [];
            }
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 週間サマリー用のスタイルを追加
const style = document.createElement('style');
style.textContent = `
    .summary-stats {
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
    }
    
    .stat {
        text-align: center;
    }
    
    .stat-label {
        display: block;
        font-size: 0.9rem;
        color: var(--color-text-light);
        margin-bottom: 5px;
    }
    
    .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--color-base);
    }
    
    .point-chart {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 120px;
        margin-top: 20px;
        padding: 10px;
        background: var(--color-background);
        border-radius: var(--border-radius);
    }
    
    .chart-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        position: relative;
    }
    
    .bar-fill {
        width: 30px;
        min-height: 5px;
        border-radius: 4px 4px 0 0;
        transition: height 0.3s ease;
    }
    
    .bar-label {
        margin-top: 5px;
        font-size: 0.75rem;
        color: var(--color-text-light);
    }
    
    .bar-count {
        position: absolute;
        bottom: 100%;
        margin-bottom: 5px;
        font-size: 0.85rem;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// グローバル関数として公開（モーダル操作用）
window.closeEditModal = () => taskManager.closeEditModal();
window.deleteTask = () => taskManager.deleteTask();
window.setTaskStatus = (status) => taskManager.setTaskStatusFromModal(status);

// アプリケーションの初期化
const taskManager = new TaskManager();