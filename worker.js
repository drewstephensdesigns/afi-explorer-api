/**
 * Using Miniflare FTW:
 * - Docs: https://miniflare.dev
 * - Cron trigger: http://localhost:8787/.mf/scheduled
 * - Command: miniflare worker.js -k STATIC_PUBS
 */


/**
 * Global declaration of request/response headers
 * as we only work with publicly accessible JSON
 */
const init = {
    headers: {
        "content-type": "application/json;charset=UTF-8",
    },
}

/** 
 * Gloabl declaration of e-publishing host and endpoints
 */
const PUBS_HOST = "https://www.e-publishing.af.mil/DesktopModules/MVC/EPUBS/EPUB/GetPubsBySeriesView/"
const PUBS_URL = {
    USAF_DEPT_ALL: PUBS_HOST + "?orgID=10141&catID=1&series=-1",
    MAJCOM_ACC_ALL: PUBS_HOST + "?orgID=1&catID=2&series=-1",
    MAJCOM_AETC_ALL: PUBS_HOST + "?orgID=6887&catID=2&series=-1",
    MAJCOM_AFGSC_ALL: PUBS_HOST + "?orgID=59&catID=2&series=-1",
    MAJCOM_AFMC_ALL: PUBS_HOST + "?orgID=4&catID=2&series=-1",
    MAJCOM_AFRC_ALL: PUBS_HOST + "?orgID=10149&catID=2&series=-1",
    MAJCOM_AFSOC_ALL: PUBS_HOST + "?orgID=6&catID=2&series=-1",
    MAJCOM_AMC_ALL: PUBS_HOST + "?orgID=9774&catID=2&series=-1",
    MAJCOM_PACAF_ALL: PUBS_HOST + "?orgID=8&catID=2&series=-1",
    MAJCOM_USAFE_ALL: PUBS_HOST + "?orgID=9&catID=2&series=-1"
}

/**
 * Listens for incoming HTTP fetch requests.
 */
addEventListener("fetch", event => {
    const { request } = event
    const response = handleRequest(request).catch(handleError)
    event.respondWith(response)
})

/**
 * Receives an HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(_request) {
    return respondWithDataForAll()
}

/**
 * Listens for Cron tasks scheduled for this worker
 */
addEventListener("scheduled", event => {
    event.waitUntil(handleScheduled(event))
})

/**
 * Handles scheduled events provided by the listener
 * @param {Event} _event
 * @returns {Promise<Void>}
 */
async function handleScheduled(_event) {
    const promises = [];

    for (const key in PUBS_URL) {
        const data = await getLiveDataFor(PUBS_URL[key])
        if (data.includes("PubID")) {
            promises.push(STATIC_PUBS.put(key, data))
            console.log(key + " data stored")
        } else {
            return Promise.reject(new Error(key + " endpoint contains invalid data!"));
        }
    }

    await Promise.all(promises)
    .then(values => {
        console.log(values.length + " successful KV entries")
    }).catch(error => {
        console.log("Error occured when attempting to store KV entry: " + error)
    })
}

/**
 * Responds with an uncaught error.
 * @param {Error} error
 * @returns {Promise<Response>}
 */
function handleError(error) {
    console.error('Uncaught error:', error)

    const { stack } = error
    return new Response(stack || error, {
        status: 500,
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
        }
    })
}

/**
 * Extracts the pubs array from the object returned by epublishing.af.mil
 * @param {String} text
 * @returns {String}
 */
function trim(text) {
    var startIndex = text.lastIndexOf('[');
    var endIndex = text.lastIndexOf(']');
    return text.substring(startIndex, endIndex + 1)
}

/**
 * Fetches pubs from epublishing.af.mil
 * @returns {Promise<String>}
 */
async function getLiveDataFor(category) {
    return fetch(category)
    .then(res => res.text())
    .then(text => {
        return trim(text)
    })
}

/**
 * Returns fetched, trimmed data from epublishing.af.mil
 * @returns {Promise<Response>}
 */
 async function respondWithDataForAll() {
    const promises = [];

    for (const key in PUBS_URL) {
        promises.push(STATIC_PUBS.get(key, {type: "json"}))
    }

    const data = await Promise.all(promises).then(values => {
        var merged = [];
        for (var i = 0; i < values.length; i++) {
            merged = merged.concat(values[i]);
        }
        return merged.filter(p => p);
    })
    
    return new Response(JSON.stringify(data), init)
}
