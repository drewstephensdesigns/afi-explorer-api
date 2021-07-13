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
    }
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
async function handleRequest(request) {
    const { url } = request
    const params = (new URL(url)).searchParams
    if (params != "") {
        console.log("Responding with some pubs")
        return respondWith(params)
    } else {
        console.log("Responding with all pubs")
        return respondWithAll()
    }
}

/**
 * Listens for Cron tasks scheduled for this worker
 */
addEventListener("scheduled", event => {
    event.waitUntil(handleScheduled(event))
})

/**
 * Handles scheduled events provided by the listener
 * @param {Event} event
 * @returns {Promise<Void>}
 */
async function handleScheduled(event) {
    const keys = Object.keys(PUBS_URL)
    const keyIndex = Math.trunc(event.scheduledTime / 60000) % keys.length
    const key = keys[keyIndex]
    return getLiveDataFor(PUBS_URL[key]).then(async data => {
        if (data.includes("PubID")) {
            await STATIC_PUBS.put(key, data)
            console.log(key + " data stored")
        } else {
            throw new Error(key + " has invalid data!");
        }
    }).catch(error => handleError(error))
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
async function getLiveDataFor(url) {
    console.log("Retrieving data from " + url)
    return fetch(url)
    .then(res => res.text())
    .then(text => trim(text))
}

async function respondWith(params) {
    const result = await STATIC_PUBS.get("MAJCOM_" + params.get('majcom').toUpperCase() + "_ALL", { type: "json" })
    if (result) {
        return new Response(JSON.stringify(result), init)
    } else {
        return new Response('', { status: 404 })
    }
}

/**
 * Returns fetched, trimmed data from epublishing.af.mil
 * @returns {Promise<Response>}
 */
async function respondWithAll() {
    const promises = [];

    for await (const key of Object.keys(PUBS_URL)) {
        promises.push(STATIC_PUBS.get(key, { type: "json" }))
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
