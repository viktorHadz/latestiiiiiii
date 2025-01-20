export default function itemEditor() {
  return {
    slideOverOpen: false,
    htmlSlideOver: '',
    modalStyle: false,
    modalSample: false,
    search: '',
    item: {
      name: '',
      price: null,
      time: null,
    },

    tabSelected: 1,

    init() {
      this.$nextTick(() => {
        const firstTab = this.$refs.tabButtons?.firstElementChild
        if (firstTab) {
          this.tabSelected = parseInt(firstTab.id)
          this.tabRepositionMarker(firstTab)
        }
      })
    },

    tabButtonClicked(tabButton) {
      this.tabSelected = parseInt(tabButton.id)
      this.tabRepositionMarker(tabButton)
    },

    tabRepositionMarker(tabButton) {
      if (tabButton) {
        this.$refs.tabMarker.style.width = `${tabButton.offsetWidth}px`
        this.$refs.tabMarker.style.height = `${tabButton.offsetHeight}px`
        this.$refs.tabMarker.style.left = `${tabButton.offsetLeft}px`
      }
    },

    tabContentActive(tabId) {
      return this.tabSelected === tabId
    },

    editingId: null,

    startEditing(itemId) {
      this.editingId = itemId
    },

    stopEditing() {
      this.editingId = null
    },

    async loadHtmlSlideOver() {
      try {
        const response = await fetch('/html/itemEditor.html')
        if (response.ok) {
          const html = await response.text()
          this.$refs.slideOverContainer.innerHTML = html
        } else {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
      } catch (error) {
        console.error('Error loading HTML SlideOver:', error)
      }
    },

    get searchFilterStyle() {
      return Alpine.store('items').styles.filter(style => {
        const name = style.name || ''
        return name.toLowerCase().includes(this.search.toLowerCase())
      })
    },

    get searchFilterSample() {
      return Alpine.store('items').samples.filter(sample => {
        const name = sample.name || ''
        return name.toLowerCase().includes(this.search.toLowerCase())
      })
    },

    addStyle() {
      const clientId = Alpine.store('clients').selectedClient?.id
      const name = this.item.name.trim()
      const price = parseFloat(this.item.price)

      if (!name || isNaN(price) || !clientId) {
        callError('Invalid input', 'Please fill in all style fields correctly.')
        return
      }
      fetch('/item/styles/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, clientId }),
      })
        .then(res => (res.ok ? res.json() : Promise.reject('Failed to add style')))
        .then(newStyle => {
          Alpine.store('items').addStyle(newStyle)
          this.resetItem()
          callSuccess('Style Created', `Successfully added "${newStyle.name}".`)
        })
        .catch(err => callError('Error', err))
    },

    addSample() {
      const clientId = Alpine.store('clients').selectedClient?.id
      const name = this.item.name.trim()
      const price = parseFloat(this.item.price)
      const time = parseFloat(this.item.time)

      if (!name || isNaN(price) || isNaN(time) || !clientId) {
        callError('Invalid input', 'Please fill in all sample fields correctly.')
        return
      }

      fetch('/item/samples/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, time, price, clientId }),
      })
        .then(res => (res.ok ? res.json() : Promise.reject('Failed to add sample')))
        .then(newSample => {
          Alpine.store('items').addSample(newSample)
          this.resetItem()
          callSuccess('Sample Created', `Successfully added "${newSample.name}".`)
        })
        .catch(err => callError('Error', err))
    },

    resetItem() {
      this.item = { name: '', price: null, time: null }
    },

    async updateStyle(id, name, price) {
      const validatedPrice = Alpine.store('price').validate(price)
      try {
        const res = await fetch(`/item/styles/update/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ id, name, price: validatedPrice }),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) throw new Error('Failed to update style in DB')
        const updatedStyle = await res.json()
        Alpine.store('items').updateStyle(updatedStyle)
        this.editingId = null
        callSuccess('Edit success', `Style ${name} updated successfully`)
      } catch (err) {
        console.error('Error updating style:', err)
      }
    },

    async updateSample(id, name, time, price) {
      const validatedPrice = Alpine.store('price').validate(price)
      const validatedTime = Alpine.store('price').validate(time)
      try {
        const res = await fetch(`/item/samples/update/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ id, name, time: validatedTime, price: validatedPrice }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error('Failed to update sample in DB')
        const updatedSample = await res.json()
        Alpine.store('items').updateSample(updatedSample)
        this.editingId = null
        callSuccess('Edit success', `Sample ${name} updated successfully`)
      } catch (err) {
        console.error('Error updating sample:', err)
      }
    },
    async deleteStyle(id) {
      if (confirm('Are you sure you want to delete this style?')) {
        try {
          const res = await fetch(`/item/styles/delete/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete style in DB')

          Alpine.store('items').deleteStyle(id)
          callWarning('Style deleted')
        } catch (err) {
          console.error('Error deleting style:', err)
        }
      }
    },

    async deleteSample(id) {
      if (confirm('Are you sure you want to delete this sample?')) {
        try {
          const res = await fetch(`/item/samples/delete/${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete sample in DB')

          Alpine.store('items').deleteSample(id)
          callWarning('Sample deleted')
        } catch (err) {
          console.error('Error deleting sample:', err)
        }
      }
    },
  }
}
