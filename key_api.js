const key_api = require('express').Router()
module.exports = key_api

const kam = require('./key_auth_middleware')

const json_parser = require('body-parser').json()

const cookie_secret = process.env.COOKIE_SECRET ?? 'cookie_secret_key-db'
const cookieParser = require('cookie-parser')
key_api.use(cookieParser(cookie_secret))

// ------------------------------------------ UTILS

function get_token(req, res, next) {
    const token = req.signedCookies['db_auth']
    if (!token) return res.status(401).send('token needed')
    req.token = token
    next()
}

function get_conn(req, res, next) {
    req.conn = req.params.conn
    if (!req.conn) return res.status(400).send('conn data needed')
    next()
}

function get_key(req, res, next) {
    req.key = req.params.key
    if (!req.key) return res.status(400).send('key name needed')
    next()
}

function check_access(access, only_if_exists = false) {
    return function (req, res, next) {
        if (only_if_exists && !kam.exists(req.key)) return next()
        if (kam.is_public_access(req.key, access)) return next()
        if (!kam.has_access(req.token, req.key, access))
            return res.status(401).send('insufficiant rights')
        next()
    }
}

function get_access(req, res, next) {
    req.access = req.params.access
    if (!req.access) return res.status(400).send('access info needed')
    next()
}

function create_reser(func) {
    return function (req, res, next) {
        try {
            let result = func(req, res)
            if (result === undefined) result = true
            res.json(result)
        } catch (e) {
            console.error(e)
            console.log('request raised:', e.message)
            return res.status(500).send(e.message)
        }
    }
}

// ------------------------------------------ API


// -------------------------- access

key_api.put('/public_access/:key/:access/',
    get_token, get_key, check_access('set_access'), get_access,
    create_reser((req) => kam.set_public_access(req.token, req.key, req.access)))

key_api.delete('/public_access/:key/:access/',
    get_token, get_key, check_access('set_access'), get_access,
    create_reser((req) => kam.set_private_access(req.token, req.key, req.access)))

key_api.put('/access/:key/:access/:conn',
    get_token, get_key, check_access('set_access'), get_access, get_conn,
    create_reser((req) => kam.add_access(req.token, req.key, req.access, req.conn)))

key_api.delete('/access/:key/:access/:conn',
    get_token, get_key, check_access('set_access'), get_access, get_conn,
    create_reser((req) => kam.remove_access(req.token, req.key, req.access, req.conn)))


// -------------------------- base

key_api.get('/:key/exists',
    get_key,
    create_reser((req) => kam.exists(req.key)))

key_api.get('/:key',
    get_token, get_key, check_access('get'),
    create_reser((req) => kam.get(req.token, req.key)))

key_api.put('/:key',
    get_token, get_key, check_access('set', true), json_parser,
    create_reser((req) => kam.set(req.token, req.key, req.body)))

key_api.delete('/:key',
    get_token, get_key, check_access('delete'),
    create_reser((req) => kam.delete(req.token, req.key)))