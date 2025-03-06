export default function childEditView() {
  return {
    html: '',
    init() {
      console.log('[childEditView] Initialising')
      fetch('/html/editor/childEditView.html')
        .then(res => {
          if (!res.ok) throw new Error(`Bad html fetch ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
        })
        .catch(err => console.error(err))
    },
  }
}
