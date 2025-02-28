// editorMain.js
import editView from './editView.js'
import copyEditor from './copyEditor.js'
import modalEdit from './modalEdit.js'

export default function editorMain() {
  return {
    init() {
      console.log('[EditorMain] Initialising')
      Alpine.data('editView', editView)
      Alpine.data('copyEditor', copyEditor)
      Alpine.data('modalEdit', modalEdit)

      // Fetch HTML
      this.fileFetcher('/html/editor/editView.html', '#edit-view')
      this.fileFetcher('/html/editor/copyEditor.html', '#copy-editor')
      this.fileFetcher('/html/editor/modalEdit.html', '#modal-edit')
    },

    fileFetcher(file, target) {
      fetch(file)
        .then(res => res.text())
        .then(html => {
          const targetElement = document.querySelector(target)

          targetElement.innerHTML = html
          Alpine.initTree(targetElement)
          // Alpine updates dynamically injected content
          Alpine.nextTick(() => {
            console.log(`[EditorMain] Loaded ${file}`)
          })
        })
        .catch(err => console.error('Error fetching file:', err))
    },

    // seeLoadedEffect() {
    //   Alpine.effect(() => {
    //     if (this.loaded) {
    //       console.log('El loaded', this.loaded)
    //     } else {
    //       console.log('El loaded', this.loaded)
    //     }
    //   })
    // },
  }
}
