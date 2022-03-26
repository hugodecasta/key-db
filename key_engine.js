// ------------------------------------------ UTILS

// -------------------------- notifier

const notifier_db = {}

function get_key_listener(key) {
    if (!notifier_db[key]) notifier_db[key] = {}
    return notifier_db[key]
}

function get_key_event_listener(key, event) {
    const key_listeners = get_key_listener(key)
    if (!key_listeners[event]) key_listeners[event] = []
    return key_listeners[event]
}

function subscribe_to(key, events, cb) {
    events.forEach(event => {
        const listeners = get_key_event_listener(key, event)
        if (listeners.includes(cb)) throw new Error('already listening')
        listeners.push(cb)
    })
}

function unsubscribe_to(key, events, cb) {
    events.forEach(event => {
        const listeners = get_key_event_listener(key, event)
        const index = listeners.indexOf(cb)
        if (index < 0) throw new Error('callback is not listening')
        listeners.splice(index, 1)
    })
}

const all_notifier_db = []

function subscribe_all(cb) {
    if (all_notifier_db.includes(cb)) throw new Error('already listening')
    all_notifier_db.push(cb)
}

function unsubscribe_all(cb) {
    const index = all_notifier_db.indexOf(cb)
    if (index < 0) throw new Error('callback is not listening')
    all_notifier_db.splice(index, 1)
}

function notify(key, event, data, before_delete = undefined) {
    const listeners = get_key_event_listener(key, event)
    listeners.forEach(cb => cb(event, data, before_delete))
    all_notifier_db.forEach(cb => cb(key, event, data, before_delete))
    if (event == 'delete') key_to_delete.push(key)
    else key_to_update.push(key)
    backup_sys.trigger()
}

// -------------------------- keys

const key_db = {}

let key_to_update = []
let key_to_delete = []

const backup_sys = require('./backup_engine')(__dirname + '/data/keys/', key_db, 5000,
    (object) => {
        const updaters = Object.fromEntries(key_to_update.map(key => [key + '.json', { data: key_db[key] }]))
        const deleters = Object.fromEntries(key_to_delete.map(key => [key + '.json', { data: key_db[key], delete: true }]))
        const savers = { ...updaters, ...deleters }
        key_to_update = []
        key_to_delete = []
        return savers
    },
    (object, loaded) => {
        Object.entries(loaded).forEach(([filename, data]) => key_db[filename.replace('.json', '')] = data)
    }
)

function key_exists(key) {
    return key in key_db
}

function set_key(key, data) {
    const is_create = !key_exists(key)
    let is_upd = false
    if (!is_create) {
        const old_data = key_db[key]
        is_upd = JSON.stringify(data) != JSON.stringify(old_data)
    }
    key_db[key] = data
    if (is_create) notify(key, 'create', data)
    if (is_upd) notify(key, 'set', data)
}

function get_key(key) {
    if (!key_exists(key)) throw new Error(`key ${key} not found`)
    return key_db[key]
}

function remove_key(key) {
    if (!key_exists(key)) throw new Error(`key "${key}" not found`)
    const pas_data = key_db[key]
    notify(key, 'delete', null, pas_data)
    delete key_db[key]
}

// ------------------------------------------ MODULE

const key_engine = {}
module.exports = key_engine

// -------------------------- base

key_engine.exists = key_exists
key_engine.set = set_key
key_engine.get = get_key
key_engine.remove = remove_key

// -------------------------- notifier

key_engine.subscribe_to = subscribe_to
key_engine.unsubscribe_to = unsubscribe_to
key_engine.subscribe_all = subscribe_all
key_engine.unsubscribe_all = unsubscribe_all