# AFI Explorer API
Aggregates [e-publishing.af.mil](https://www.e-publishing.af.mil/Product-Index/) publication objects into a single JSON object array using [Cloudflare Workers and KV Stores](https://workers.cloudflare.com). This API/data-source provides information for the [AFI Explorer](https://afiexplorer.com) mobile app. 

## API Usage
You can access the live API by visiting [api.afiexplorer.com](https://api.afiexplorer.com)
 
## Routes
- `/` the default path serves data for all publications

## Development
Go to the [api.afiexplorer.com GitHub repo](https://github.com/willswire/api.afiexplorer.com) to clone a copy of the worker script. The use of [miniflare](https://miniflare.dev) for local development is required. After installing the module globally with npm, run the following command to start the worker:

`miniflare worker.js -k STATIC_PUBS`

To trigger the scheduled event that builds out the static KV data store, make an HTTP request to the miniflare engine:

`curl "http://localhost:8787/.mf/scheduled"`
