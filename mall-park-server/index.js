const jsonServer = require('json-server')
const mpServer = jsonServer.create()
const router = jsonServer.router('db.json')
const middileware = jsonServer.defaults()

const PORT = 3000
mpServer.use(middileware)
mpServer.use(router)

mpServer.listen(PORT,()=>{
    console.log(`mpServer is running successfully...`)
    console.log(`Running at PORT:${PORT}`)
})
