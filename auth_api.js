const auth_api = require('express').Router()
module.exports = auth_api

const auth_engine = require('./auth_engine')

const json_parser = require('body-parser').json()

const cookie_secret = process.env.COOKIE_SECRET ?? 'cookie_secret_key-db'
const cookieParser = require('cookie-parser')
auth_api.use(cookieParser(cookie_secret))

const secure_waiter = parseInt(process.env.SECURE_WAITER) ?? 2000

// ------------------------------------------ UTILS

function get_token(req, res, next) {
    const token = req.signedCookies['db_auth']
    req.token = token
    next()
}

function check_admin(req, res, next) {
    get_token(req, res, () => {
        if (!auth_engine.is_admin(req.token)) return res.status(401).send('insufficient roles')
        next()
    })
}

function get_conn(req, res, next) {
    req.conn = req.params.conn
    if (!req.conn) return res.status(400).send('conn data needed')
    next()
}

function get_role(req, res, next) {
    req.role = req.params.role
    if (!req.role) return res.status(400).send('role data needed')
    next()
}

function get_ids(req, res, next) {
    json_parser(req, res, () => {
        const { conn, pass } = req.body
        if (!conn || !pass) return res.status(400).send('authentification coordinates needed')
        req.conn = conn
        req.pass = pass
        next()
    })
}

function wait(ms) {
    return function (req, res, next) {
        setTimeout(next, ms)
    }
}

function check_token(req, res, next) {
    get_token(req, res, () => {
        if (!auth_engine.connected(req.token)) return res.status(401).send('token needed')
        next()
    })
}

function create_reser(func) {
    return function (req, res, next) {
        try {
            let result = func(req, res)
            if (result === undefined) result = true
            res.json(result)
        } catch (e) {
            console.log('request raised:', e.message)
            return res.status(500).send(e.message)
        }
    }
}

// ------------------------------------------ API


// -------------------------- admin

auth_api.get('/admin/list',
    check_admin,
    create_reser(() => auth_engine.list_users()))
auth_api.post('/admin/create',
    check_admin, json_parser,
    create_reser((req) => {
        const { conn, fname, lname, pass } = req.body
        auth_engine.create_user(conn, fname, lname, pass)
    }))
auth_api.get('/admin/exists/:conn',
    check_admin, get_conn,
    create_reser((req) => auth_engine.user_exists(req.conn)))
auth_api.get('/admin/user/:conn',
    check_admin, get_conn,
    create_reser((req) => auth_engine.find_user(req.conn)))
auth_api.delete('/admin/user/:conn',
    check_admin, get_conn,
    create_reser((req) => auth_engine.delete_user(req.conn)))
auth_api.get('/admin/role/:conn/',
    check_admin, get_conn,
    create_reser((req) => auth_engine.get_roles_conn(req.conn)))
auth_api.put('/admin/role/:conn/:role',
    check_admin, get_conn, get_role,
    create_reser((req) => auth_engine.add_role(req.conn, req.role)))
auth_api.delete('/admin/role/:conn/:role',
    check_admin, get_conn, get_role,
    create_reser((req) => auth_engine.remove_role(req.conn, req.role)))

// -------------------------- connect

auth_api.post('/connect',
    wait(secure_waiter), get_ids,
    create_reser((req, res) => {
        const token = auth_engine.connect(req.conn, req.pass)
        res.cookie('db_auth', token, { signed: true, secure: true, path: '' })
        return token
    }))
auth_api.get('/connect',
    get_token,
    create_reser((req) => auth_engine.connected(req.token)))
auth_api.get('/token',
    get_token,
    create_reser((req) => auth_engine.connected(req.token) ? req.token : null))
auth_api.delete('/connect',
    get_token,
    create_reser((req, res) => {
        auth_engine.disconnect(req.token)
        res.clearCookie('db_auth')
        return true
    }))

// -------------------------- user

auth_api.get('/',
    check_token,
    create_reser((req) => auth_engine.get_user(req.token)))
auth_api.post('/',
    check_token, json_parser,
    create_reser((req) => auth_engine.update_user(req.token, req.body)))
auth_api.post('/pass',
    wait(secure_waiter), get_ids,
    create_reser((req) => auth_engine.update_user_pass(req.conn, req.pass, req.body.new_pass)))
auth_api.get('/is_admin',
    get_token,
    create_reser((req) => auth_engine.is_admin(req.token)))

// -------------------------- roles

auth_api.get('/roles',
    check_token,
    create_reser((req) => auth_engine.get_roles(req.token)))