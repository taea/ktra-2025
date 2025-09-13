// PWAキャッシュクリーナー
// 古いService Workerの登録解除とキャッシュのクリアを行います

(function() {
    // Service Workerの登録解除
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister().then(function(success) {
                    if (success) {
                        console.log('Service Worker unregistered successfully');
                    }
                });
            }
        });
    }

    // すべてのキャッシュをクリア
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName).then(function() {
                        console.log('Cache deleted:', cacheName);
                    });
                })
            );
        }).then(function() {
            console.log('All caches cleared');
        });
    }

    // バージョン管理用のタイムスタンプをローカルストレージに保存
    // これにより、クライアント側で更新を検知できます
    const CACHE_VERSION_KEY = 'ktra_cache_version';
    const currentVersion = Date.now().toString();
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    if (storedVersion !== currentVersion) {
        // バージョンが異なる場合、強制リロード
        localStorage.setItem(CACHE_VERSION_KEY, currentVersion);

        // 初回訪問でない場合のみリロード
        if (storedVersion) {
            console.log('Cache version updated, reloading page...');
            // 少し遅延を入れてキャッシュクリアを確実に完了させる
            setTimeout(() => {
                window.location.reload(true);
            }, 500);
        }
    }
})();