<template>
    <v-card
        v-if="user"
        :elevation="$is_mobile ? 0 : 3"
    >
        <v-card-title>
            <v-icon
                left
                color="primary"
            >mdi-shield</v-icon>Admin @{{user.conn}}
        </v-card-title>
        <v-card-text>
            <v-btn
                color="primary"
                block
                @click="add_user"
            >
                <v-icon left>mdi-plus</v-icon>user
            </v-btn>
            <v-expansion-panels>
                <v-expansion-panel
                    v-for="user in list"
                    :key="user.id"
                >
                    <v-expansion-panel-header>
                        {{user.fname}} {{user.lname}}<v-spacer></v-spacer>@{{user.conn}}
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                        <v-card-title>{{user.fname}} {{user.lname}}</v-card-title>
                        <v-card-subtitle>@{{user.conn}}</v-card-subtitle>
                        <v-card
                            outlined
                            elevation="0"
                        >
                            <v-card-text>
                                <v-btn
                                    text
                                    color="primary"
                                    @click="add_user_role(user.conn)"
                                >
                                    <v-icon left>mdi-plus</v-icon> role
                                </v-btn>
                                <v-list dense>
                                    <v-list-item
                                        v-for="role in user.roles"
                                        :key="role"
                                    >
                                        <v-list-item-action>
                                            <v-btn
                                                icon
                                                @click="delete_user_role(user.conn,role)"
                                            >
                                                <v-icon>mdi-close</v-icon>
                                            </v-btn>
                                        </v-list-item-action>
                                        <v-list-item-title>{{role}}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-card-text>
                        </v-card>
                        <v-divider></v-divider>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                v-if="user.conn != 'admin'"
                                small
                                text
                                color="error"
                                @click="delete_user(user.conn)"
                            >delete</v-btn>
                        </v-card-actions>
                    </v-expansion-panel-content>
                </v-expansion-panel>
            </v-expansion-panels>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data: () => ({
        user: null,
        list: {},
    }),
    methods: {
        async check_error(func) {
            try {
                await func()
            } catch (e) {
                alert('An error occured: ' + e.message)
            }
        },
        async add_user() {
            const conn = prompt('user connector')
            if (!conn) return
            const fname = prompt('user first name')
            if (!fname) return
            const lname = prompt('user last name')
            if (!lname) return
            const pass = prompt('user password')
            if (!pass) return
            const obj = { conn, fname, lname, pass }
            await this.check_error(async () => {
                await this.$api.auth.admin.users.create(obj)
                this.load()
            })
        },
        async delete_user(conn) {
            if (!confirm(`delete user @${conn} ?`)) return
            await this.check_error(async () => {
                await this.$api.auth.admin.users.delete(conn)
                this.load()
            })
        },
        async delete_user_role(conn, role) {
            if (!confirm(`delete user @${conn} role "${role}"?`)) return
            await this.check_error(async () => {
                await this.$api.auth.admin.users.roles.delete(conn, role)
                this.load()
            })
        },
        async add_user_role(conn) {
            const role = prompt('new role name')
            if (!role) return
            await this.check_error(async () => {
                await this.$api.auth.admin.users.roles.add(conn, role)
                this.load()
            })
        },
        async load() {
            if (!await this.$api.auth.connected() || !await this.$api.auth.user.is_admin()) {
                return this.$router.push('/')
            }
            this.user = await this.$api.auth.user.get()
            this.list = await this.$api.auth.admin.users.list()
            console.log(this.list)
        }
    },
    async mounted() {
        this.load()
    }
}
</script>

<style>
</style>