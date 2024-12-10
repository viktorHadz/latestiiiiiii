export default function stylesManager() {
  return {
    message: 'Hello from stylesManager',
    showClientModal: false,
    showAddStyleModal: false,
    showAddSampleModal: false,
    showDropdown: false,
    clients: [],
    styles: [],
    filteredStyles: [],
    samples: [],
    filteredSamples: [],
    selectedClient: null,
    newStyle: { name: null, price: null },
    newSample: { name: '', time: null, price: null },
    styleSearch: '',
    sampleSearch: '',
    // Tab section
    pineTabSelected: '1',
    tabId: null,

    init() {
      console.log(this.message)
      this.fetchClients()
      this.loadSelectedClient()
      // Call feather icons replace to re-render icons.
      feather.replace()
      this.tabId = this.$id('tabs')
      // Ensure that the $refs are fully loaded before accessing them
      this.$nextTick(() => {
        this.tabRepositionMarker(this.$refs.tabButtons.firstElementChild)
      })
    },
    tabButtonClicked(tabButton) {
      this.pineTabSelected = tabButton.id.replace(this.tabId + '-', '')
      this.tabRepositionMarker(tabButton)
    },

    tabRepositionMarker(tabButton) {
      if (this.$refs.tabMarker) {
        this.$refs.tabMarker.style.width = tabButton.offsetWidth + 'px'
        this.$refs.tabMarker.style.height = tabButton.offsetHeight + 'px'
        this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px'
      }
    },

    tabContentActive(tabContent) {
      return (
        this.pineTabSelected ==
        tabContent.id.replace(this.tabId + '-content-', '')
      )
    },

    tabButtonActive(tabContent) {
      const tabId = tabContent.id.split('-').slice(-1)
      return this.pineTabSelected == tabId
    },

    async fetchClients() {
      try {
        const response = await fetch('/clients')
        this.clients = await response.json()
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    },

    openModal() {
      this.showClientModal = true
    },

    closeModal() {
      this.showClientModal = false
    },

    selectClient(client) {
      this.selectedClient = client
      this.showDropdown = false

      this.saveSelectedClient(client)
      this.fetchStyles(client.id)
      this.fetchSamples(client.id)
      this.$nextTick(() => {
        this.closeModal()
      })
    },

    saveSelectedClient(client) {
      localStorage.setItem('selectedClient', JSON.stringify(client))
      const savedClient = JSON.parse(localStorage.getItem('selectedClient'))
      callSuccess(`Selected client: ${savedClient.name}`)
    },

    loadSelectedClient() {
      const client = JSON.parse(localStorage.getItem('selectedClient'))
      if (client) {
        this.selectedClient = client
        this.fetchStyles(client.id)
        this.fetchSamples(client.id)
      }
    },

    async fetchStyles(clientId) {
      try {
        const response = await fetch(`/styles/client/${clientId}`)
        this.styles = (await response.json()).map(style => ({
          ...style,
          isEditing: false,
        }))
        this.filteredStyles = this.styles
      } catch (error) {
        console.error('Error fetching styles:', error)
      }
    },

    async fetchSamples(clientId) {
      try {
        const response = await fetch(`/samples/client/${clientId}`)
        this.samples = (await response.json()).map(sample => ({
          ...sample,
          isEditing: false,
        }))
        this.filteredSamples = this.samples
      } catch (error) {
        console.error('Error fetching samples:', error)
      }
    },

    async addStyle() {
      const style = { ...this.newStyle, client_id: this.selectedClient.id }
      try {
        const response = await fetch('/styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(style),
        })
        const newStyle = await response.json()
        this.styles.push({ ...newStyle, isEditing: false })
        this.filteredStyles = this.styles
        this.showAddStyleModal = false
        callSuccess('Added new style:', this.newStyle.name)
        this.newStyle = { name: '', price: null } // Clear the form
      } catch (error) {
        console.error('Error adding style:', error)
        callError('Cannot add style', 'Contact support.')
      }
    },

    async addSample() {
      const sample = { ...this.newSample, client_id: this.selectedClient.id }
      try {
        const response = await fetch('/samples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sample),
        })
        const newSample = await response.json()
        this.samples.push({ ...newSample, isEditing: false })
        this.filteredSamples = this.samples
        this.showAddSampleModal = false
        callSuccess('Added new sample:', this.newSample.name)
        this.newSample = { name: '', time: null, price: null } // Clear the form
      } catch (error) {
        console.error('Error adding sample:', error)
        callError('Cannot add sample', 'Contact support.')
      }
    },

    editStyle(style) {
      style.original = { ...style } // Store original data
      style.isEditing = true
    },

    editSample(sample) {
      sample.original = { ...sample } // Store original data
      sample.isEditing = true
    },

    cancelEditStyle(style) {
      Object.assign(style, style.original) // Revert to original data
      style.isEditing = false
      callSuccess('Style Edit canceled.', 'No changes were saved.')
    },

    cancelEditSample(sample) {
      Object.assign(sample, sample.original) // Revert to original data
      sample.isEditing = false
      callSuccess('Sample Edit canceled.', 'No changes were saved.')
    },

    async saveStyle(style) {
      try {
        const updatedStyle = {
          id: style.id,
          name: style.name,
          price: style.price,
          client_id: style.client_id,
        }
        const response = await fetch(`/styles/${style.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStyle),
        })
        if (response.ok) {
          style.isEditing = false
          callSuccess('Style edit successful', 'Changes saved.')
        } else {
          console.error('Error saving style:', await response.json())
        }
      } catch (error) {
        console.error('Error saving style:', error)
      }
    },

    async saveSample(sample) {
      try {
        const updatedSample = {
          id: sample.id,
          name: sample.name,
          time: sample.time,
          price: sample.price,
          client_id: sample.client_id,
        }
        const response = await fetch(`/samples/${sample.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSample),
        })
        if (response.ok) {
          sample.isEditing = false
          callSuccess('Sample edit successful', 'Changes saved.')
        } else {
          console.error('Error saving sample:', await response.json())
        }
      } catch (error) {
        console.error('Error saving sample:', error)
      }
    },

    async deleteStyle(styleId) {
      if (confirm('Delete this style?')) {
        try {
          const response = await fetch(`/styles/${styleId}`, {
            method: 'DELETE',
          })
          if (response.ok) {
            this.styles = this.styles.filter(style => style.id !== styleId)
            this.filteredStyles = this.styles
          } else {
            console.error('Error deleting style:', await response.json())
          }
        } catch (error) {
          console.error('Error deleting style:', error)
        }
      } else {
        return
      }
    },

    async deleteSample(sampleId) {
      if (confirm('Delete this sample?')) {
        try {
          const response = await fetch(`/samples/${sampleId}`, {
            method: 'DELETE',
          })
          if (response.ok) {
            this.samples = this.samples.filter(sample => sample.id !== sampleId)
            this.filteredSamples = this.samples
          } else {
            console.error('Error deleting sample:', await response.json())
          }
        } catch (error) {
          console.error('Error deleting sample:', error)
        }
      } else {
        return
      }
    },

    searchStyles() {
      this.filteredStyles = this.styles.filter(style =>
        style.name.toLowerCase().includes(this.styleSearch.toLowerCase()),
      )
    },

    searchSamples() {
      this.filteredSamples = this.samples.filter(sample =>
        sample.name.toLowerCase().includes(this.sampleSearch.toLowerCase()),
      )
    },
  }
}
