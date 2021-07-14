/**
 * Using Miniflare FTW:
 * - Docs: https://miniflare.dev
 * - Manual cron trigger: http://localhost:8787/.mf/scheduled
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
 * Gloabl declaration of e-publishing host and endpoints.
 * Currently includes support for all departmental publications,
 * and MAJCOM supplements only.
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
    MAJCOM_USAFE_ALL: PUBS_HOST + "?orgID=9&catID=2&series=-1",
    AFROTC_ALL: "https://raw.githubusercontent.com/willswire/afrotc-pubs/main/data.txt"
}

/**
 * Listens for incoming HTTP fetch requests. Responds by calling
 * the handleRequest function to produce a Responses, and handles
 * errors thru the handleError function.
 */
addEventListener("fetch", event => {
    const { request } = event
    const response = handleRequest(request).catch(handleError)
    event.respondWith(response)
})

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
 * Receives an HTTP request and returns a response.
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
 * Handles scheduled events provided by the listener. Using modular
 * arithmatic, the function will determine which e-pubs endpoint
 * to query, verify the retrieved object, and store in KV for later
 * reference.
 * @param {Event} event
 * @returns {Promise<Void>}
 */
async function handleScheduled(event) {
    const keys = Object.keys(PUBS_URL)
    const keyIndex = Math.trunc(event.scheduledTime / 60000) % keys.length
    const key = keys[keyIndex]
    return getLiveDataFor(PUBS_URL[key]).then(async data => {
        const verified = data.startsWith('[{"PubID":')
        if (verified) {
            console.log(key + " data verified")
            await STATIC_PUBS.put(key, data)
            console.log(key + " data stored")
        } else {
            throw new Error(key + " data is invalid!");
        }
    }).catch(console.error)
}

/**
 * Extracts the pubs array from the HTML object returned by e-publishing.af.mil
 * @param {String} text
 * @returns {String}
 */
function trim(text) {
    var startIndex = text.lastIndexOf('[')
    var endIndex = text.lastIndexOf(']')
    return text.substring(startIndex, endIndex + 1)
}

/**
 * Fetches pubs from e-publishing.af.mil
 * @returns {Promise<String>}
 */
async function getLiveDataFor(url) {
    return fetch(url)
    .then(res => res.text())
    .then(text => trim(text))
}

/**
 * Responds with the appropriate batch of MAJCOM supplements
 * @param {URLSearchParams} params 
 * @returns {Response}
 */
async function respondWith(params) {
    const result = await STATIC_PUBS.get("MAJCOM_" + params.get('majcom').toUpperCase() + "_ALL", { type: "json" })
    if (result) {
        return new Response(JSON.stringify(result), init)
    } else {
        return new Response('', { status: 404 })
    }
}

/**
 * Returns aggregated e-pubs data found in the KV store
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
