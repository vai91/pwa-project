var CACHE_STATIC_NAME = 'static-v8';
var CACHE_DYNAMIC_NAME = 'dynamic-v2';
var CACHED_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  // polyfills do not need to be cached, since the older browsers do not support serviceworkers anyway. But, there's performance gain. 
  // Even modern browsers need to load these files, because they imported in index.html, so storing them in cache will increase performance.
  // This can be optimized with a build workflow, to conditionally load them
  '/src/js/promise.js',
  '/src/js/fetch.js',
  // Styles
  '/src/css/app.css',
  '/src/css/feed.css',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  '',
  // Images
  '/src/images/main-image.jpg'
]

self.addEventListener("install", function (event) {
  console.log("[ServiceWorker] Installing ServiceWorker ...", event);
  //ensuring installation event is not completed before caching is done.
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[ServiceWorker] Precaching App shell');
        /*sw will send the request to the server, get that asset, and stores it, in one step. */
        cache.addAll(CACHED_URLS);
      })
  );
});

self.addEventListener("activate", function (event) {
  console.log("[ServiceWorker] Activating ServiceWorker ...", event);
  event.waitUntil(
    //keys gives all sub-caches in cache storage
    caches.keys()
      .then(function (keyList) {
        //Promise.all takes an array of promises, and waits for all of them to finish
        //then i transform array of strings into array of promises by using map method
        return Promise.all(keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[ServiceWorker] Removing old cache...', key);
            return caches.delete(key);
          }
        }))
      })
  )
  /*To ensure ServiceWorkers are loaded, or are activated correctly */
  return self.clients.claim();
});

/* //Network with cache fallback strategy
self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function(res) {
        return caches.open(CACHE_DYNAMIC_NAME)
          .then(function(cache) {
            cache.put(event.request.url, res.clone());
            return res;
          })
      })
      .catch(function (err) {
        return caches.match(event.request);
      })
  );
}); */

//cache then network, dynamic caching
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.open(CACHE_DYNAMIC_NAME)
      .then(function (cache) {
        return fetch(event.request)
          .then(function (res) {
            cache.put(event.request, res.clone());
            return res;
          })
      })
  );
});

/* //default caching strategy - Cache With Network Fallback
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function (cache) {
                  cache.put(event.request.url, res.clone())
                  return res;
                })
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME)
                .then(function (cache) {
                  return cache.match('/offline.html')
                });
            });
        }
      })
  );
}); */