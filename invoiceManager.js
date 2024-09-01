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
    // Search Bar
    styleSearch: "",
    sampleSearch: "",
    // Add new style for client
    showAddStyleModal: false,
    newStyle: { name: "", price: null },
    // Add new sample for client
    showAddSampleModal: false,
    newSample: { name: "", time: null, price: null },
    // Price forming menu
    subtotal: 0,
    vat: 0,
    deposit: 0,
    vatPercent: 20,
    total: 0,
    // Discount popover
    popoverOpen: false,
    // Discount section
    switchOpen: false, // Controls discount types, symbol
    isDiscountPercent: false,
    isDiscountFlat: false,
    symbol: "%",
    // Discount value - x-model.number in the html controls the type
    discount: 0,
    
    init() {
      this.fetchClients();
      this.loadSelectedClient();
    },

    /**          
       Selecting client needs to empty all totals
            Check if there is any subtotal or not if not ...do not accept anything

            While user types
                Cross out Subtotal and insert a new h1 subtotal below
                Recalculate the discount menu values 
                If user deletes their input value remove cross from subtotal and delete the appended h1  and recalculate totals again

            If user presses tick to confirm discount - paint icon green font to white
                inser the Discount value from invoice into the discounts main menu below
                (this in turn will have to recalculate subtotal vat and total)
                close the discounts menu 
                create a cross next to discount append it with a symbol % or £ depending on invoice value

            Conditionals:
                If user presses confirm with no input throw error toast and return
                If user inputs negative value do not calculate 
                If user inputs negative value and presses confirm throw error   
    */

    handleDiscountInput(event) {
      const inputValue = event.target.value;
      if (inputValue === "" || isNaN(inputValue)) {
        // Keep discount at 0 and allow the placeholder to show
        this.discount = 0;
      } else {
        // Update discount normally based on input
        this.discount = parseFloat(inputValue);
      }
    },

    calculateDiscount() {
      const discount = this.discount;
      if (this.isDiscountFlat) {
      } else {
      }
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
        console.log("Samples: ", sampleTotal);
        console.log("Styles: ", styleTotal);
        console.log("Subtotal: ", subTotal);

        return subTotal;
      } catch (error) {
        console.error("Error calculating subtotal:", error);
        throw new Error(
          "Failed to calculate subtotal. Please check the input data."
        );
      }
    },

    calculateTotals() {
      // Use let and const to not directly mutate the original arrays
      // Step 1: Calculate subtotal (sum of all items)
      // Step 2: Calculate discount on subtotal(standard) THEN calculate subtotal again
      // Step 3: Only then do you calculate VAT
      // Step 4: Calculate total
      // Step 5: Optional: add discount to total if needed.
      // Step 6: Calculate Deposit - independednt from other sums (client expected to pay)
      // Step 7: Only then assign values to the arrays

      this.subtotal = this.calculateSubTotal();

      //this.vat = (subtotalAfterDiscount * this.vatPercent / 100);
      this.vat = (20 / 100) * this.subtotal;
      // placed last
      this.discount =
        (this.subtotal * this.discountPercent) / 100 +
        parseFloat(this.discountFlat);
      const subtotalAfterDiscount = this.subtotal - this.discount;
      this.total = this.subtotal + this.vat;
      // Need Deposit
    },

    async fetchClients() {
      try {
        const response = await fetch("/api/clients");
        this.clients = await response.json();
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    },

    selectClient(client) {
      this.selectedClient = client;
      this.showDropdown = false;
      this.showClientModal = false;
      this.saveSelectedClient(client);
      this.fetchStyles(client.id);
      this.fetchSamples(client.id);
      // Empty out the Invoice Items Table | You need to ensure that styles are saved for the client youre clearing them out of and load them when selected
      this.invoiceItems = [];
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
      }
    },
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
        newStyle.name = newStyle.name;
        this.styles.push({ ...newStyle });
        this.filteredStyles = this.styles;
        this.showAddStyleModal = false;
        this.newStyle = { name: "", price: null };
      } catch (error) {
        console.error("Error adding style:", error);
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
      } catch (error) {
        console.error("Error adding sample:", error);
      }
    },
    // TODO: Add localstorage to set state? Maybe after fetch styles/client

    addItemToInvoice(item, type) {
      console.log("Adding item to invoice");
      const uniqueId = `${type}-${item.id}`;
      let qty = 1;
      let itemExists = false;
      // Map over the invoiceItems
      this.invoiceItems = this.invoiceItems.map((invoiceItem) => {
        // if the item exists is in the lsit
        if (invoiceItem.uniqueId === uniqueId) {
          itemExists = true;
          if (invoiceItem.type === "sample") {
            return {
              ...invoiceItem,
              quantity: invoiceItem.quantity + qty,
              price: parseFloat(item.price) * parseFloat(item.time),
            };
          } else {
            return {
              ...invoiceItem,
              quantity: invoiceItem.quantity + qty,
            };
          }
        } else {
          // returns the invoiceItem unchanged
          return invoiceItem;
        }
      });
      // If the item does not exist, add it to the invoiceItems array
      if (!itemExists) {
        if (type === "sample") {
          this.invoiceItems.push({
            ...item,
            type,
            uniqueId,
            quantity: qty,
            price: parseFloat(item.price) * parseFloat(item.time),
          });
        } else {
          this.invoiceItems.push({
            ...item,
            type,
            uniqueId,
            quantity: qty,
            price: parseFloat(item.price),
          });
        }
      }
      this.calculateTotals();
      // update the discounts section
      // add invoice items to localstorage by calling a function bellow
    },

    removeItemFromInvoice(item) {
      this.invoiceItems = this.invoiceItems.filter(
        (i) => i.uniqueId !== item.uniqueId
      );
      this.calculateTotals();
    },

    async generateInvoice() {
      const invoiceData = {
        clientId: this.selectedClient.id,
        items: this.invoiceItems,
        // need to edit this based on discounts
        discountPercent: this.discountPercent,
        discountFlat: this.discountFlat,
        vatPercent: this.vatPercent,
        subtotal: this.subtotal,
        discount: this.discount,
        vat: this.vat,
        total: this.total,
      };

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
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
      }
    },

    async generatePDF(invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
          method: "GET",
        });
        console.log("Invoice id is:" + invoiceId);

        console.log(response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        console.log(url);
        // PDF Filename - set by Content-Disposition in backend.
        a.download = `S.A.M.Creations-${invoiceId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    },

    changeDiscount() {
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

      if (this.switchOpen) {
        this.symbol = "£";
        this.isDiscountPercent = false;
        this.isDiscountFlat = true;
        this.revolveSymbol();
      } else {
        this.symbol = "%";
        this.isDiscountPercent = true;
        this.isDiscountFlat = false;
        this.revolveSymbol();
      }
      console.log("Our discount:");
      console.log(this.discount);
      console.log("Our discount type:");
      console.log(typeof this.discount);
    },

    revolveSymbol() {
      const symbol = document.getElementById("symbolId");
      symbol.classList.add("revolve");

      symbol.addEventListener(
        "animationend",
        () => {
          symbol.classList.remove("revolve");
        },
        { once: true }
      );
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
    // create a counter each time an item/sample gets added in the added items table
    // Remove each item getting added in its own row. Instead another item with the same name needs to be counted
    // Price then needs to properly update
  };
}
