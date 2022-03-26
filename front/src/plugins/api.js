import Vue from 'vue'

// ----------------------------------------------------- MAIN API CLASS

class APIS {

    constructor() {
        this.credentials = null
    }

    // ----------------- INSTALLER

    install() {
        const apis = this
        Vue.mixin({
            beforeCreate() {
                this.$api = apis
            },
        })
    }


    // ----------------- UTILS

    __get_cookie(key) {
        return Object.fromEntries(document.cookie.split('; ').map(cd => cd.split('=')))[key]
    }

    // ----------------- INNER API CALLERS
    
    
    
    async __auth_user_api(endpoint, method, data, headers, data_format = 'json') {
        headers = headers ?? {}
        const options = { method, headers }
        if (data) {
            headers['Content-type'] = {
                'json': 'application/json',
                'text': 'text/plain'
            }[data_format] ?? data_format
            options.body = data_format == 'json' ? JSON.stringify(data) : data
        }
        const url = ["/api/auth", endpoint].join('/')
        const resp = await fetch(url, options)
        if (!resp.ok) throw new Error(await resp.text())
        if (resp.headers.get('content-type').includes('application/json')) return await resp.json()
        return await resp.text()
    }
    
    
    
    
    async __users_roles_api(endpoint, method, data, headers, data_format = 'json') {
        headers = headers ?? {}
        const options = { method, headers }
        if (data) {
            headers['Content-type'] = {
                'json': 'application/json',
                'text': 'text/plain'
            }[data_format] ?? data_format
            options.body = data_format == 'json' ? JSON.stringify(data) : data
        }
        const url = ["/api/auth", "admin", endpoint].join('/')
        const resp = await fetch(url, options)
        if (!resp.ok) throw new Error(await resp.text())
        if (resp.headers.get('content-type').includes('application/json')) return await resp.json()
        return await resp.text()
    }
    async __admin_users_api(endpoint, method, data, headers, data_format = 'json') {
        headers = headers ?? {}
        const options = { method, headers }
        if (data) {
            headers['Content-type'] = {
                'json': 'application/json',
                'text': 'text/plain'
            }[data_format] ?? data_format
            options.body = data_format == 'json' ? JSON.stringify(data) : data
        }
        const url = ["/api/auth", "admin", endpoint].join('/')
        const resp = await fetch(url, options)
        if (!resp.ok) throw new Error(await resp.text())
        if (resp.headers.get('content-type').includes('application/json')) return await resp.json()
        return await resp.text()
    }
    
    async __auth_api(endpoint, method, data, headers, data_format = 'json') {
        headers = headers ?? {}
        const options = { method, headers }
        if (data) {
            headers['Content-type'] = {
                'json': 'application/json',
                'text': 'text/plain'
            }[data_format] ?? data_format
            options.body = data_format == 'json' ? JSON.stringify(data) : data
        }
        const url = ["/api/auth", endpoint].join('/')
        const resp = await fetch(url, options)
        if (!resp.ok) throw new Error(await resp.text())
        if (resp.headers.get('content-type').includes('application/json')) return await resp.json()
        return await resp.text()
    }
    
    
    
    // ----------------- EXTERNAL CALLERS
    
    auth = {
        connected: () => {
            const headers = null
            return this.__auth_api("connect", "get", null, headers, null)
        },
        connect: (data = null) => {
            const headers = null
            return this.__auth_api("connect", "post", data, headers, "json")
        },
        change_password: (data = null) => {
            const headers = null
            return this.__auth_api("pass", "post", data, headers, "json")
        },
        
        user: {
            disconnect: () => {
                const headers = null
                return this.__auth_user_api("connect", "delete", null, headers, null)
            },
            get: () => {
                const headers = null
                return this.__auth_user_api("", "get", null, headers, null)
            },
            is_admin: () => {
                const headers = null
                return this.__auth_user_api("is_admin", "get", null, headers, null)
            },
            
        },
        
        admin: {
            
            
            users: {
                create: (data = null) => {
                    const headers = null
                    return this.__admin_users_api("create", "post", data, headers, "json")
                },
                delete: (conn) => {
                    const headers = null
                    return this.__admin_users_api("user/" + conn, "delete", null, headers, null)
                },
                list: () => {
                    const headers = null
                    return this.__admin_users_api("list", "get", null, headers, null)
                },
                
                roles: {
                    add: (conn, role) => {
                        const headers = null
                        return this.__users_roles_api("role/" + conn + "/" + role, "put", null, headers, null)
                    },
                    delete: (conn, role) => {
                        const headers = null
                        return this.__users_roles_api("role/" + conn + "/" + role, "delete", null, headers, null)
                    },
                    
                },
            },
        },
    }
    
    keys = {
        
        
    }
}

// ----------------------------------------------------- VUE INSTALL

const apis = new APIS()
Vue.use(apis)