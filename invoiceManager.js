export default function invoiceManager() {
  return {
    showClientModal: false,
    showDropdown: false,
    clients: [],
    styles: [],
    filteredStyles: [],
    samples: [],
    filteredSamples: [],
    selectedClient: null,
    // Invoice items - collects both styles and samples
    invoiceItems: [],
    filteredInvoiceItems: [],
    quantities: {},
    // Search Bar
    styleSearch: "",
    sampleSearch: "",
    invoiceSearch: "",
    // Add new style for client
    showAddStyleModal: false,
    newStyle: { name: "", price: null },    
    // Add new sample for client
    showAddSampleModal: false,
    newSample: { name: "", time: null, price: null },
    // Price forming menu - final values after all operations have been added to them
    subtotal: 0,
    vat: 0,
    vatPercent: 20,
    preDiscountTotal: 0,
    total: 0,
    // Use for deposits popover menu. Not YET added 
    popoverOpenDeposit: false,
    // Discount section
    popoverOpen: false,
    // THE 4 BELOW NEED TO BE PERSISTED ACROSS THE APP TOO --> TO DO: WHEN SAVING ITEMS 
    switchOpen: false, // Controls discount types, symbol
    isDiscountPercent: true,
    isDiscountFlat: false,
    symbol: "%",
    // Temporary values
    // State variable to conditionally show or hide the crossed over subtotal
    showNewSubtotal: false,
    temporarySubtotal: 0,
    temporaryDiscount: 0,
    temporaryVat: 0,
    temporaryTotal: 0,
    // This is discount in  the main price forming meny
    discount: 0,
    // To display discount numeric value when discount is percent
    discValSub: 0,
    discountValue: 0,
    // Deposit popover menu
    trigger: 'click',
    depositOpen: false,
    isDepositPercent: true,
    depositPercent: 1,
    depositFlat: 0,
    tempDeposit: 0,
    tempDepositDynamicValue: 0,
    depositSymbol: '%',
    deposit: 0,
    depositNumericValue: 0,
    depositDisplay: '',
    // Note
    invoiceNoteOpen: false,
    invoiceNotePopover: '',
    invoiceNote: '',
    noteLength: 0,
    lnght: 216,
    noteMaxLength: 217,
    // Hover card element
    hoverCardHovered: false,
    hoverCardDelay: 400,
    hoverCardLeaveDelay: 300,
    hoverCardTimout: null,
    hoverCardLeaveTimeout: null,
    // Tab section
    pineTabSelected: "1",
    tabId: null,

    init() {
      this.fetchClients()
      this.loadSelectedClient()
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
        this.$refs.tabMarker.style.width = tabButton.offsetWidth + 'px';
        this.$refs.tabMarker.style.height = tabButton.offsetHeight + 'px';
        this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px';
      }
    },

    tabContentActive(tabContent) {
      return this.pineTabSelected == tabContent.id.replace(this.tabId + '-content-', '');
    },

    tabButtonActive(tabContent) {
      const tabId = tabContent.id.split('-').slice(-1);
      return this.pineTabSelected == tabId;
    },
    
    applyEffect(item) {
      let styles = this.filteredStyles.map((style) => style.id)
      let samples = this.filteredSamples.map((sample) => sample.id)

      let itemId
      let sampleId

      if (styles.includes(item.id)) {
        itemId = `rowid-${item.id}`
      }
      let rowEl = document.getElementById(itemId)
      if (samples.includes(item.id)) {
        sampleId = `sampleRowId-${item.id}`
      }
      let sampleRowEl = document.getElementById(sampleId)


      const applyClassAndRemove = (el, className) => {
       // Remove any previous instance of the class
        el.classList.remove(className); 
        void el.offsetWidth; // Force a reflow to reset animation
        el.classList.add(className); // Reapply the class to trigger animation

        // Remove the class once the animation finishes
        el.addEventListener('animationend', () => {
          el.classList.remove(className);
        }, { once: true }); // `once: true` ensures the listener is removed after one execution
      };

      if (rowEl) {
        if (this.mode === "light") {
          applyClassAndRemove(rowEl, 'add-item-glow')
        }
        if (this.mode === "dark") {
          applyClassAndRemove(rowEl, 'add-item-glow-dark')
        }
      }

      if (sampleRowEl) {
        if (this.mode === "light") {
          applyClassAndRemove(sampleRowEl, 'add-item-glow') 
        }
        if (this.mode === "dark") {
          applyClassAndRemove(sampleRowEl, 'add-item-glow-dark') 
        }
      }

    },

    
    hoverCardEnter () {
      clearTimeout(this.hoverCardLeaveTimeout)
      if(this.hoverCardHovered) return
      clearTimeout(this.hoverCardTimout)
      this.hoverCardTimout = setTimeout(() => {
          this.hoverCardHovered = true
      }, this.hoverCardDelay)
    },
    hoverCardLeave () {
        clearTimeout(this.hoverCardTimout);
        if(!this.hoverCardHovered) return;
        clearTimeout(this.hoverCardLeaveTimeout);
        this.hoverCardLeaveTimeout = setTimeout(() => {
            this.hoverCardHovered = false;
        }, this.hoverCardLeaveDelay);
    },
    
    handleMessageSubmit() {
      if (!this.validator(this, 'handleMessageSubmit')) return
      if(this.noteLength >= this.noteMaxLength) {
        callError('Note cannot exceed character limit.')
        this.$refs.invoiceNotePopover.focus()
        return
      }
      let noteText = this.$refs.noteText;
      let removeBtn = this.$refs.removeBtn;
      // Update the note first, then apply fade-in effect
      this.invoiceNote = this.invoiceNotePopover;
      this.invoiceNotePopover = ''
      callSuccess('Note created successfully.', 'Hover over icon to preview.')
      setTimeout(() => {
          // Apply fade-in effect to both text and button
          noteText.classList.remove('fade-out-hidden');
          noteText.classList.add('fade-in-visible');
          removeBtn.classList.remove('fade-out-hidden');
          removeBtn.classList.add('fade-in-visible');
      }, 0); 
      this.invoiceNoteOpen = false
    },

    trackLength() {
      // If input to the note you add 1 if delete you subtract 1  
      this.noteLength = this.invoiceNotePopover.length;
      if(this.noteLength >= this.noteMaxLength) {
        callWarning('Note cannot exceed limit characters.')
        this.$refs.invoiceNotePopover.focus()
        return
      }
    },

    removeMessage() {
      let noteText = this.$refs.noteText;
      let removeBtn = this.$refs.removeBtn;

      // Apply fade-out effect to both text and button
      noteText.classList.remove('fade-in-visible');
      noteText.classList.add('fade-out-hidden');
      removeBtn.classList.remove('fade-in-visible');
      removeBtn.classList.add('fade-out-hidden');
      callInfo('Note removed from invoice.')
      // Clear the note after the fade-out completes
      setTimeout(() => {
          this.invoiceNote = '';
      }, 300); // Matches the duration of the fade-out transition
    },

    //MARK: DEPOSIT

    resetDeposit() {
      let depositBtn = document.getElementById('confirm-deposit')
      this.tempDeposit = 0;
      this.deposit = 0;
      depositBtn.classList.add('bg-gray-100', 'hover:bg-gray-300', 'text-gray-950')
      depositBtn.classList.remove('bg-green-500', 'text-white', 'hover:bg-green-600')
      callSuccess('Deposit reset.')
    },

    handleDepositType() {
      if (this.deposit !== 0) {
        callError('Cannot change deposit type', 'Remove any existing deposits first.')
        return
      }
      let inputFocus = this.$refs.tempDeposit
      const icon = document.getElementById('toggle-deposit-btn');
      icon.classList.add('spin'); // Add animation class
      // Remove class after animation to reset for future clicks
      icon.addEventListener(
        "animationend",
        () => {
          icon.classList.remove('spin');
        },
        { once: true }
      );
      if (this.isDepositPercent) {
        this.depositSymbol = '';
        this.depositSymbol = '%';
        this.depositPercent = 1
        this.depositFlat = 0
      } else {
        this.depositSymbol = '';
        this.depositSymbol = '£';
        this.depositFlat = 1
        this.depositPercent = 0
      }
      inputFocus.focus()
    },

    calculateDeposit() {
      let inputFocus = this.$refs.tempDeposit
      try {
        if (!this.validator(this, 'calculateDeposit')) return
        let depositBtn = document.getElementById('confirm-deposit')
        let tempDeposit = this.tempDeposit
        let tempTotal = this.total
        let deposit = this.deposit
        let depositNumeric

        if (!this.isDepositPercent) {
          deposit = tempDeposit
        } else if (this.isDepositPercent) {
          deposit = tempDeposit/100 * tempTotal
          depositNumeric = deposit
          this.depositNumericValue = this.roundToTwo(depositNumeric)
        }
        
        this.deposit = this.roundToTwo(deposit)

        this.depositDisplay = this.isDepositPercent ? `${tempDeposit}% (£${this.depositNumericValue})` : `£${this.deposit}`

        depositBtn.classList.remove('bg-gray-100', 'hover:bg-gray-300', 'text-gray-950')
        depositBtn.classList.add('bg-green-500', 'text-white', 'hover:bg-green-600')
        callSuccess('Deposit added to invoice.')
        inputFocus.focus()
        inputFocus.focus()
      } catch (error) {
        console.error(error)
        callError('Error calculating deposit.', 'Try again, refresh the program or call support.')
        inputFocus.focus()

      }
      
    },


    handleDepositInput(event) {
      const inputValue = event.target.value;
      if (inputValue === "" || isNaN(inputValue)) {
        this.tempDeposit = 0;
      } else {
        // Update discount normally based on input
        this.tempDeposit = parseFloat(inputValue);
      }
    },

    validator(context, functionName) {
      const validations = {
        // Additional function-specific validations can be added here
        calculateDeposit:[
          {
            condition: context.deposit !== 0,
            toast: () => callError('Cannot change deposit.', 'Remove any existing deposits first.')
          },
          {
            condition: context.total === 0,
            toast: () => callError('Total must be greater than zero.'),
          },    
          { 
            condition: context.isDepositPercent && context.tempDeposit > 100,
            toast: () => callError('Deposit cannot exceed 100%.'),
          },
          {
            condition: context.isDepositPercent === false && context.tempDeposit > context.total,
            toast: () => callError('Deposit cannot exceed the total.'),
          },
          {
            condition: context.tempDeposit <= 0,
            toast: () => callError('Deposit cannot be zero or a negative value.'),
          },
        ],

        confirmDiscount: [
          {
            condition: context.discount !== 0,
            toast: () => callError('Discount already applied.', 'Only one discount can be applied.')
          },
          {
            condition: context.temporaryDiscount === 0,
            toast: () => callError('Invalid discount.', 'Discount cannot be empty.')
          },
          {
            condition: context.subtotal <= 0,
            toast: () => callError('Cannot apply discount.', 'Insert items into invoice first.')
          },
          {
            condition: context.deposit !== 0,
            toast: () => callError('Cannot apply discount.', 'Remove the deposit first.')
          },
          {
            condition: context.temporaryDiscount < 0,
            toast: () => callError('Invalid discount.', 'Discount value cannot be negative.')
          },
          {
            condition: typeof context.temporaryDiscount !== 'number' || isNaN(context.temporaryDiscount),
            toast: () => callError('Invalid input.', 'Discount value must be a number.')
          },
          {
            condition: context.isDiscountPercent && context.temporaryDiscount > 100,
            toast: () => callError('Discount cannot exceed 100%.', 'Please check the discount value.')
          },
          {
            condition: context.isDiscountFlat && context.temporaryDiscount > context.subtotal,
            toast: () => callError('Discount cannot exceed the subtotal.', 'Please adjust the discount value.')
          }
        ],
        handleMessageSubmit: [
          {
            condition: context.subtotal === 0,
            toast: () => callError('Cannot insert note.', 'Please add some items into your invoice first.')
          },
          {
            condition: context.invoiceNotePopover === '',
            toast: () => callError('Invoice note cannot be empty.', 'Please input a message first.')
          },

        ],
      };

      // Run the validations for the specified function
      const functionValidations = validations[functionName] || [];
      for (const { condition, toast } of functionValidations) {
          if (condition) {
              toast();
              return false;
          }
      }
      return true;
    },


    
    /**         
        
     TO DO LIST: 
    ------------
    Saving/Reseting/Deleting Invoice State - How will this work. 
    ---------------------------------------------------------------
      Saving
        1. When user adds a new item to the invoice list to keep track of invoice items and discounts
      Reseting
        1.
      Deleting
        1. When user changes clients - or should I save the user progress
        2. When user generates an invoice - Yes

    Selecting client needs to empty all totals - Or does it? 
      Check if there is any subtotal or not if not ...do not accept anything

      Conditionals:
          If user presses confirm with no input throw error toast and return
          If user inputs negative value do not calculate 
          If user inputs negative value and presses confirm throw error   
    */

    /*------------------------------CLIENT FETCHING LOGIC------------------------*/
    async fetchClients() {
      try {
        const response = await fetch("/api/clients");
        this.clients = await response.json();
      } catch (error) {
        console.error("Error fetching clients:", error);
        callToast({ type: 'danger', message: 'Main menu: Error!', description: 'Cannot get client. Try again, restart program or call support.', position: 'top-center', html: '' })
      }
    },

    selectClient(client) {
      let selectedClient = this.selectedClient.name
      let beforeSelect = this.selectedClient.name
      if (this.subtotal != 0) {
        let result = confirm(`You are working on ${selectedClient}'s invoice. Switching clients will reset unsaved progress. Continue?`
)
        if (result === false) {
          this.showDropdown = false
          this.showClientModal = false
          return
        }
      }
      // Select new client
      this.selectedClient = client
      this.showDropdown = false
      this.showClientModal = false
      this.saveSelectedClient(client)
      this.fetchStyles(client.id)
      this.fetchSamples(client.id)
      // Reset prices and discounts
      this.invoiceItems = [];
      this.resetDiscounts()
      this.resetTemporaryDiscounts()
      this.calculateTotals()
      let afterSelect = this.selectedClient.name
      if (beforeSelect != afterSelect) {
        callToast({ type: 'success', message: `Client changed to ${this.selectedClient.name}.`, position: 'top-center', html: '' })
      } else {
        callToast({ type: 'success', message: `Client remains ${this.selectedClient.name}.`, position: 'top-center' })
      }
    },

    saveSelectedClient(client) {
      localStorage.setItem("selectedClient", JSON.stringify(client));
    },

    loadSelectedClient() {
      const client = JSON.parse(localStorage.getItem("selectedClient"));
      if (client) {
        this.selectedClient = client;
        this.fetchStyles(client.id);
        this.fetchSamples(client.id);
      }
    },
    openModal() {
      this.showClientModal = true;
    },
    closeModal() {
      this.showClientModal = false;
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    async fetchStyles(clientId) {
      try {
        const response = await fetch(`/api/styles/client/${clientId}`);
        this.styles = (await response.json()).map((style) => ({ ...style }));
        this.filteredStyles = this.styles;
      } catch (error) {
        console.error("Error fetching styles:", error);
        callToast({ type: 'danger', message: 'Error fetching styles.', description: 'Please try again or contact support.', position: 'top-center' })
      }
    },
    async fetchSamples(clientId) {
      try {
        const response = await fetch(`/api/samples/client/${clientId}`);
        this.samples = (await response.json()).map((sample) => ({
          ...sample,
          sampleName: sample.name,
        }));
        this.filteredSamples = this.samples;
      } catch (error) {
        console.error("Error fetching samples:", error);
        callToast({ type: 'danger', message: 'Error fetching samples.', description: 'Please try again or contact support.', position: 'top-center' })
      }
    },
    /*-------------------------PRICE FORMING LOGIC---------------------------------*/
    handleInvoQtySubmit(item) {
      return this.quantities[item.id] || 1
    },

    addItemToInvoice(item, type) {
      // Disables adding items to invoice if discount is applied
      if (this.deposit !== 0) {
        callError('Cannot add items.', 'Remove deposit/discount and try again.')
        return
      }
      if (this.discount !== 0) {
        this.calculateTotals()
        callError('Cannot add items.', 'Remove discount and try again.')
        return
      }
      // 1. Unique id to identify items by an id - TODO: THIS SHOULD BE STORED TOO
      const uniqueId = `${type}-${item.id}`
      let qty = this.quantities[item.id] || 1
      let itemExists = false
      // 2. Map over the invoiceItems
      this.invoiceItems = this.invoiceItems.map((invoiceItem) => {
        // 3. if the item exists is in the lsit:
        if (invoiceItem.uniqueId === uniqueId) {
          itemExists = true;
          return {
            ...invoiceItem,
            quantity: invoiceItem.quantity + qty,
            price: 
              invoiceItem.type === "sample" 
                ? parseFloat(item.price) * parseFloat(item.time) 
                : invoiceItem.price
          }
        } 
        return invoiceItem
      })
      this.filteredInvoiceItems = this.invoiceItems
      // 4. If the item does not exist, add it to the invoiceItems array
      if (!itemExists) {
        this.invoiceItems.push({
          ...item,
          type,
          uniqueId,
          quantity: qty,
          price: parseFloat(item.price) * (type === "sample" ? parseFloat(item.time) : 1 )
        })
        this.applyEffect(item)
      }
      if (this.discount === 0) {
        this.calculateTotals()
        this.applyEffect(item)
        console.log("I am totals when there is no previous discount!")
        console.log(`Subtotal: ${this.subtotal}`)
        console.log(`Vat: ${this.vat}`)
        console.log(`Total: ${this.total}`)
        console.log(`Discount${this.symbol}: ${this.discount}`)
        return 
      } else {
        callToast({ type: 'danger', message: 'Error adding item.', description: 'Failed to add item to the invoice.', position: 'top-center' })
        console.log("I am error if no previous discount!")
        return
      }
      // add invoice items to localstorage by calling a function bellow
    },
    
    removeItemFromInvoice(item) {
      let confirmText = "Are you sure you want to remove this item?"
      if(this.discount != 0) {
        callError('Cannot remove item.', 'Please clear any existing discount/deposit first.') 
        return
      }
      if(this.deposit != 0) {
        callError('Cannot remove item.', 'Please clear any existing discount/deposit first.')
        return
      }
      if (confirm(confirmText) === true) {
        this.invoiceItems = this.invoiceItems.filter(
          (i) => i.uniqueId !== item.uniqueId 
        )
        this.filteredInvoiceItems = this.filteredInvoiceItems.filter(
          (i) => i.uniqueId !== item.uniqueId
        )
        this.calculateTotals();
        callSuccess('Item removed', 'Successfully removed item from invoice.')
      } else {
        return
      }

      if (this.subtotal < 0) {
        callError('Cannot remove item.', 'Total cannot be a negative value. Check your discounts.')
        this.invoiceItems.push(item)
        this.calculateTotals();
        return
      }

      if (this.invoiceItems.length === 0) {
        this.resetDeposit()
        this.resetDiscounts()
        callInfo('No items in invoice list.', 'Discounts and deposits have been reset.')
      } 
    },

    // Rounds numbers to two decimal spaces. Only use after all math ops. are done. 
    roundToTwo(value) {
      return Math.round((value + Number.EPSILON) * 100) / 100
    },
    calculateSubTotal() {
      try {
        // Calculate the subtotal for samples
        let sampleTotal = this.invoiceItems
          .filter((item) => item.type === "sample")
          .reduce((total, item) => total + item.price * item.quantity, 0);
        // Calculate the subtotal for styles
        let styleTotal = this.invoiceItems
          .filter((item) => item.type === "style")
          .reduce((total, item) => total + item.price * item.quantity, 0);
        // Calculate the overall subtotal by summing both
        let subTotal = sampleTotal + styleTotal;
        this.discValSub = subTotal
        console.log("Samples: ", sampleTotal);
        console.log("Styles: ", styleTotal);
        console.log("Subtotal: ", subTotal);
        return this.roundToTwo(subTotal);
      } catch (error) {
        console.error("Error calculating subtotal:", error);
        throw new Error(
          "Failed to calculate subtotal. Please check the input data."
        );
      }
    },
    calculateTotals() {
      // recalculate prices if there already is a discount present
      if (this.discount !== 0) {
        let subtotal = this.calculateSubTotal()
        let discount = this.discount
        let recalcSubtotal = 0

        if(this.isDiscountPercent === true) {
          recalcSubtotal = subtotal - (discount/100) * subtotal
        }
        else if (this.isDiscountFlat === true) {
          recalcSubtotal = subtotal - discount 
        }
        let recalcVat = (this.vatPercent / 100) * recalcSubtotal
        let recalcTotal = recalcSubtotal + recalcVat

        this.subtotal = this.roundToTwo(recalcSubtotal)
        this.vat = this.roundToTwo(recalcVat)
        this.total = this.roundToTwo(recalcTotal)

        return
      }
      
      this.subtotal = this.calculateSubTotal();
      let noDiscountVat = (this.vatPercent / 100) * this.subtotal
      this.vat = this.roundToTwo(noDiscountVat);
      let noDiscountTotal = this.subtotal + this.vat 
      this.total = this.roundToTwo(noDiscountTotal)
       
    },
    // MARK: DISCOUNT
    // Helps keep discount input value to 0 
    handleDiscountInput(event) {
      const inputValue = event.target.value;
      if (inputValue === "" || isNaN(inputValue)) {
        this.temporaryDiscount = 0;
      } else {
        // Update discount normally based on input
        this.temporaryDiscount = parseFloat(inputValue);
      }
    },
    // Calculates temporary subtotal and VAT and Total
    calculateTemporaryValues() {
      if(this.isDiscountPercent === true) {
        this.temporarySubtotal = this.subtotal - (this.temporaryDiscount/100) * this.subtotal
      } else if(this.isDiscountFlat === true) {
        this.temporarySubtotal = this.subtotal - this.temporaryDiscount
      }
      this.temporaryVat = this.vatPercent/100 * this.temporarySubtotal
      this.temporaryTotal = this.temporarySubtotal + this.temporaryVat
    },
    // Checks if discount is an acceptible value based on this we 
    // Confirm all prices to send to main screen Prices menu
    confirmDiscount() {
      let inputFocus = this.$refs.discountInput
      // Discount validation using VALIDATOR :D
      if (!this.validator(this, 'confirmDiscount')) {
        inputFocus.focus()
        return 
      }
      // Pass temporary values to main price forming menu
      let totalContainer = this.total
      const confirmBtn = document.getElementById('confirm-discount')
      this.preDiscountTotal = totalContainer// reference to the total before calculations
      this.subtotal = this.roundToTwo(this.temporarySubtotal)
      this.discount = this.roundToTwo(this.temporaryDiscount)
      // MARK: Discount Value - gets the numberic value for discounts when discount === percent
      if (this.isDiscountPercent === true) {
        this.discountValue = this.discValSub/100 * this.discount
      }
      this.vat = this.roundToTwo(this.temporaryVat)
      this.total = this.roundToTwo(this.temporaryTotal) 
      this.resetTemporaryDiscounts()

      confirmBtn.classList.remove('bg-gray-100', 'hover:bg-gray-300', 'text-gray-950')
      confirmBtn.classList.add('bg-green-500', 'text-white', 'hover:bg-green-600')

      callToast({ type: 'success', message: 'Discount applied successfully.', position: 'top-center' })
      inputFocus.focus()
      console.log("Subtotal: " + this.subtotal)
      console.log("Vat: " + this.vat)
      console.log("Discount: " + this.discount)
      console.log("Total: " + this.total)
      console.log("Total before discount: " + this.preDiscountTotal)
      // HANDLE ERROR HERE
    },
    revolveSymbol() {
      const symbol = document.getElementById("symbolIdDeposit");
      symbol.classList.add("revolve");

      symbol.addEventListener(
        "animationend",
        () => {
          symbol.classList.remove("revolve");
        },
        { once: true }
      );
    },
    
    // Important handlers for reseting discount
    resetTemporaryDiscounts() {
      const discBubbleSubTotal = document.getElementById('subtotal-discount-buble')
      this.temporaryDiscount = 0
      this.temporarySubtotal = this.subtotal
      this.temporaryVat = this.vat
      this.temporaryTotal = this.total
      this.showNewSubtotal = false
      discBubbleSubTotal.classList.remove('line-through', 'text-gray-500')
      discBubbleSubTotal.classList.add('text-slate-300')

      
    },
    resetDiscounts() {
      const confirmBtn = document.getElementById('confirm-discount')

      if (this.deposit != 0) {
        this.resetDeposit()
      }
      this.discount = 0
      this.resetTemporaryDiscounts()
      this.temporaryVat = this.vat
      this.temporaryTotal = this.total
      this.calculateTotals()
      confirmBtn.classList.remove('bg-green-500', 'text-white', 'hover:bg-green-600')
      confirmBtn.classList.add('bg-gray-100', 'hover:bg-gray-300', 'text-gray-950')
      callToast({ type: 'success', message: 'Discount reset successfully.', position: 'top-center' })

    },
    showTemporarySubtotalAndDiscount() {
      const discBubbleSubTotal = document.getElementById('subtotal-discount-buble')
      
      if (this.temporaryDiscount != 0 && !isNaN(this.temporaryDiscount)) {
        this.showNewSubtotal = true
        discBubbleSubTotal.classList.add('line-through', 'text-gray-500')
      } else if(this.temporaryDiscount === '' || isNaN(this.temporaryDiscount)) {
        alert("There is a problem with the discount. Contact your tech support.")
      } else {
        this.showNewSubtotal = false
        discBubbleSubTotal.classList.remove('line-through', 'text-gray-500',)
        discBubbleSubTotal.classList.add('text-slate-300')
      }
      console.log("Discount is:" + this.temporaryDiscount)
    },
    // TODO: Add localstorage to set state? Maybe after fetch styles/client
    changeDiscount() {
      let inputFocus = this.$refs.discountInput
      if (this.discount != 0) {
        callError('Cannot change discount type.', 'Reset the existing discount first.')
        inputFocus.focus()
        return
      }
      const icon = document.getElementById("rotateIcon");
      icon.classList.add("spin"); // Add animation class
      // Remove class after animation to reset for future clicks
      icon.addEventListener(
        "animationend",
        () => {
          icon.classList.remove("spin");
        },
        { once: true }
      );
      if (this.switchOpen === true) {
        this.symbol = "£";
        this.isDiscountPercent = false;
        this.isDiscountFlat = true;
        this.revolveSymbol();
      } 
      if (this.switchOpen === false) {
        this.symbol = "%";
        this.isDiscountPercent = true;
        this.isDiscountFlat = false;
        this.revolveSymbol();
      }
      inputFocus.focus()
    }, 
    
    /*MARK: ADD STYLES & SAMPLE */
    // Adds new style/sample in DB and updates UI
    async invoAddStyle() {
      const style = { ...this.newStyle, client_id: this.selectedClient.id };
      try {
        const response = await fetch("/styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(style),
        });
        const newStyle = await response.json();
        this.styles.push({ ...newStyle });
        this.filteredStyles = this.styles;
        this.showAddStyleModal = false;
        this.newStyle = { name: "", price: null };
        callToast({ type: 'success', message: 'Style added successfully.', position: 'top-center' })
      } catch (error) {
        console.error("Error adding style:", error);
        callToast({ type: 'danger', message: 'Error adding style.', description: 'Please try again or contact support.', position: 'top-center' })
      }
    },
    async invoAddSample() {
      const sample = { ...this.newSample, client_id: this.selectedClient.id };
      try {
        const response = await fetch("/samples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sample),
        });
        const newSample = await response.json();
        this.samples.push({ ...newSample, isEditing: false });
        this.filteredSamples = this.samples;
        this.showAddSampleModal = false;
        this.newSample = { name: "", style: null, price: null };
        callToast({ type: 'success', message: 'Sample added successfully.', position: 'top-center' })
      } catch (error) {
        console.error("Error adding sample:", error);
        callToast({ type: 'danger', message: 'Error adding sample.', description: 'Please try again or contact support.', position: 'top-center' })
      }
    },

    searchStyles() {
      this.filteredStyles = this.styles.filter((style) =>
        style.name.toLowerCase().includes(this.styleSearch.toLowerCase())
      );
    },

    searchSamples() {
      this.filteredSamples = this.samples.filter((sample) =>
        sample.sampleName
          .toLowerCase()
          .includes(this.sampleSearch.toLowerCase())
      );
    }, 
    searchInvoiceItems(){
      this.filteredInvoiceItems = this.invoiceItems.filter((item) => 
        item.name
          .toLowerCase()
          .includes(this.invoiceSearch.toLowerCase())
      )
    },

    /*---------------------------GENERATE INVOICE LOGIC-----------------------------*/
    /* TODO: 
      1. If value is 0 and it returns error the invoice still makes an invoice in the backend
      2. NOTE! ---> Added Deposit and NOTE to DB
    */
    // Generates invoice
    async generateInvoice() {
      const invoiceData = {
        clientId: this.selectedClient.id,
        items: this.invoiceItems,
        // need to edit this based on discounts
        discountPercent: this.isDiscountPercent, // doesnt exist in current data itteration 
        discountFlat: this.isDiscountFlat,  // doesnt exist in current data itteration
        vatPercent: this.vatPercent, 
        subtotal: this.subtotal,
        discount: this.discountValue,
        discountPercentValue: this.discount !== 0 ? this.discount : 0,
        vat: this.vat,
        total: this.total,
        deposit: this.deposit,
        depositPercentValue: this.tempDeposit !== 0 ? this.tempDeposit : 0, 
        note: this.invoiceNote,
        totalPreDiscount: this.preDiscountTotal,
        date: new Date().toLocaleDateString(),
        depositFlat: this.depositFlat,
        depositPercent: this.depositPercent,
      };
      console.log(invoiceData)
      try {
        const response = await fetch("/api/saveInvoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        });

        if (response.ok) {
          const invoice = await response.json();
          this.generatePDF(invoice.id);
        } else {
          console.error(
            "Error generating invoice, data sent from invoiceData was shit:",
            await response.json()
          );
          callToast({ type: 'danger', message: 'Server Error!', description: 'Failed to generate invoice. Please try again or contact support.', position: 'top-center' })
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
        callToast({ type: 'danger', message: 'Invoice Error!', description: 'Unable to generate invoice. Try again or contact support.', position: 'top-center' })
      }
    },

    async generatePDF(invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
          method: "GET",
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // PDF Filename - set by Content-Disposition in backend.
        a.download = `S.A.M.Creations-${invoiceId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        callToast({ type: 'success', message: 'PDF generated successfully.', position: 'top-center' })
      } catch (error) {
        console.error("Error generating PDF:", error);
        callToast({ type: 'danger', message: 'PDF Generation Error!', description: 'Failed to generate PDF. Please try again or contact support.', position: 'top-center' })
      }
    }, 
  };
}
