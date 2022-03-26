<template>
    <v-btn
        block
        v-if="connected===false"
        color="primary"
        to="/connect"
    >connect</v-btn>
    <v-card
        v-else-if="connected === true && user"
        :elevation="$is_mobile ? 0 : 3"
    >
        <v-card-title>Welcome {{user.fname}} {{user.lname}}</v-card-title>
        <v-card-subtitle>@{{user.conn}}</v-card-subtitle>
        <v-card-actions>
            <v-btn
                v-if="is_admin"
                color="primary"
            >
                <v-icon left>mdi-shield</v-icon>Admin
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
                text
                small
                color="primary"
            >disconnect</v-btn>
        </v-card-actions>
    </v-card>
    <v-progress-linear
        v-else
        indeterminate
        color="primary"
    ></v-progress-linear>
</template>

<script>
export default {
    data: () => ({
        connected: null,
        user: null,
        is_admin: false,
    }),
    async mounted() {
        this.connected = await this.$api.auth.connected()
        if (this.connected) {
            this.user = await this.$api.auth.user.get()
            this.is_admin = await this.$api.auth.user.is_admin()
        }
    }
}
</script>

<style>
</style>