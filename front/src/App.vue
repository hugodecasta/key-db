<template>
    <v-app>
        <v-container
            style="max-width:500px"
            fill-height
            fluid
        >
            <v-row
                align="center"
                justify="center"
            >
                <v-col>
                    <router-view />
                </v-col>
            </v-row>
        </v-container>
    </v-app>
</template>

<script>

export default {
    name: 'App',

    data: () => ({
        //
    }),
};
</script>
