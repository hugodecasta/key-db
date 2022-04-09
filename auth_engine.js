const hasher = require('string-hash')
const randtoken = require('rand-token')

// ------------------------------------------ UTILS

// -------------------------- hashers

function hash(dat) {
    const hstr = hasher(dat + '')
    return hstr + hasher(hstr)
}

function hash_token(token) {
    hash(token + 'token')
}

function hash_ids(conn, pass) {
    return hash(hash(conn + 'conn') + hash(pass + 'pass') + hash(conn + pass + 'full'))
}

// -------------------------- user manager

const user_db = {}

const backup_sys = require('./backup_engine')(__dirname + '/data/auth/users.json', user_db)

function ids_to_user_id(conn, pass) {
    return hash_ids(conn, pass)
}

function user_exists(user_id) {
    return user_id in user_db
}

function check_user(user_id) {
    if (!user_exists(user_id)) throw new Error('User not found')
}

function check_user_ids(conn, pass) {
    const user_id = ids_to_user_id(conn, pass)
    check_user(user_id)
    return user_id
}

function conn_to_user_id(conn) {
    const user = Object.values(user_db).find(user => user.conn == conn)
    if (!user) throw new Error('conn not found')
    return user.id
}

function conn_exists(conn) {
    return !!Object.values(user_db).find(user => user.conn == conn)
}

function get_user(user_id) {
    check_user(user_id)
    return user_db[user_id]
}

function get_user_conn(conn) {
    return user_db[conn_to_user_id(conn)]
}

function get_user_safe(user_id) {
    const user = get_user(user_id)
    const { conn, fname, lname } = user
    return { conn, fname, lname }
}

function get_roles(user_id) {
    return get_user(user_id).roles
}

function update_user(user_id, user_updates) {
    check_user(user_id)
    const { fnmae, lname } = user_updates
    user_db[user_id] = { ...user_db[user_id], ...{ fnmae, lname } }
    backup_sys.trigger()
}

function add_role(user_id, role) {
    const user = get_user(user_id)
    if (user.roles.includes(role)) throw new Error('user already has that role')
    user.roles.push(role)
    backup_sys.trigger()
}


function remove_role(user_id, role) {
    const user = get_user(user_id)
    const index = user.roles.indexOf(role)
    if (index < 0) throw new Error('user does not have this role')
    user.roles.splice(index, 1)
    backup_sys.trigger()
}

function update_user_pass(conn, pass, new_pass) {
    const user_id = ids_to_user_id(conn, pass)
    const user = get_user(user_id)
    const new_id = ids_to_user_id(conn, new_pass)
    user.id = new_id
    user_db[new_id] = user
    delete user_db[user_id]
    backup_sys.trigger()
}

function create_user(conn, fname, lname, pass, roles = []) {
    if (conn_exists(conn)) throw new Error(`conn "${conn}" already exists`)
    const user_id = (ids_to_user_id(conn, pass))
    const admin_user = { id: user_id, conn, fname, lname, roles }
    user_db[user_id] = admin_user
    backup_sys.trigger()
}

function delete_user(user_id) {
    check_user(user_id)
    delete user_db[user_id]
    backup_sys.trigger()
}

if (Object.keys(user_db).length == 0) {
    create_user('admin', 'admin', 'admin', 'admin', roles = ['admin'])
    create_user('guest', 'guest', 'guest', 'guest', roles = [])
}

// -------------------------- tokens

const token_db = {}
const token_db_reverse = {}

const backup_sys_tokens = require('./backup_engine')(__dirname + '/data/auth/token_db.json', token_db)
const backup_sys_tokens_reverse = require('./backup_engine')(__dirname + '/data/auth/token_db_reverse.json', token_db_reverse)

function trigger_token_backup() {
    backup_sys_tokens.trigger()
    backup_sys_tokens_reverse.trigger()
}

function generate_token() {
    return randtoken.generate(64)
}

function assign_token(id, pass) {
    const user_id = check_user_ids(id, pass)
    const token = generate_token()
    token_db[token] = user_id
    token_db_reverse[user_id] ??= []
    token_db_reverse[user_id].push(token)
    trigger_token_backup()
    return token
}

function token_exists(token) {
    return !!token_db[token]
}

function token_is_valid(token) {
    return token_exists(token) && user_exists(token_db[token])
}

function get_connected_token_user_id(token) {
    if (!token_exists(token)) throw new Error('user is not connected')
    const user_id = token_db[token]
    if (!user_exists(user_id)) {
        clear_token(token)
        trigger_token_backup()
        throw new Error('user do not exist anymore')
    }
    return user_id
}

function clear_token(token) {
    const user_id = get_connected_token_user_id(token)
    const tokens = token_db_reverse[user_id]
    tokens.forEach(token => delete token_db[token])
    delete token_db_reverse[user_id]
    trigger_token_backup()
}

// ------------------------------------------ MODULE

const auth_engine = {}
module.exports = auth_engine

// -------------------------- admin

auth_engine.is_admin = (token) => auth_engine.match_role(token, 'admin')
auth_engine.user_exists = (conn) => conn_exists(conn)
auth_engine.find_user = (conn) => get_user_conn(conn)
auth_engine.list_users = () => user_db
auth_engine.create_user = create_user
auth_engine.delete_user = (conn) => delete_user(conn_to_user_id(conn))
auth_engine.get_roles_conn = (conn) => get_roles(conn_to_user_id(conn))
auth_engine.add_role = (conn, role) => add_role(conn_to_user_id(conn), role)
auth_engine.remove_role = (conn, role) => remove_role(conn_to_user_id(conn), role)

// -------------------------- connect

auth_engine.connect = (conn, pass) => assign_token(conn, pass)
auth_engine.connected = (token) => token_is_valid(token)
auth_engine.disconnect = (token) => clear_token(token)

// -------------------------- user

auth_engine.get_full_user = (token) => get_user(get_connected_token_user_id(token))
auth_engine.get_user = (token) => get_user_safe(get_connected_token_user_id(token))
auth_engine.update_user = (token, user) => update_user(get_connected_token_user_id(token), user)
auth_engine.update_user_pass = update_user_pass

// -------------------------- roles

auth_engine.get_roles = (token) => get_roles(get_connected_token_user_id(token))
auth_engine.match_role = (token, role) => get_roles(get_connected_token_user_id(token)).includes(role)