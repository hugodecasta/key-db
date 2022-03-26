<template>
    <v-card :elevation="$is_mobile ? 0 : 3">
        <v-card-title>Keys playground !</v-card-title>
        <v-card-text>
            <v-text-field
                v-model="key"
                label="key name"
            ></v-text-field>
            <v-progress-circular
                indeterminate
                v-if="key_to"
                color="primary"
            ></v-progress-circular>
            <template v-else-if="key_exists !== null">
                <v-btn
                    v-if="key_exists === false"
                    color="primary"
                    @click="create_key(key)"
                >create</v-btn>
                <template v-else>
                    <b>{{key}}</b>
                    <v-btn
                        color="primary"
                        x-small
                        icon
                        @click="delete_key(key)"
                    >
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                    <v-form v-model="can_send_key_data">
                        <v-row>
                            <v-col>
                                <v-textarea
                                    v-if="key_json"
                                    v-model="key_json"
                                    :rules="[is_json]"
                                    label="key json content"
                                >
                                </v-textarea>
                                <v-btn
                                    :disabled="!can_send_key_data"
                                    color="primary"
                                    @click="send_key"
                                >send<v-icon right>mdi-send</v-icon>
                                </v-btn>
                            </v-col>
                            <v-col>
                                <b>{{key}} data updated</b>
                                <br />
                                {{key_data_upd}}
                            </v-col>
                        </v-row>
                    </v-form>
                </template>
            </template>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data: () => ({

        key: '',
        key_to: null,

        key_exists: null,

        key_json: null,

        can_send_key_data: false,

        key_data_upd: null,

        key_is_public: null,

        is_json: (v) => {
            try {
                JSON.parse(v)
                return true
            } catch (e) {
                return 'not a valid json'
            }
        }

    }),
    watch: {
        key() {
            clearTimeout(this.key_to)
            this.key_to = setTimeout(async () => {
                await this.load_key_data()
                this.key_to = null
            }, 300)
        }
    },
    methods: {
        async load_key_data() {
            this.key_exists = null
            const key_exists = await this.$key_api.exists(this.key)
            if (key_exists) {
                const content = await this.$key_api.get(this.key)
                this.key_json = JSON.stringify(content)
                await this.$key_binder(this.key, 'key_data_upd')
            }
            this.key_exists = key_exists
        },
        async send_key() {
            this.$set(this, 'key_data_upd', JSON.parse(this.key_json))
        },
        async create_key(key) {
            await this.$key_api.set(this.key)
            this.key = key
            this.load_key_data()
        },
        async delete_key(key) {
            await this.$key_api.delete(this.key)
            this.key = key
            this.load_key_data()
        }
    },
    async mounted() {
        const token = await this.$api.auth.get_token()
        await this.$key_api.auth.connect(token)
        // await this.$key_api.listen(this.key_updater)
    }
}
</script>

<style>
</style>