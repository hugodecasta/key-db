const auth_engine = require('./auth_engine')
const key_engine = require('./key_engine')

const key_auth_middleware = {}
module.exports = key_auth_middleware

// ------------------------------------------ UTILS

function is_public_access(key_data, access) {
    return !key_data.access[access]
}

function has_access(key_data, access, conn) {
    if (key_data.owner == conn) return true
    const allowed = key_data.access[access]
    return !allowed || allowed.includes(conn)
}

function token_has_access_data(token, key_data, access) {
    if (is_public_access(key_data, access)) return true
    const { conn } = auth_engine.get_user(token)
    return has_access(key_data, access, conn)
}

function token_has_access(token, key, access) {
    const key_data = key_engine.get(key)
    if (is_public_access(key_data, access)) return true
    if (!token) return false
    const { conn } = auth_engine.get_user(token)
    return has_access(key_data, access, conn)
}

function check_access(key_data, access, conn) {
    if (!has_access(key_data, access, conn)) throw new Error('insufficiant rights')
    return true
}

function check_token_access(token, key, access) {
    if (!token_has_access(token, key, access)) throw new Error('insufficiant rights')
    return true
}

// ------------------------------------------ MODULE

// -------------------------- base

key_auth_middleware.has_access = token_has_access
key_auth_middleware.has_access_data = token_has_access_data

// -------------------------- base

key_auth_middleware.exists = (key) => {
    return key_engine.exists(key)
}

key_auth_middleware.set = (token, key, data) => {
    let conn = null
    if (auth_engine.connected(token)) conn = auth_engine.get_user(token).conn
    if (key_engine.exists(key)) {
        check_token_access(token, key, 'set')
        const content = data
        data = { ...key_engine.get(key) }
        data.content = content
    } else {
        const access = {}
        if (conn) {
            access.set = [conn]
            access.get = [conn]
            access.delete = [conn]
            access.set_access = [conn]
        }
        data = { owner: conn, access, content: data }
    }
    return key_engine.set(key, data)
}

key_auth_middleware.get = (token, key) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    check_token_access(token, key, 'get')
    return key_engine.get(key).content
}

key_auth_middleware.delete = (token, key) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    check_token_access(token, key, 'delete')
    return key_engine.remove(key)
}

key_auth_middleware.add_access = (token, key, access, conn_to_add) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    check_token_access(token, key, 'set_access')
    const key_data = key_engine.get(key)
    if (has_access(key_data, access, conn_to_add)) throw new Error('user already have access')
    key_data.access[access] ??= []
    key_data.access[access].push(conn_to_add)
    return key_engine.set(key, key_data)
}

key_auth_middleware.remove_access = (token, key, access, conn_to_add) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    const { conn } = auth_engine.get_user(token)
    if (conn == conn_to_add) throw new Error('cannot remove access from owner')
    check_token_access(token, key, 'set_access')
    const key_data = key_engine.get(key)
    if (!has_access(key_data, access, conn_to_add)) throw new Error('user does not have this access')
    key_data.access[access] ??= []
    const index = key_data.access[access].indexOf(conn_to_add)
    key_data.access[access].splice(index, 1)
    return key_engine.set(key, key_data)
}

key_auth_middleware.set_public_access = (token, key, access) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    check_token_access(token, key, 'set_access')
    const key_data = key_engine.get(key)
    if (!key_data.access[access]) throw new Error('access already public')
    delete key_data.access[access]
}

key_auth_middleware.set_private_access = (token, key, access) => {
    if (!key_engine.exists(key)) throw new Error('key not found')
    check_token_access(token, key, 'set_access')
    const key_data = key_engine.get(key)
    if (key_data.access[access]) throw new Error('access already private')
    key_data.access[access] = [key_data.owner]
}

key_auth_middleware.is_public_access = (key, access) => {
    const key_data = key_engine.get(key)
    return !key_data.access[access]
}

// -------------------------- notifier

key_auth_middleware.subscribe = (cb) => {
    key_engine.subscribe_all((key, event, data, before_delete) => {
        cb(key, event, data?.content ?? null, before_delete?.content)
    })
}

key_auth_middleware.subscribe_user = (token, cb) => {
    key_engine.subscribe_all((key, event, data, before_delete) => {
        const { conn } = auth_engine.get_user(token)
        if (!has_access(data ?? before_delete, 'get', conn)) return
        if (event == 'delete') return cb(key, 'delete', null)
        cb(key, event, data.content)
    })
}