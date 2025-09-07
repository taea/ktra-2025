// タスク管理のメインクラス
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentEditingTaskId = null;
        this.draggedElement = null;
        this.draggedTaskId = null;
        this.touchStartY = null;
        this.touchTimer = null;
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

        const previousStatus = task.status;
        task.status = statusCycle[task.status];
        
        // 完了時刻の記録
        if (task.status === 'done') {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }

        // データを保存
        this.saveTasks();
        
        // アニメーション表示（render前に実行）
        const shouldShowAnimation = 
            (previousStatus === 'unstarted' && task.status === 'doing') ||
            (previousStatus === 'doing' && task.status === 'done');
            
        if (shouldShowAnimation) {
            const message = task.status === 'doing' ? 'START!' : 'DONE!';
            this.showStatusAnimationBeforeRender(taskId, message, task.points);
        } else {
            this.render();
        }
    }

    // ステータス変更アニメーション表示（render前用）
    showStatusAnimationBeforeRender(taskId, message, points) {
        // フルスクリーンオーバーレイ要素を作成
        const overlay = document.createElement('div');
        overlay.className = `status-overlay-fullscreen pt-${points}`;
        overlay.innerHTML = `
            <div class="status-message-container">
                <span class="status-message">${message}</span>
            </div>
        `;
        
        // body直下に追加（画面全体を覆う）
        document.body.appendChild(overlay);
        
        // アニメーション開始
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        // アニメーション後に削除してからrender
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
                this.render(); // アニメーション終了後にrender
            }, 300);
        }, 600);
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

        // カスタムオーダーがある場合はそれを使用、ない場合はステータス順
        const sortedTasks = this.sortTasksByOrder();

        tasksList.innerHTML = sortedTasks.map(task => this.renderTask(task)).join('');

        // イベントリスナーを再設定
        this.attachTaskEventListeners();
        this.attachDragAndDropListeners();
    }

    // タスクのソート
    sortTasksByOrder() {
        // 未完了タスクと完了タスクを分離
        const activeTasks = this.tasks.filter(t => t.status !== 'done');
        const doneTasks = this.tasks.filter(t => t.status === 'done');
        
        // それぞれをソート
        const sortedActive = activeTasks.sort((a, b) => {
            // カスタムオーダーがある場合は優先
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // なければステータス順（doing -> unstarted）
            const statusPriority = {
                'doing': 0,
                'unstarted': 1
            };
            return statusPriority[a.status] - statusPriority[b.status];
        });
        
        const sortedDone = doneTasks.sort((a, b) => {
            // 完了タスク内でもカスタムオーダーを維持
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return 0;
        });
        
        // 未完了を上に、完了を下に結合
        return [...sortedActive, ...sortedDone];
    }

    // 個別タスクのレンダリング
    renderTask(task) {
        const statusIcon = {
            'unstarted': '<i class="fas fa-play"></i>',
            'doing': '<i class="fas fa-play"></i>',
            'done': '<i class="fas fa-check"></i>'
        };

        return `
            <div class="task-item ${task.status} pt-${task.points}" 
                 data-task-id="${task.id}"
                 draggable="true">
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

    // ドラッグ&ドロップのイベントリスナーを設定
    attachDragAndDropListeners() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            // デスクトップ用ドラッグイベント
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
            // モバイル用タッチイベント（iPhone Safari対応）
            item.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
            item.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
            item.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        });
    }

    // ドラッグ開始
    handleDragStart(e) {
        this.draggedElement = e.currentTarget;
        this.draggedTaskId = e.currentTarget.dataset.taskId;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    // ドラッグ終了
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    // ドラッグオーバー
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    // ドラッグエンター
    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    // ドラッグリーブ
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    // ドロップ
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        const dropTarget = e.currentTarget;
        if (this.draggedElement !== dropTarget) {
            this.reorderTasks(this.draggedTaskId, dropTarget.dataset.taskId);
        }
        
        return false;
    }

    // タッチ開始（iPhone対応）
    handleTouchStart(e) {
        const touch = e.touches[0];
        
        // ステータスボタンをタッチした場合はドラッグしない
        if (e.target.closest('.task-status-btn')) return;
        
        // 長押しタイマーを設定（300ms後にドラッグ開始）
        this.touchTimer = setTimeout(() => {
            this.draggedElement = e.currentTarget;
            this.draggedTaskId = e.currentTarget.dataset.taskId;
            this.touchStartY = touch.clientY;
            
            e.currentTarget.classList.add('dragging');
            e.currentTarget.style.position = 'relative';
            e.currentTarget.style.zIndex = '1000';
            
            // 触覚フィードバック（対応デバイスのみ）
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        }, 300);
    }

    // タッチ移動
    handleTouchMove(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const deltaY = currentY - this.touchStartY;
        
        // ドラッグ中の要素を移動
        this.draggedElement.style.transform = `translateY(${deltaY}px)`;
        
        // ドロップ対象を検出
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskBelow = elementBelow?.closest('.task-item');
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        
        if (taskBelow && taskBelow !== this.draggedElement) {
            taskBelow.classList.add('drag-over');
        }
    }

    // タッチ終了
    handleTouchEnd(e) {
        // タイマーをクリア
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            this.touchTimer = null;
        }
        
        if (!this.draggedElement) return;
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskBelow = elementBelow?.closest('.task-item');
        
        if (taskBelow && taskBelow !== this.draggedElement) {
            this.reorderTasks(this.draggedTaskId, taskBelow.dataset.taskId);
        }
        
        // スタイルをリセット
        this.draggedElement.classList.remove('dragging');
        this.draggedElement.style.position = '';
        this.draggedElement.style.zIndex = '';
        this.draggedElement.style.transform = '';
        
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        
        this.draggedElement = null;
        this.draggedTaskId = null;
        this.touchStartY = null;
    }

    // タスクの順序を変更
    reorderTasks(draggedId, targetId) {
        const draggedTask = this.tasks.find(t => t.id === draggedId);
        const targetTask = this.tasks.find(t => t.id === targetId);
        
        if (!draggedTask || !targetTask) return;
        
        // 完了タスクと未完了タスク間のドラッグを制限
        const draggedIsDone = draggedTask.status === 'done';
        const targetIsDone = targetTask.status === 'done';
        
        // 異なるグループ間のドラッグは無効
        if (draggedIsDone !== targetIsDone) {
            return;
        }
        
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        // タスクを移動
        const [movedTask] = this.tasks.splice(draggedIndex, 1);
        this.tasks.splice(targetIndex, 0, movedTask);
        
        // グループごとに順序を再設定
        const activeTasks = this.tasks.filter(t => t.status !== 'done');
        const doneTasks = this.tasks.filter(t => t.status === 'done');
        
        // 未完了タスクの順序を更新
        activeTasks.forEach((task, index) => {
            task.order = index;
        });
        
        // 完了タスクの順序を更新（1000から開始して区別）
        doneTasks.forEach((task, index) => {
            task.order = 1000 + index;
        });
        
        this.saveTasks();
        this.render();
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