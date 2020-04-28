class Vue {
    constructor(options) {
        // 保存选项
        this.$option = options
        // 传入data
        this.$data = options.data
        //响应化处理
        this.observer(this.$data)

        // 执行编译()
        new Compile(options.el, this)

        // // 测试依赖收集
        // new Watcher(this, 'foo')
        // this.foo // 读一次，触发依赖收集（getter负责依赖收集)
    }

    observer(value) { // 使对象变成可观察的。
        if (!value || typeof value !== 'object') {
            return
        }
        Object.keys(value).forEach(key => {
            // 响应式处理
            //通过遍历所有属性的方式对该对象的每一个属性都通过 defineReactive 处理,以此来达到实现侦测对象变化。
            this.defineReactive(value, key, value[key]) // 数据劫持

            // 代理data中的属性到vue上
            this.proxyData(key) // 数据代理
        })
    }

    // 通过getter进行依赖收集
    // 而每个setter就是一个观察者，在数据更新的时候去通知订阅者更新视图
    defineReactive(obj, key, val) {
        // 递归遍历 属性值为对象的属性。
        this.observer(val)

        // 定义一个Dep 
        const dep = new Dep() // 每个dep实例和data中的key是一对一的关系

        // 给obj每一个key定义拦截
        Object.defineProperty(obj, key, {
            get() {
                // console.log('有人获取了' + key)
                // 依赖收集
                Dep.target && dep.addDep(Dep.target)
                return val
            },
            set(newval) {
                if (val != newval) {
                    // console.log('有人更新了' + key)
                    val = newval
                    // 通过dep去通知watcher更新
                    dep.notify()
                }
            }
        })
    }

    // 代理data中的属性到vue实例上
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newval) {
                this.$data[key] = newval
            }
        })
    }
}

// 创建Dep ,管理所有watcher
class Dep {
    constructor() {
        // 存储所有依赖
        this.watchers = []
    }

    addDep(watcher) {
        this.watchers.push(watcher)
    }

    notify() {
        this.watchers.forEach(watcher => watcher.update())
    }
}

// 创建watcher ：保存data中数值和页面中的挂钩关系
class Watcher {
    constructor(vm, key, cb) {
        // 创建实例时立即将该实例指向Dep.target便于依赖收集
        this.vm = vm
        this.key = key
        this.cb = cb

        // 触发依赖收集
        Dep.target = this
        this.vm[this.key] // 触发一次getter(负责依赖收集)，触发依赖收集
        Dep.target = null

    }
    update() { //更新
        this.cb.call(this.vm, this.vm[this.key])
        // console.log(this.key + '更新了')
    }
}