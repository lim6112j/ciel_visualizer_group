const cors = require('@fastify/cors')
const path = require('path')
const { Client } = require('pg')
const Fastify = require('fastify');
const app = Fastify()
app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../dist'),
    prefix: '/dist/',
})
app.register(cors, {})
//const client = new Client({
//user: 'postgres',
//host: '34.64.234.230',
//password: 'ciel@105',
//database: 'mobble',
//port: 5432,
//})
const client = new Client({
    user: 'postgres',
    host: '34.64.199.241',
    password: 'db!@#105',
    database: 'mobble',
    port: 5432,
})
let rows
client.connect()
app.get('/', (req, reply) => {
    reply.sendFile('index.html')
})
app.get('/planning', (req, reply) => {
    reply.sendFile('./planning/index.html')
})
app.get('/demand/:query', async (req, reply) => {
    const { query } = req.params
    const { rows } = await client.query(`SELECT t.*
               FROM mobble_dispatcher.demand t
               WHERE to_char(picked_date, 'YYYY-MM-DD') = '${query}'
               ORDER BY picked_date`)
    return rows
})

app.get('/location/:query', async (req, reply) => {
    const { query } = req.params
    const queryTrimmed = query.replace(/-/g, '')
    const { rows } = await client.query(
        `SELECT supply_idx, device_id, loc, accuracy, heading, speed, get_date, input_date
FROM (
                      SELECT row_number() over (ORDER BY get_date) as no, t.*
                      FROM mobble_log.supply_location_log_${queryTrimmed} t
                      ORDER BY get_date) RAW
WHERE RAW.no % 3 = 0;`
    )
    return rows
})
app.get('/simulation/:query', async (req, reply) => {
    const { query } = req.params
    const query_short = query.replace(/-/g, '').substring(0, 6)
    const { rows } = await client.query(
        `SELECT * FROM mobble_log.supply_waypoint_path_log_${query_short} l
WHERE to_char(l.get_date, 'YYYY-MM-DD') LIKE '${query}'
ORDER BY l.get_date, l.waypoint_seq`

    )
    return rows
})
app.listen({ port: 1234, host: '0.0.0.0' }).then(() => {
    console.log('Server running at http://localhost:1234/');
});
