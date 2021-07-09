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
    const { pathname } = new URL(url)

    switch (pathname) {
        case '/':
        case '/live':
            return respondLiveData()
        case '/static':
            return respondStaticData()
    }

    return fetch(request)
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
    const data = await getLiveData()
    if (data.includes("PubID")) {
        console.log("Data structure looks good, so we stored it in KV.")
        await STATIC_PUBS.put("data", data)
    }
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
async function getLiveData() {
    return fetch(EPUBS_URL)
    .then(res => res.text())
    .then(text => {
        return trim(text)
    })
}

/**
 * Returns fetched, trimmed data from epublishing.af.mil
 * @returns {Promise<Response>}
 */
async function respondLiveData() {
    const data = await getLiveData()
    if (data.length < 1000) {
        console.log("Responding with static data")
        return respondStaticData()
    } else {
        console.log("Responding with live data")
        return new Response(data, init)
    }
}

/**
 * Returns KV cached, trimmed data from epublishing.af.mil
 * @returns {Promise<Response>}
 */
async function respondStaticData() {
    const data = await STATIC_PUBS.get("data")
    return new Response(data, init)
}
