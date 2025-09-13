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
    const FORCE_VERSION = '2025.1.14.1'; // 手動でバージョンを更新
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    if (storedVersion !== FORCE_VERSION) {
        // バージョンが異なる場合、強制リロード
        localStorage.setItem(CACHE_VERSION_KEY, FORCE_VERSION);

        // 初回訪問でない場合のみリロード
        if (storedVersion) {
            console.log('Cache version updated from', storedVersion, 'to', FORCE_VERSION, ', reloading page...');
            // 少し遅延を入れてキャッシュクリアを確実に完了させる
            setTimeout(() => {
                // より強力なリロード: URLにタイムスタンプを追加
                const url = new URL(window.location.href);
                url.searchParams.set('v', Date.now());
                window.location.href = url.toString();
            }, 500);
        }
    }

    // Safari特有の追加対策: sessionStorageもクリア
    try {
        sessionStorage.clear();
        console.log('SessionStorage cleared');
    } catch(e) {
        console.log('Could not clear sessionStorage:', e);
    }
})();