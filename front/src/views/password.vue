<template>
    <v-card :elevation="$is_mobile ? 0 : 3">
        <v-card-title>Change password</v-card-title>
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
                    label="old password"
                    :rules="[v=>v.length>0 || 'required']"
                    v-model="form.pass"
                >
                </v-text-field>
                <v-text-field
                    type="password"
                    label="new password"
                    :rules="[v=>v.length>=8 || 'password must be of lenght 8 at least']"
                    v-model="form.new_pass"
                >
                </v-text-field>
                <v-text-field
                    type="password"
                    label="validate new password"
                    :rules="[(form.validate_pass === form.new_pass) || 'Password must match']"
                    v-model="form.validate_pass"
                >
                </v-text-field>
                <v-btn
                    block
                    @click="send_new_pass"
                    color="primary"
                    :disabled="!form_is_valid"
                >Change password</v-btn>
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
            new_pass: '',
            validate_pass: '',
        }
    }),
    methods: {
        async send_new_pass() {
            try {
                await this.$api.auth.change_password(this.form)
                this.$router.push('/')
            } catch (e) {
                alert('an error occured')
            }
        }
    }
}
</script>

<style>
</style>