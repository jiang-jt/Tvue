// 遍历dom结构，解析指令和插值表达式
class Compile {
    // el-带编译模板 ，vm-vue实例
    constructor(el, vm) {
        this.$vm = vm
        // querySelector():返回文档中匹配指定 CSS 选择器的一个元素。
        this.$el = document.querySelector(el)

        // 把模板中的内容迁移到片段操作
        this.$fragment = this.node2Fragment(this.$el)
        // 对该片段执行编译
        this.compile(this.$fragment)
        // 编译之后，将结果放回到$el中
        this.$el.appendChild(this.$fragment)
    }
    // 把模板中的内容迁移到片段中
    node2Fragment(el) {
        // 创建片段 :可以向其中添加DOM节点以构建屏幕外DOM树。
        const fragment = document.createDocumentFragment()
        let child
        while ((child = el.firstChild)) {
            fragment.appendChild(child)
        }
        return fragment
    }
    // 编译模板
    compile(el) {
        // 获取所有节点，使用forEach对节点遍历，不同节点类型做不同的编译操作，并且要递归遍历子节点
        const childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            if (node.nodeType == 1) { // 元素节点
                console.log('编译元素', node.nodeName)
                this.compileElement(node)
            } else if (this.isInter(node)) { // 文本节点，只关心{{xxx}}
                console.log('编译文本', node.textContent)
                this.compileText(node)
            }

            // 递归编译子节点
            if (node.children && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    //  对文本节点进行处理，我们只关心{{xxx}}的文本
    isInter(node) {
        return node.nodeType == 3 && /\{\{(.*)\}\}/.test(node.textContent)
    }

    //  文本替换
    compileText(node) {
        console.log(RegExp.$1) // 获取{{xxx}}中xxx内容
        const exp = RegExp.$1
        this.update(node, exp, 'text') // v-text
    }

    update(node, exp, dir) {
        const updater = this[dir + 'Updater']
        updater && updater(node, this.$vm[exp]) // 首次初始化

        // 创建Watcher实例，依赖收集完成
        new Watcher(this.$vm, exp, function(value) {
            updater && updater(node, value)
        })
    }

    textUpdater(node, value) {
        node.textContent = value
    }

    htmlUpdater(node, value) {
        node.innerHTML = value
    }

    compileElement(node) {
        // 关心属性
        const nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(attr => {
            const attrName = attr.name
            const exp = attr.value
            if (attrName.indexOf('v-') == 0) {
                // 指令
                const dir = attrName.substring(2) // xxx
                // 执行
                this[dir] && this[dir](node, exp)
            }
        })
    }
    text(node, exp) {
        this.update(node, exp, 'text')
    }
    html(node, exp) {
        this.update(node, exp, 'html')
    }
}

// 把el下的所有节点迁移到一个片段中去，我们对片段进行操作,操作完成之后，再将片段追加到el中去