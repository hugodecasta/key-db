import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

Vue.use(Vuetify)

export default new Vuetify({
    icons: {
        iconfont: 'mdiSvg'
    },
    theme: {
        dark: false,
        themes: {
            light: {
                primary: '#000000',
                background: '#FFFFFF',
                secondary: '#282828',
                accent: '#000000',
                error: '#FF5252',
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FFC107',
            },
            dark: {
                primary: '#FFFFFF',
                background: '#000000',
                secondary: '#DDDDDD',
                accent: '#000000',
                error: '#FF5252',
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FFC107',
            }
        },
        options: { customProperties: true },
    },
})
