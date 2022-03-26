import { io } from 'socket.io-client'

class KEY_API {

    constructor(host = '/', key_api_host = '/api/key') {
        this.socket = io(host)
        this.key_api_host = key_api_host
    }

    auth = {
        connect: (token) => { this.socket.emit('auth', token) },
        disconnect: () => { this.socket.emit('unauth') }
    }

    async __key_api(endpoint, method, data, headers, data_format = 'json') {
        headers = headers ?? {}
        const options = { method, headers }
        if (data) {
            headers['Content-type'] = {
                'json': 'application/json',
                'text': 'text/plain'
            }[data_format] ?? data_format
            options.body = data_format == 'json' ? JSON.stringify(data) : data
        }
        const resp = await fetch(this.key_api_host + '/' + endpoint, options)
        if (!resp.ok) throw new Error(await resp.text())
        if (resp.headers.get('content-type').includes('application/json')) return await resp.json()
        return await resp.text()
    }

    exists(key) {
        return this.__key_api(key + '/exists')
    }

    set(key, data = {}) {
        return this.__key_api(key, 'put', data)
    }

    delete(key) {
        return this.__key_api(key, 'delete')
    }

    get(key) {
        return this.__key_api(key)
    }

    listen(cb) {
        this.socket.on('update', ({ key, event, data }) => {
            cb(key, event, data)
        })
    }

    // ----------------- INSTALLER

    install(vue) {
        const tthis = this
        vue.mixin({
            beforeCreate() {
                this.$key_api = tthis
                this.$key_binder = async (key_name, object_path) => {
                    const key_content = await tthis.get(key_name)

                    const path_elms = object_path.split('.')
                    const root_elms = [...path_elms]
                    const prop = root_elms.pop()
                    let root_obj = this
                    root_elms.forEach(elm => root_obj = root_obj[elm])

                    const set = (data) => {
                        this.$set(root_obj, prop, data)
                    }

                    set(key_content)

                    let last_version = key_content
                    tthis.listen((key, event, data) => {
                        if (key != key_name) return
                        if (event == 'set') {
                            last_version = JSON.parse(JSON.stringify(data))
                            set(data)
                        }
                        if (event == 'delete') this.$delete(root_obj, prop)
                    })

                    let set_to = null
                    this.$watch(() => root_obj[prop], (val) => {
                        clearTimeout(set_to)
                        set_to = setTimeout(async () => {
                            try {
                                await tthis.set(key_name, val)
                            } catch (e) {
                                this.$set(obj, prop, JSON.parse(JSON.stringify(last_version)))
                            }
                        }, 100)
                    }, { deep: true })
                }
            },
        })
    }

}

export default (host) => new KEY_API(host)