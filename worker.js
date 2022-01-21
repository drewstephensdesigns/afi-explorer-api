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
    
    // Base Supplements
    BASES_ALTUS_ALL: PUBS_HOST + "?orgID=10155&catID=6&series=-1",
    BASES_ANDERSEN_ALL:  PUBS_HOST + "?orgID=10156&catID=6&series=-1",
    BASES_ARNOLD_ALL:  PUBS_HOST + "?orgID=10159&catID=6&series=-1",
    BASES_AVIANO_ALL:  PUBS_HOST + "?orgID=10163&catID=6&series=-1",
    BASES_BARKSDALE_ALL:  PUBS_HOST + "?orgID=10164&catID=6&series=-1",
    BASES_BEALE_ALL:  PUBS_HOST + "?orgID=10165&catID=6&series=-1",
    BASES_BUCKLEY_ALL:  PUBS_HOST + "?orgID=14406&catID=6&series=-1",
    BASES_CANNON_ALL:  PUBS_HOST + "?orgID=10168&catID=6&series=-1",
    BASES_CAVALIER_ALL:  PUBS_HOST + "?orgID=13495&catID=6&series=-1",
    BASES_CHEYENNEMOUNTAIN_ALL:  PUBS_HOST + "?orgID=13496&catID=6&series=-1",
    BASES_CLEAR_ALL:  PUBS_HOST + "?orgID=13498&catID=6&series=-1",
    BASES_COLUMBUS_ALL: PUBS_HOST + "?orgID=10170&catID=6&series=-1",
    BASES_CREECH_ALL:  PUBS_HOST + "?orgID=10171&catID=6&series=-1",
    BASES_DAVISMONTHAN_ALL:  PUBS_HOST + "?orgID=10173&catID=6&series=-1",
    BASES_DOBBINS_ALL:  PUBS_HOST + "?orgID=10174&catID=6&series=-1",
    BASES_DOVER_ALL:  PUBS_HOST + "?orgID=10175&catID=6&series=-1",
    BASES_DYESS_ALL:  PUBS_HOST + "?orgID=13934&catID=6&series=-1",
    BASES_EDWARDS_ALL:  PUBS_HOST + "?orgID=10176&catID=6&series=-1",
    BASES_EGLIN_ALL:  PUBS_HOST + "?orgID=10177&catID=6&series=-1",
    BASES_EIELSON_ALL:  PUBS_HOST + "?orgID=13947&catID=6&series=-1",
    BASES_ELLSWORTH_ALL:  PUBS_HOST + "?orgID=10179&catID=6&series=-1",
    BASES_FAIRCHILD_ALL:  PUBS_HOST + "?orgID=10181&catID=6&series=-1",
    BASES_FRANCISEWARREN_ALL:  PUBS_HOST + "?orgID=10182&catID=6&series=-1",
    BASES_GOODFELLOW_ALL:  PUBS_HOST + "?orgID=10183&catID=6&series=-1",
    BASES_GRANDFORKS_ALL:  PUBS_HOST + "?orgID=10184&catID=6&series=-1",
    BASES_GRISSOM_ALL:  PUBS_HOST + "?orgID=10185&catID=6&series=-1",
    BASES_HANSCOM_ALL:  PUBS_HOST + "?orgID=10186&catID=6&series=-1",
    BASES_HILL_ALL:  PUBS_HOST + "?orgID=10188&catID=6&series=-1",
    BASES_HOLLOMAN_ALL:  PUBS_HOST + "?orgID=10189&catID=6&series=-1",
    BASES_HOMESTEAD_ALL:  PUBS_HOST + "?orgID=10190&catID=6&series=-1",
    BASES_HURLBURT_ALL:  PUBS_HOST + "?orgID=10191&catID=6&series=-1",
    BASES_INCIRLIK_ALL:  PUBS_HOST + "?orgID=10192&catID=6&series=-1",
    BASES_JBANDREWSNAF_ALL:  PUBS_HOST + "?orgID=10194&catID=6&series=-1",
    BASES_JBCHARLESTON_ALL:  PUBS_HOST + "?orgID=10195&catID=6&series=-1",
    BASES_JBELMENDORF_ALL:  PUBS_HOST + "?orgID=10196&catID=6&series=-1",
    BASES_JBLANGLEY_ALL:  PUBS_HOST + "?orgID=10197&catID=6&series=-1",
    BASES_JBLEWISMCCHORD_ALL:  PUBS_HOST + "?orgID=10198&catID=6&series=-1",
    BASES_JBMCGUIREDIXLAKEHURST_ALL:  PUBS_HOST + "?orgID=10200&catID=6&series=-1",
    BASES_JBPEARLHARBORHICKAM_ALL:  PUBS_HOST + "?orgID=10202&catID=6&series=-1",
    BASES_JBSANANTONIO_ALL:  PUBS_HOST + "?orgID=10203&catID=6&series=-1",
    BASES_KADENA_ALL:  PUBS_HOST + "?orgID=10206&catID=6&series=-1",
    BASES_KEESLER_ALL:  PUBS_HOST + "?orgID=10208&catID=6&series=-1",
    BASES_KIRTLAND_ALL:  PUBS_HOST + "?orgID=10209&catID=6&series=-1",
    BASES_LAJES_ALL:  PUBS_HOST + "?orgID=10212&catID=6&series=-1",
    BASES_LAKENHEATH_ALL:  PUBS_HOST + "?orgID=10213&catID=6&series=-1",
    BASES_LAUGHLIN_ALL:  PUBS_HOST + "?orgID=10215&catID=6&series=-1",
    BASES_LITTLEROCK_ALL:  PUBS_HOST + "?orgID=10216&catID=6&series=-1",
    BASES_LOSANGELES_ALL:  PUBS_HOST + "?orgID=10217&catID=6&series=-1",
    BASES_LUKE_ALL:  PUBS_HOST + "?orgID=10218&catID=6&series=-1",
    BASES_MACDILL_ALL:  PUBS_HOST + "?orgID=10219&catID=6&series=-1",
    BASES_MALMSTROM_ALL:  PUBS_HOST + "?orgID=10220&catID=6&series=-1",
    BASES_MARCH_ALL:  PUBS_HOST + "?orgID=10221&catID=6&series=-1",
    BASES_MAXWELL_ALL:  PUBS_HOST + "?orgID=10222&catID=6&series=-1",
    BASES_MCCONNELL_ALL:  PUBS_HOST + "?orgID=10224&catID=6&series=-1",
    BASES_MCGUIRE_ALL:  PUBS_HOST + "?orgID=10225&catID=6&series=-1",
    BASES_MINOT_ALL:  PUBS_HOST + "?orgID=10229&catID=6&series=-1",
    BASES_MISAWA_ALL:  PUBS_HOST + "?orgID=10230&catID=6&series=-",
    BASES_MOODY_ALL:  PUBS_HOST + "?orgID=10231&catID=6&series=-1",
    BASES_MOUNTAINHOME_ALL:  PUBS_HOST + "?orgID=10232&catID=6&series=-1",
    BASES_NELLIS_ALL:  PUBS_HOST + "?orgID=10233&catID=6&series=-1",
    BASES_NEWBOSTON_ALL:  PUBS_HOST + "?orgID=16251&catID=6&series=-1",
    BASES_NIAGARAFALLS_ALL:  PUBS_HOST + "?orgID=10234&catID=6&series=-1",
    BASES_OFFUTT_ALL:  PUBS_HOST + "?orgID=10236&catID=6&series=-1",
    BASES_OSAN_ALL:  PUBS_HOST + "?orgID=15305&catID=6&series=-1",
    BASES_PATRICK_ALL:  PUBS_HOST + "?orgID=16053&catID=6&series=-1",
    BASES_PETERSON_ALL:  PUBS_HOST + "?orgID=13558&catID=6&series=-1",
    BASES_POPEFIELD_ALL:  PUBS_HOST + "?orgID=10240&catID=6&series=-1",
    BASES_RAFMILDENHALL_ALL:  PUBS_HOST + "?orgID=10227&catID=6&series=-1",
    BASES_RAMSTEIN_ALL:  PUBS_HOST + "?orgID=10241&catID=6&series=-1",
    BASES_ROBINS_ALL:  PUBS_HOST + "?orgID=10243&catID=6&series=-1",
    BASES_SCHRIEVER_ALL:  PUBS_HOST + "?orgID=13960&catID=6&series=-1",
    BASES_SCOTT_ALL:  PUBS_HOST + "?orgID=10244&catID=6&series=-1",
    BASES_SEYMOURJOHNSON_ALL:  PUBS_HOST + "?orgID=10245&catID=6&series=-1",
    BASES_SHAW_ALL:  PUBS_HOST + "?orgID=10247&catID=6&series=-1",
    BASES_SHEPPARD_ALL:  PUBS_HOST + "?orgID=10248&catID=6&series=-1",
    BASES_SPANGDAHLEM_ALL:  PUBS_HOST + "?orgID=10250&catID=6&series=-1",
    BASES_THULE_ALL:  PUBS_HOST + "?orgID=10252&catID=6&series=-1",
    BASES_TINKER_ALL:  PUBS_HOST + "?orgID=10253&catID=6&series=-1",
    BASES_TRAVIS_ALL:  PUBS_HOST + "?orgID=10254&catID=6&series=-1",
    BASES_TYNDALL_ALL:  PUBS_HOST + "?orgID=10255&catID=6&series=-1",
    BASES_VANCE_ALL:  PUBS_HOST + "?orgID=10258&catID=6&series=-1",
    BASES_VANDENBERG_ALL:  PUBS_HOST + "?orgID=13499&catID=6&series=-1",
    BASES_WHITEMAN_ALL:  PUBS_HOST + "?orgID=10259&catID=6&series=-1",
    BASES_WRIGHTPATTERSON_ALL:  PUBS_HOST + "?orgID=10261&catID=6&series=-1",
    BASES_YOKOTA_ALL:  PUBS_HOST + "?orgID=10262&catID=6&series=-1",
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
    console.log("Responding with all pubs")
    return respond()
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
    return retrieve(PUBS_URL[key]).then(async data => {
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
async function retrieve(url) {
    return fetch(url)
    .then(res => res.text())
    .then(text => trim(text))
}

/**
 * Returns aggregated e-pubs data found in the KV store
 * @returns {Promise<Response>}
 */
async function respond() {
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
