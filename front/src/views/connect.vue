<template>
    <v-card :elevation="$is_mobile ? 0 : 3">
        <v-card-title>Connect</v-card-title>
        <v-card-text>
            <v-form v-model="form_is_valid">
                <v-text-field
                    label="connector"
                    :rules="[v=>v.length>0 || 'required']"
                    v-model="form.conn"
                >
                </v-text-field>
                <v-text-field
                    type="password"
                    label="password"
                    :rules="[v=>v.length>0 || 'required']"
                    v-model="form.pass"
                >
                </v-text-field>
                <v-btn
                    block
                    @click="connect"
                    color="primary"
                    :disabled="!form_is_valid"
                >connect</v-btn>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script>
export default {
    data: () => ({
        form_is_valid: false,
        form: {
            conn: '',
            pass: '',
        }
    }),
    methods: {
        async connect() {
            const token = await this.$api.auth.connect(this.form)
            console.log(token)
        }
    }
}
</script>

<style>
</style>