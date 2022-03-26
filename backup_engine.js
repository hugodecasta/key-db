const fs = require('fs')

let trigger = null

module.exports = (path, object, time_to_backup = 5000, object_transformer = null, object_loader = null) => {

    if (process.env.NO_BACKUP) return { trigger: () => { } }

    const dirs = path.split('/')
    const file = dirs.pop()
    const dir = dirs.join('/')

    const is_from_dir = object_transformer != null

    function save() {
        const objects_to_save = object_transformer?.(object) ?? { [file]: { data: object, delete: false } }
        Object.entries(objects_to_save).forEach(([name, { data, delete: del }]) => {
            const full_path = dir + '/' + name
            if (del) return fs.unlinkSync(full_path)
            fs.writeFileSync(full_path, JSON.stringify(data))
        })
    }
    trigger = save

    if (!fs.existsSync(path)) {
        fs.mkdirSync(dirs.join('/'), { recursive: true })
        save()
    }

    function load() {
        if (is_from_dir) {
            const files = fs.readdirSync(dir)
            const file_loaded = Object.fromEntries(files.map(f => [f, JSON.parse(fs.readFileSync(dir + '/' + f))]))
            object_loader(object, file_loaded)
        } else {
            const loaded_object = JSON.parse(fs.readFileSync(path))
            Object.entries(loaded_object).forEach(([key, dat]) => object[key] = dat)
        }
    }

    load()
    save()
    setInterval(save, time_to_backup)

    return { trigger: save }
}