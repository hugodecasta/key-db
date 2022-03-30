const test = require('ava')

// const fetch = require('node-fetch')

// ---------------------------------------- BEGIN

process.env.NO_BACKUP = 'true'

test.serial.before(() => {
})

// ---------------------------------------- AUTH ENGINE

const auth_engine = require('./auth_engine')

// -------- CONNECT & DATA

let connect_token = null

test.serial('auth connect', t => {
    t.notThrows(() => connect_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => auth_engine.connect('admin', 'caca'))
})

test.serial('auth is_connected', t => {
    t.true(auth_engine.connected(connect_token))
    t.false(auth_engine.connected('cacapipi'))
})

test.serial('user data', t => {
    let user = null
    t.notThrows(() => user = auth_engine.get_user(connect_token))
    t.is(user.fname, 'admin')
    t.is(user.lname, 'admin')
    t.throws(() => auth_engine.get_user('cacapipi'))
})

test.serial('auth roles', t => {
    let roles = []
    t.notThrows(() => roles = auth_engine.get_roles(connect_token))
    t.is(roles.length, 1)
    t.is(roles[0], 'admin')
    t.throws(() => auth_engine.get_roles('cacapipi'))
})

test.serial('auth role check', t => {
    t.true(auth_engine.match_role(connect_token, 'admin'))
    t.false(auth_engine.match_role(connect_token, 'role'))
    t.throws(() => auth_engine.match_role('cacapipi', 'admin'))
})

test.serial('auth disconnect', t => {
    t.true(auth_engine.connected(connect_token))
    t.notThrows(() => auth_engine.disconnect(connect_token))
    t.false(auth_engine.connected(connect_token))
    t.throws(() => auth_engine.disconnect('cacapipi'))
})

// -------- ADMIN

test.serial('check admin', t => {
    connect_token = auth_engine.connect('admin', 'admin')
    const simple = auth_engine.connect('guest', 'guest')
    t.true(auth_engine.is_admin(connect_token))
    t.false(auth_engine.is_admin(simple))
    t.throws(() => auth_engine.is_admin('cacapipi'))
})

test.serial('create user', t => {
    t.false(auth_engine.user_exists('caca'))
    t.notThrows(() => auth_engine.create_user('caca', 'caca', 'caca', 'caca'))
    t.true(auth_engine.user_exists('caca'))
    t.throws(() => auth_engine.create_user('caca', 'caca', 'caca', 'caca'))
})

test.serial('update data', t => {
    const caca_token = auth_engine.connect('caca', 'caca')
    const caca_data = auth_engine.get_user(caca_token)
    t.is(caca_data.lname, 'caca')
    caca_data.lname = 'proute'
    t.notThrows(() => auth_engine.update_user(caca_token, caca_data))
    const caca_data_updated = auth_engine.get_user(caca_token)
    t.is(caca_data_updated.lname, 'proute')
    t.throws(() => auth_engine.update_user('cacapipi', caca_data))
    auth_engine.disconnect(caca_token)
})

test.serial('change password', t => {
    const caca_token = auth_engine.connect('caca', 'caca')
    t.true(auth_engine.connected(caca_token))
    t.notThrows(() => auth_engine.update_user_pass('caca', 'caca', 'pipi'))
    t.false(auth_engine.connected(caca_token))
    t.throws(() => auth_engine.connect('caca', 'caca'))
    t.notThrows(() => auth_engine.connect('caca', 'pipi'))
})

test.serial('change roles', t => {
    t.false(auth_engine.match_role(connect_token, 'pipi'))
    t.notThrows(() => auth_engine.add_role('admin', 'pipi'))
    t.true(auth_engine.match_role(connect_token, 'pipi'))
    t.throws(() => auth_engine.add_role('admin', 'pipi'))
})

test.serial('remove roles', t => {
    t.true(auth_engine.match_role(connect_token, 'pipi'))
    t.notThrows(() => auth_engine.remove_role('admin', 'pipi'))
    t.false(auth_engine.match_role(connect_token, 'pipi'))
    t.throws(() => auth_engine.remove_role('admin', 'pipi'))
})

test.serial('delete user', t => {
    t.true(auth_engine.user_exists('caca'))
    t.notThrows(() => auth_engine.delete_user('caca'))
    t.false(auth_engine.user_exists('caca'))
})

// ---------------------------------------- KEY ENGINE

const key_engine = require('./key_engine')

// -------- BASE KEYS

test.serial('key exists', t => {
    t.false(key_engine.exists('my_key'))
})

test.serial('create key', t => {
    t.notThrows(() => key_engine.set('my_key', { hello: 'world' }))
    t.true(key_engine.exists('my_key'))
})

test.serial('get key', t => {
    let key_data = null
    t.notThrows(() => key_data = key_engine.get('my_key'))
    t.is(key_data.hello, 'world')
    t.throws(() => key_engine.get('caca'))
})

test.serial('remove key', t => {
    t.true(key_engine.exists('my_key'))
    t.notThrows(() => key_engine.remove('my_key'))
    t.false(key_engine.exists('my_key'))
    t.throws(() => key_engine.remove('my_key'))
})

// -------- NOTIFIER

test.serial('subscribe to create key', t => {
    let not_event = null
    let not_data = null
    function notifier(event, data) {
        not_event = event
        not_data = data
    }
    t.notThrows(() => key_engine.subscribe_to('not_key', ['create'], notifier))
    t.throws(() => key_engine.subscribe_to('not_key', ['create'], notifier))
    t.notThrows(() => key_engine.set('not_key', { hello: 'world' }))
    t.is(not_event, 'create')
    t.is(not_data.hello, 'world')
})

test.serial('subscribe to update key', t => {
    let not_event = null
    let not_data = null
    function notifier(event, data) {
        not_event = event
        not_data = data
    }
    t.notThrows(() => key_engine.subscribe_to('not_key', ['set'], notifier))
    t.notThrows(() => key_engine.set('not_key', { hello: 'world' }))
    t.is(not_event, null)
    t.is(not_data, null)
    t.notThrows(() => key_engine.set('not_key', { hello: 'earth' }))
    t.is(not_event, 'set')
    t.is(not_data.hello, 'earth')
})

test.serial('subscribe to delete key', t => {
    let not_event = null
    let not_data = null
    function notifier(event, data) {
        not_event = event
        not_data = data
    }
    t.notThrows(() => key_engine.subscribe_to('not_key', ['delete'], notifier))
    t.notThrows(() => key_engine.set('not_key', { hello: 'world' }))
    t.is(not_event, null)
    t.is(not_data, null)
    t.notThrows(() => key_engine.remove('not_key'))
    t.is(not_event, 'delete')
    t.is(not_data, null)
})

test.serial('subscribe to all key events', t => {
    let not_event = null
    let not_data = null
    function notifier(event, data) {
        not_event = event
        not_data = data
    }
    t.notThrows(() => key_engine.subscribe_to('not_key2', ['create', 'set', 'delete'], notifier))
    t.notThrows(() => key_engine.set('not_key2', { hello: 'monde' }))
    t.is(not_event, 'create')
    t.is(not_data.hello, 'monde')
    t.notThrows(() => key_engine.set('not_key2', { hello: 'world' }))
    t.is(not_event, 'set')
    t.is(not_data.hello, 'world')
    t.notThrows(() => key_engine.remove('not_key2'))
    t.is(not_event, 'delete')
    t.is(not_data, null)
})

test.serial('unsubscribe', t => {
    let not_event = null
    let not_data = null
    function notifier(event, data) {
        not_event = event
        not_data = data
    }
    t.notThrows(() => key_engine.subscribe_to('not_key3', ['create', 'set'], notifier))
    t.notThrows(() => key_engine.set('not_key3', { hello: 'monde' }))
    t.is(not_event, 'create')
    t.is(not_data.hello, 'monde')
    t.notThrows(() => key_engine.set('not_key3', { hello: 'world' }))
    t.is(not_event, 'set')
    t.is(not_data.hello, 'world')
    not_event = null
    not_data = null
    t.notThrows(() => key_engine.unsubscribe_to('not_key3', ['create', 'set'], notifier))
    t.notThrows(() => key_engine.set('not_key3', { hello: 'earth' }))
    t.is(not_event, null)
    t.is(not_data, null)
    t.notThrows(() => key_engine.set('not_key3', { hello: 'world' }))
    t.is(not_event, null)
    t.is(not_data, null)
    t.notThrows(() => key_engine.remove('not_key3'))
    t.is(not_event, null)
    t.is(not_data, null)
})

// ---------------------------------------- MIDDLEWARE ENGINE

const kam = require('./key_auth_middleware')

let auth_token = null

test.serial('kam connect', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
})

test.serial('kam create key', async t => {
    t.notThrows(() => kam.set(auth_token, 'custom_kam_key', { hello: 'world' }))
    t.throws(() => kam.set('coco', 'custom_kam_key', { hello: 'world' }))
})

test.serial('kam read key', async t => {
    let data = null
    t.notThrows(() => data = kam.get(auth_token, 'custom_kam_key'))
    t.is(data.hello, 'world')
})

test.serial('kam cannot read key', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => data = kam.get(auth_token, 'custom_kam_key'))
})

test.serial('kam add access', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => data = kam.get(auth_token, 'custom_kam_key'))
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
    t.notThrows(() => kam.add_access(auth_token, 'custom_kam_key', 'get', 'admin'))
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.notThrows(() => data = kam.get(auth_token, 'custom_kam_key'))
})

test.serial('kam remove access', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.notThrows(() => data = kam.get(auth_token, 'custom_kam_key'))
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
    t.notThrows(() => kam.remove_access(auth_token, 'custom_kam_key', 'get', 'admin'))
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => data = kam.get(auth_token, 'custom_kam_key'))
})

test.serial('kam cannot remove owner access', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
    t.throws(() => kam.remove_access(auth_token, 'custom_kam_key', 'get', 'guest'))
})

test.serial('kam set access public', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => data = kam.get(auth_token, 'custom_kam_key'))
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
    t.notThrows(() => kam.set_public_access(auth_token, 'custom_kam_key', 'get'))
    t.throws(() => kam.set_public_access(auth_token, 'custom_kam_key', 'get'))
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.notThrows(() => data = kam.get(auth_token, 'custom_kam_key'))
})

test.serial('kam set access private', async t => {
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.notThrows(() => data = kam.get(auth_token, 'custom_kam_key'))
    t.notThrows(() => auth_token = auth_engine.connect('guest', 'guest'))
    t.notThrows(() => kam.set_private_access(auth_token, 'custom_kam_key', 'get'))
    t.throws(() => kam.set_private_access(auth_token, 'custom_kam_key', 'get'))
    t.notThrows(() => auth_token = auth_engine.connect('admin', 'admin'))
    t.throws(() => data = kam.get(auth_token, 'custom_kam_key'))
})

// ---------------------------------------- SERVER

const fetch = require('node-fetch')

let cookies = {}

async function send(url, method = 'GET', data = null, token = null, get_resp = false) {
    url = 'http://localhost:3000' + url
    const cookie = Object.entries(cookies).map(([n, v]) => n + '=' + v).join('; ')
    const options = {
        method,
        headers: {
            'Authorization': token,
            'content-type': data ? 'application/json' : '',
            cookie,
        },
        body: data ? JSON.stringify(data) : undefined
    }
    const resp = await fetch(url, options)
    if (!resp.ok) {
        const err = new Error(await resp.text())
        err.status = resp.status
        throw err
    }
    const set_cookies = resp.headers.get('set-cookie')
    const cookies_to_add = Object.fromEntries(set_cookies?.split('; ').map(e => e.split('=')) ?? [])
    cookies = { ...cookies, ...cookies_to_add }
    if (get_resp) return resp
    const json = await resp.json()
    return json
}

const { io } = require('socket.io-client')

function connect_admin_socket(token, cb = () => { }, auth_success_cb = () => { }, auth_fail_cb = () => { }) {
    const client = io('ws://localhost:3000')
    client.on('update', ({ key, event, data }) => {
        cb(key, event, data)
    })
    client.on('auth_success', auth_success_cb)
    client.on('auth_fail', auth_fail_cb)
    client.emit('auth', token)
    return client
}

let listening_server = null

test.serial('setup server', async (t) => {
    const server = require('./server')
    listening_server = await server(3000)
    t.pass()
})

// -------- AUTH

test.serial('server connect', async t => {
    t.false(cookies.db_auth != null)
    t.true(await send('/api/auth/connect', 'post', { conn: 'admin', pass: 'admin' }, null) != null)
    t.true(cookies.db_auth != null)
    t.is(cookies.Path, undefined)
})

test.serial('server is connected', async t => {
    t.true(await send('/api/auth/connect', 'get'))
})

test.serial('server disconnect', async t => {
    t.true(await send('/api/auth/connect', 'get'))
    t.true(await send('/api/auth/connect', 'delete'))
    t.false(await send('/api/auth/connect', 'get'))
    await t.throwsAsync(() => send('/api/auth/connect', 'delete'))
})

test.serial('server roles', async t => {
    await send('/api/auth/connect', 'post', { conn: 'admin', pass: 'admin' }, null)
    const roles = await send('/api/auth/roles')
    t.is(roles.length, 1)
    t.is(roles[0], 'admin')
})

test.serial('server user data', async t => {
    const user = await send('/api/auth/')
    t.is(user.fname, 'admin')
    t.is(user.conn, 'admin')
})

test.serial('server admin create user', async t => {
    t.false(await send('/api/auth/admin/exists/popo'))
    await t.notThrowsAsync(() => send('/api/auth/admin/create', 'post', { conn: 'popo', fname: 'popo', lname: 'popo', pass: 'popo' }))
    t.true(await send('/api/auth/admin/exists/popo'))
})

test.serial('server connect new', async t => {
    await send('/api/auth/connect', 'post', { conn: 'popo', pass: 'popo' }, null)
    const user = await send('/api/auth/')
    t.is(user.fname, 'popo')
    t.is(user.conn, 'popo')
})

test.serial('server no admin', async t => {
    await t.throwsAsync(() => send('/api/auth/admin/list'))
})

test.serial('server add role', async t => {
    await send('/api/auth/connect', 'post', { conn: 'admin', pass: 'admin' }, null)
    const roles = await send('/api/auth/admin/role/popo')
    t.is(roles.length, 0)
    await t.notThrowsAsync(() => send('/api/auth/admin/role/popo/admin', 'put'))
    const roles2 = await send('/api/auth/admin/role/popo')
    t.is(roles2.length, 1)
    t.is(roles2[0], 'admin')
})

test.serial('server connect new now admin', async t => {
    await send('/api/auth/connect', 'post', { conn: 'popo', pass: 'popo' }, null)
    await t.notThrowsAsync(() => send('/api/auth/admin/list'))
})

test.serial('server remove role', async t => {
    await send('/api/auth/connect', 'post', { conn: 'admin', pass: 'admin' }, null)
    await t.notThrowsAsync(() => send('/api/auth/admin/role/popo/admin', 'delete'))
    const roles = await send('/api/auth/admin/role/popo')
    t.is(roles.length, 0)
})

test.serial('server connect new now not admin', async t => {
    await send('/api/auth/connect', 'post', { conn: 'popo', pass: 'popo' }, null)
    await t.throwsAsync(() => send('/api/auth/admin/list'))
})

// -------- KEYS

function connect_admin() {
    return send('/api/auth/connect', 'post', { conn: 'admin', pass: 'admin' }, null)
}
function connect_guest() {
    return send('/api/auth/connect', 'post', { conn: 'guest', pass: 'guest' }, null)
}
function disconnect() {
    return send('/api/auth/connect', 'delete')
}

test.serial('key server create', async t => {
    await connect_admin()
    await t.notThrowsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'world' }))
})

test.serial('key server read', async t => {
    await connect_admin()
    const data = await send('/api/key/custom_admin_key', 'get')
    t.is(data.hello, 'world')
})

test.serial('key server set', async t => {
    await connect_admin()
    await t.notThrowsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'poupou' }))
    await connect_guest()
    await t.throwsAsync(() => send('/api/key/custom_admin_key'))
})

test.serial('key server set access', async t => {
    await connect_guest()
    await t.throwsAsync(() => send('/api/key/custom_admin_key'))
    await connect_admin()
    await t.notThrowsAsync(() => send('/api/key/access/custom_admin_key/get/guest', 'put'))
    await connect_guest()
    await t.notThrowsAsync(() => send('/api/key/custom_admin_key'))
})

test.serial('key server set access public', async t => {
    await disconnect()
    await t.throwsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'caca' }))
    await connect_admin()
    await t.notThrowsAsync(() => send('/api/key/public_access/custom_admin_key/set', 'put'))
    await disconnect()
    await t.notThrowsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'prouteprtou' }))
})

test.serial('key server set access private', async t => {
    await t.notThrowsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'popo' }))
    await connect_admin()
    const data = await send('/api/key/custom_admin_key', 'get')
    t.is(data.hello, 'popo')
    await t.notThrowsAsync(() => send('/api/key/public_access/custom_admin_key/set', 'delete'))
    await disconnect()
    await t.throwsAsync(() => send('/api/key/custom_admin_key', 'put', { hello: 'ôpoez' }))
})

// -------- SOCKET

const wait = (ms) => new Promise(ok => setTimeout(ok, ms))

test.serial('socket client connect', async t => {
    const admin_token = await connect_admin()
    let auth_validated = null
    let auth_failed = null
    t.notThrows(() => connect_admin_socket(admin_token, () => { }, () => { auth_validated = true }, () => { auth_failed = true }))
    await wait(500)
    t.true(auth_validated)
    t.is(auth_failed, null)
})

test.serial('socket create key', async t => {
    const admin_token = await connect_admin()
    let soc_key = null
    let soc_event = null
    let soc_data = null
    connect_admin_socket(admin_token, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await wait(100)
    await t.notThrowsAsync(() => send('/api/key/custom_soc_key', 'put', { hello: 'world' }))
    await wait(100)
    t.is(soc_key, 'custom_soc_key')
    t.is(soc_event, 'create')
    t.is(soc_data.hello, 'world')
})

test.serial('socket update key', async t => {
    const admin_token = await connect_admin()
    let soc_key = null
    let soc_event = null
    let soc_data = null
    connect_admin_socket(admin_token, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await wait(100)
    await t.notThrowsAsync(() => send('/api/key/custom_soc_key', 'put', { hello: 'poupou' }))
    await wait(500)
    t.is(soc_key, 'custom_soc_key')
    t.is(soc_event, 'set')
    t.is(soc_data.hello, 'poupou')
})

test.serial('socket delete key', async t => {
    const admin_token = await connect_admin()
    let soc_key = null
    let soc_event = null
    let soc_data = 'avant'
    connect_admin_socket(admin_token, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await wait(100)
    await t.notThrowsAsync(() => send('/api/key/custom_soc_key', 'delete'))
    await wait(500)
    t.is(soc_key, 'custom_soc_key')
    t.is(soc_event, 'delete')
    t.is(soc_data, null)
})

test.serial('socket public key', async t => {
    await disconnect()
    let soc_key = null
    let soc_event = null
    let soc_data = null
    connect_admin_socket(null, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await wait(100)
    await t.notThrowsAsync(() => send('/api/key/a_public_key', 'put', { hello: 'crotte' }))
    await wait(500)
    t.is(soc_key, 'a_public_key')
    t.is(soc_event, 'create')
    t.is(soc_data.hello, 'crotte')
})

test.serial('socket private key', async t => {
    await connect_admin()
    let soc_key = null
    let soc_event = null
    let soc_data = null
    connect_admin_socket(null, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await wait(100)
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'world' }))
    await wait(100)
    t.is(soc_key, null)
    t.is(soc_event, null)
    t.is(soc_data, null)
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'proute' }))
    await wait(100)
    t.is(soc_key, null)
    t.is(soc_event, null)
    t.is(soc_data, null)
    await t.notThrowsAsync(() => send('/api/key/public_access/a_private_key/get', 'put'))
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'pupu' }))
    await wait(100)
    t.is(soc_key, 'a_private_key')
    t.is(soc_event, 'set')
    t.is(soc_data.hello, 'pupu')
    soc_key = null
    soc_event = null
    soc_data = null
    await t.notThrowsAsync(() => send('/api/key/public_access/a_private_key/get', 'delete'))
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'lolo' }))
    await wait(100)
    t.is(soc_key, null)
    t.is(soc_event, null)
    t.is(soc_data, null)
})

test.serial('socket private key give access', async t => {
    const guest_token = await connect_guest()
    let soc_key = null
    let soc_event = null
    let soc_data = null
    connect_admin_socket(guest_token, (key, event, data) => {
        soc_key = key
        soc_event = event
        soc_data = data
    })
    await connect_admin()
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'proute' }))
    await wait(100)
    t.is(soc_key, null)
    t.is(soc_event, null)
    t.is(soc_data, null)
    await t.notThrowsAsync(() => send('/api/key/access/a_private_key/get/guest', 'put'))
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'put', { hello: 'popo' }))
    await wait(100)
    t.is(soc_key, 'a_private_key')
    t.is(soc_event, 'set')
    t.is(soc_data.hello, 'popo')
    soc_key = null
    soc_event = null
    soc_data = null
    await t.notThrowsAsync(() => send('/api/key/access/a_private_key/get/guest', 'delete'))
    await t.notThrowsAsync(() => send('/api/key/a_private_key', 'delete'))
    await wait(100)
    t.is(soc_key, null)
    t.is(soc_event, null)
    t.is(soc_data, null)
})

// ---------------------------------------- END

test.serial.after.always(async () => {
    listening_server.close()
})