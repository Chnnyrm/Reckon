// Vercel Node function: the whole API, served from one Express instance.
//
// Vercel's Express guidance says the application must be exported as the
// module's default export (or started with a port listener), which the Node
// runtime then invokes with (req, res):
//   https://vercel.com/docs/frameworks/backend/express#using-a-default-export
// An Express app is itself a (req, res, next) handler, so no adapter is needed.
//
// There is no listener here and no static middleware: vercel.json rewrites
// /api/* to this function and serves the Vite build from the CDN.
import app from '../server/app.mjs'

export default app
