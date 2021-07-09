# AFI Explorer API
Serve the [e-publishing.af.mil](https://e-publishing.af.mil) publications found in *EPUBS > Home > Air Force > Departmental* as a JSON object array using [Cloudflare Workers](https://workers.cloudflare.com).

## API Usage
This API provides data for the following mobile applications:
- [AFI Explorer](https://apps.apple.com/us/app/afi-explorer/id1564964107) for iOS/iPadOS 
- [AFI Explorer](https://play.google.com/store/apps/details?id=io.github.drewstephenscoding.afiexplorer&hl=en_US&gl=US) for Android 
 
## Routes
`/` the root path serves cached data from e-pubs using Cloudflare KV stores 

## Development
The use of [miniflare](https://miniflare.dev) for local development is strongly reccomended. After installing the module globally with npm, run the following command to start the worker:

`miniflare worker.js -k STATIC_PUBS`

To trigger the scheduled event that build sout the static KV data store, make an HTTP request to the miniflare engine:

`curl "http://localhost:8787/.mf/scheduled"`