export default function itemEditor() {
  return {
    slideOverOpen: false, // Controls the visibility
    htmlSlideOver: '', // Holds the fetched HTML content
    modalStyle: false,
    modalSample: false,
    search: '',
    item: {
      name: '',
      price: null,
      time: null,
    },
    async init() {
      const client = Alpine.store('clients').selectedClient
      if (client) {
        await this.syncWithDB(client.id)
      }
      await this.loadHtmlSlideOver()
    },
    async loadHtmlSlideOver() {
      try {
        const response = await fetch('/components/items/itemEditor.html') // Fetch the HTML file
        if (response.ok) {
          this.htmlSlideOver = await response.text() // Assign the fetched HTML to the property
        } else {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
      } catch (error) {
        console.error('Error loading HTML SlideOver:', error)
      }
    },
    async syncWithDB(clientId) {
      try {
        const [stylesRes, samplesRes] = await Promise.all([
          fetch(`/item/styles/client/${clientId}`),
          fetch(`/item/samples/client/${clientId}`),
        ])

        if (!stylesRes.ok || !samplesRes.ok) throw new Error('Failed to fetch data from DB')

        const styles = await stylesRes.json()
        const samples = await samplesRes.json()

        Alpine.store('items').setStyles(styles)
        Alpine.store('items').setSamples(samples)
      } catch (err) {
        console.error('Error syncing with DB:', err)
      }
    },

    get searchFilterStyle() {
      if (!this.search) return Alpine.store('items').styles
      return Alpine.store('items').styles.filter(style => style.name.toLowerCase().includes(this.search.toLowerCase()))
    },
    get searchFilterSample() {
      if (!this.search) return Alpine.store('items').samples

      const searchTerm = this.search.toLowerCase()
      return Alpine.store('items').samples.filter(sample => sample?.name?.toLowerCase().includes(searchTerm))
    },

    async addStyle() {
      const clientId = Alpine.store('clients').selectedClient?.id
      const style = { name: this.item.name.trim(), price: this.item.price, clientId }

      // Validate input
      if (!style.name || style.price == null || isNaN(style.price) || !clientId) {
        console.error('Invalid style data:', style)
        callError('Invalid input', 'Ensure the name is provided and the price is a valid number.')
        return
      }

      try {
        const res = await fetch('/item/styles/new', {
          method: 'POST',
          body: JSON.stringify(style),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) throw new Error('Failed to add style to DB')

        const addedStyle = await res.json()

        // Add style to the store
        Alpine.store('items').addStyle({ ...style, ...addedStyle }) // Merge backend response
        this.resetItem()
        await this.$nextTick()

        callSuccess('Style Created', `Successfully added "${style.name}".`)
      } catch (err) {
        console.error('Error adding style:', err)
        callError('Error', 'Failed to add style. Please try again.')
      }
    },

    async addSample() {
      const clientId = Alpine.store('clients').selectedClient?.id
      const sample = { name: this.item.name.trim(), price: this.item.price, time: this.item.time, clientId }

      // Validate input
      if (
        !sample.name ||
        sample.price == null ||
        isNaN(sample.price) ||
        sample.time == null ||
        isNaN(sample.time) ||
        !clientId
      ) {
        console.error('Invalid sample data:', sample)
        callError('Invalid input', 'Ensure all fields are filled and valid.')
        return
      }

      try {
        const res = await fetch('/item/samples/new', {
          method: 'POST',
          body: JSON.stringify(sample),
          headers: { 'Content-Type': 'application/json' },
        })

        if (!res.ok) throw new Error('Failed to add sample to DB')

        const addedSample = await res.json()

        // Add sample to the store
        Alpine.store('items').addSample({ ...sample, ...addedSample }) // Merge backend response
        this.resetItem()
        await this.$nextTick()

        callSuccess('Sample Created', `Successfully added "${sample.name}".`)
      } catch (err) {
        console.error('Error adding sample:', err)
        callError('Error', 'Failed to add sample. Please try again.')
      }
    },

    resetItem() {
      this.item = { name: '', time: null, price: null }
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
        } catch (err) {
          console.error('Error deleting sample:', err)
        }
      }
    },
  }
}

// export default function itemEditor() {
//   return {
//     slideOverOpen: false, // Controls the visibility
//     htmlSlideOver: '', // Holds the fetched HTML content
//     currentClient: localStorage.getItem('selectedClient'),
//     styles: [],
//     samples: [],
//     editingSampOrStyle: 'static',
//     search: '',
//     item: {
//       name: '',
//       price: null,
//       time: null,
//     },
//     modalStyle: false,
//     modalSample: false,

//     get searchFilterStyle() {
//       return this.styles.filter(style => style.name.includes(this.search))
//     },
//     get searchFilterSample() {
//       return this.samples.filter(style => style.name.includes(this.search))
//     },

//     async init() {
//       console.log('[] -- component itemEditor.js -->  initialized')
//       await this.loadHtmlSlideOver() // Load HTML when the component initializes
//       if (this.currentClient === null && this.slideOverOpen === true) {
//         console.warn('No client found in localStorage. Closing slideover.')
//         this.slideOverOpen = false
//         return
//       }
//       Alpine.effect(() => {
//         const client = Alpine.store('clients').selectedClient
//         if (client) {
//           this.currentClient = JSON.stringify(client)
//           this.getStyles()
//           this.getSamples()
//         } else {
//           this.styles = []
//           this.samples = []
//           this.slideOverOpen = false
//         }
//       })
//     },
//     async loadHtmlSlideOver() {
//       try {
//         const response = await fetch('/components/items/itemEditor.html') // Fetch the HTML file
//         if (response.ok) {
//           this.htmlSlideOver = await response.text() // Assign the fetched HTML to the property
//         } else {
//           throw new Error(`Failed to fetch: ${response.status}`)
//         }
//       } catch (error) {
//         console.error('Error loading HTML SlideOver:', error)
//       }
//     },

//     async getStyles() {
//       if (this.currentClient === null) {
//         this.slideOverOpen = false
//       }
//       const client = JSON.parse(this.currentClient).id
//       try {
//         const response = await fetch(`/item/styles/client/${client}`)
//         if (!response.ok) throw new Error('Failed to fetch styles')
//         this.styles = await response.json()
//       } catch (error) {
//         console.error('Error fetching styles:', error)
//       }
//     },
//     async getSamples() {
//       if (this.currentClient === null) {
//         this.slideOverOpen = false
//       }
//       const client = JSON.parse(this.currentClient).id
//       try {
//         const response = await fetch(`/item/samples/client/${client}`)
//         if (!response.ok) throw new Error('Failed to fetch samples')
//         this.samples = await response.json()
//         console.log(this.samples)
//       } catch (error) {
//         console.error('Error fetching samples:', error)
//       }
//     },
//     async addStyle() {
//       const clientId = Alpine.store('clients').selectedClient.id
//       console.log({
//         name: this.item.name,
//         price: this.item.price,
//         clientId: clientId,
//       })
//       const response = await fetch('/item/styles/new', {
//         method: 'POST',
//         body: JSON.stringify({
//           name: this.item.name,
//           price: this.item.price,
//           clientId: clientId,
//         }),
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       })

//       if (!response.ok) {
//         console.table('Failed to add style')
//       }
//       const dataBack = await response.json()
//       if (dataBack) {
//         this.getStyles()
//         this.item = {
//           name: '',
//           price: null,
//           time: null,
//         }
//       } else {
//         throw 'addStyle: Bad data returned from server'
//       }
//       console.log('From server:', dataBack)
//     },

//     async addSample() {
//       const clientId = Alpine.store('clients').selectedClient.id
//       const response = await fetch('/item/samples/new', {
//         method: 'POST',
//         body: JSON.stringify({
//           name: this.item.name,
//           time: this.item.time,
//           price: this.item.price,
//           clientId: clientId,
//         }),
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       })
//       if (!response.ok) {
//         console.table('Bad response: Failed adding style')
//       }
//       const dataBack = await response.json()
//       if (dataBack) {
//         this.getSamples()
//         this.item = {
//           name: '',
//           price: null,
//           time: null,
//         }
//       } else {
//         throw 'addStyle: Bad data returned from server'
//       }
//       console.log('From server: ', dataBack)
//     },
//     async updateStyle(id, name, price) {
//       try {
//         this.editingSampOrStyle = 'checking'
//         this.$refs.editStylePrice.focus()

//         const validatedPrice = Alpine.store('price').validate(price)
//         this.editingSampOrStyle = 'passed'
//         const data = {
//           id: id,
//           name: name,
//           price: validatedPrice,
//         }

//         console.log('Style data before update: ', data)
//         const response = await fetch(`/item/styles/update/${id}`, {
//           method: 'PUT',
//           body: JSON.stringify(data),
//           headers: { 'Content-type': 'application/json; charset=UTF-8' },
//         })
//         console.log('StyleResponse from db: ', response)
//       } catch (error) {
//         console.error('Update aborted: ', error.message)
//       }
//     },
//     async updateSample(name, time, price, sampleId) {
//       try {
//         this.editingSampOrStyle = 'checking'
//         this.$refs.editSampleTime.focus()
//         const validatedPrice = Alpine.store('price').validate(price)
//         const validatedTime = Alpine.store('price').validate(time)
//         this.editingSampOrStyle = 'passed'
//         const data = {
//           name: name,
//           time: validatedTime,
//           price: validatedPrice,
//         }
//         console.log(
//           `Data to send dB: , name: ${name} - ${typeof name}, time: ${time}- ${typeof time}, price: ${validatedPrice}- ${typeof validatedPrice}, sampleId: ${sampleId} - ${typeof sampleId}`,
//         )
//         const response = await fetch(`/item/samples/update/${sampleId}`, {
//           method: 'PUT',
//           body: JSON.stringify(data),
//           headers: { 'Content-type': 'application/json; charset=UTF-8' },
//         })
//         if (!response.ok) {
//           throw new Error(`Failed to update sample: ${response.statusText}`)
//         }
//         console.log('Sample updated successfully', await response.json())
//       } catch (error) {
//         console.error('Update aborted: ', error.message)
//       }
//     },

//     deleteStyle(id) {
//       if (confirm('Are you sure you want to delete this style?')) {
//         fetch(`/item/styles/delete/${id}`, { method: 'DELETE' })
//           .then(response => {
//             if (!response.ok) {
//               throw new Error(`Failed to delete style: ${response.statusText}`)
//             }
//             console.log('Style deleted successfully')
//             this.getStyles()
//           })
//           .catch(error => console.error('Error deleting style:', error))
//       }
//     },
//     deleteSample(sampleId) {
//       if (confirm('Are you sure you want to delete this sample?')) {
//         fetch(`/item/samples/delete/${sampleId}`, { method: 'DELETE' })
//           .then(response => {
//             if (!response.ok) {
//               throw new Error(`Failed to delete sample: ${response.statusText}`)
//             }
//             console.log('Sample deleted successfully')
//             this.getSamples()
//           })
//           .catch(error => console.error('Error deleting sample:', error))
//       }
//     },
//   }
// }
