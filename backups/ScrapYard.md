<div
            x-data="$store.makeTable.make($store.edit.styleAndSample, 'styleAndSample')"
            class="relative p-2 border rounded border-vls/40 mb-4">
            <div class="flex justify-between w-full items-center">
              <input
                id="edit-modal-existing"
                type="text"
                placeholder="Search invoice items..."
                class="srch-style"
                x-model="searchQuery" />
              <h2 class="font-medium text-lg text-vls2 dark:text-vds underline decoration-vla dark:decoration-vda">
                Existing styles and samples
              </h2>
            </div>
            <div class="mt-4">
              <!-- Header row -->
              <div class="flex rounded bg-vls2 dark:bg-vdp text-vlp p-2">
                <div class="w-1/3 pl-4">Name</div>
                <div class="w-1/5">Type</div>
                <div class="w-1/6 text-right">Price</div>
                <div class="w-1/6 text-right">
                  Time
                  <span class="text-xs">(min)</span>
                </div>
                <div class="w-1/6 pr-4 text-center">Qty</div>
              </div>
              <!-- Body -->
              <div class="overflow-y-auto table-scrollbar" style="max-height: 25vh">
                <div class="px-0.5 mr-2 mt-4">
                  <template x-for="item in filteredItems" :key="`existing-${item.id}`">
                    <div
                      :id="item.frontendId"
                      class="w-full flex justify-between items-center rounded bg-vlp dark:bg-vds3neu700 text-vls2 dark:text-vds text-sm mb-3 border-hover-ring-efect p-0.5">
                      <div class="w-1/3 pl-4" x-text="item.name"></div>
                      <div class="w-1/5" x-text="item.type"></div>
                      <div class="w-1/6 text-right" x-text="item.price ? '£' + item.price.toFixed(2) : '£0.00'"></div>
                      <div class="w-1/6 text-right" x-text="item.type === 'sample' ? item.time + ' min' : 'N/A'"></div>
                      <!-- Updated width for Qty column to match the header -->
                      <div class="flex items-center justify-end w-1/6 text-right pr-4">
                        <button
                          @click="$store.edit.addDropdownItem(item);$nextTick(()=> $store.invo.addItemAnimation(item.frontendId));"
                          class="table-interaction-icon-blue mr-2">
                          <svg class="size-5"><use href="/icons/icons.svg#plus-circle" /></svg>
                        </button>
                        <input
                          :id="'existing' + item.frontendId"
                          type="number"
                          min="1"
                          class="table-input-standard w-14"
                          x-model.number="item.quantity" />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

class="fixed z-[99] w-auto block max-w-sm left-1/2 -translate-x-1/2 top-0 sm:mt-6"
x-cloak >
<template x-for="(toast, index) in toasts" :key="toast.id">

<li
:id="toast.id"
x-data="toastData"
x-init="init()"
@mouseover="toastHovered=true"
@mouseout="toastHovered=false"
class="relative w-full duration-300 ease-out select-none group"
:class="{ 'toast-no-description': !toast.description }" >
<span
                class="relative flex items-center break-words transition-all duration-300 ease-out border shadow-md group border-slate-600 dark:border-neutral-300 bg-vdark-600 dark:bg-zinc-900 sm:rounded-md"
                :class="{ 'p-2' : !toast.html, 'p-0' : toast.html }"
              >
<template x-if="!toast.html">
<div
                    class="flex items-center w-full"
                    :class="{ 
                        'text-green-500' : toast.type=='success', 'text-blue-500' : toast.type=='info', 'text-orange-400' : toast.type=='warning', 'text-red-500' : toast.type=='danger', 'text-slate-200' : toast.type=='default' 
                      }"
                  >
<!-- MARK: Toast Icons -->
<div class="flex-shrink-0">
<svg
                        x-show="toast.type=='success'"
                        class="h-[24px] w-[24px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
<path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.7744 9.63269C17.1238 9.20501 17.0604 8.57503 16.6327 8.22559C16.2051 7.87615 15.5751 7.93957 15.2256 8.36725L10.6321 13.9892L8.65936 12.2524C8.24484 11.8874 7.61295 11.9276 7.248 12.3421C6.88304 12.7566 6.92322 13.3885 7.33774 13.7535L9.31046 15.4903C10.1612 16.2393 11.4637 16.1324 12.1808 15.2547L16.7744 9.63269Z"
                          fill="currentColor"
                        ></path>
</svg>
<svg
                        x-show="toast.type=='info'"
                        class="h-[24px] w-[24px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
<path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 9C12.5523 9 13 8.55228 13 8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9ZM13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12Z"
                          fill="currentColor"
                        ></path>
</svg>
<svg
                        x-show="toast.type=='warning'"
                        class="h-[24px] w-[24px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
<path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M9.44829 4.46472C10.5836 2.51208 13.4105 2.51168 14.5464 4.46401L21.5988 16.5855C22.7423 18.5509 21.3145 21 19.05 21L4.94967 21C2.68547 21 1.25762 18.5516 2.4004 16.5862L9.44829 4.46472ZM11.9995 8C12.5518 8 12.9995 8.44772 12.9995 9V13C12.9995 13.5523 12.5518 14 11.9995 14C11.4473 14 10.9995 13.5523 10.9995 13V9C10.9995 8.44772 11.4473 8 11.9995 8ZM12.0009 15.99C11.4486 15.9892 11.0003 16.4363 10.9995 16.9886L10.9995 16.9986C10.9987 17.5509 11.4458 17.9992 11.9981 18C12.5504 18.0008 12.9987 17.5537 12.9995 17.0014L12.9995 16.9914C13.0003 16.4391 12.5532 15.9908 12.0009 15.99Z"
                          fill="currentColor"
                        ></path>
</svg>
<svg
                        x-show="toast.type=='danger'"
                        class="h-[24px] w-[24px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
<path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9996 7C12.5519 7 12.9996 7.44772 12.9996 8V12C12.9996 12.5523 12.5519 13 11.9996 13C11.4474 13 10.9996 12.5523 10.9996 12V8C10.9996 7.44772 11.4474 7 11.9996 7ZM12.001 14.99C11.4488 14.9892 11.0004 15.4363 10.9997 15.9886L10.9996 15.9986C10.9989 16.5509 11.446 16.9992 11.9982 17C12.5505 17.0008 12.9989 16.5537 12.9996 16.0014L12.9996 15.9914C13.0004 15.4391 12.5533 14.9908 12.001 14.99Z"
                          fill="currentColor"
                        ></path>
</svg>
</div>
<!-- MARK: Toast Title and Description -->
<div class="flex-grow mx-2 text-center">
<p
                        class="text-[16px] text-center font-medium leading-none text-vwhite-50"
                        x-text="toast.message"
                      ></p>
<p
                        x-show="toast.description"
                        :class="{ 'text-sm text-vwhite-50' : toast.type!='default' }"
                        class="mt-2 text-sm leading-none text-center opacity-75 text-vwhite-50"
                        x-text="toast.description"
                      ></p>
</div>

                    <!-- MARK: Toast hide button -->
                    <div class="flex-shrink-0">
                      <span
                        @click="burnToast(toast.id)"
                        class="duration-300 ease-in-out rounded-full opacity-0 cursor-pointer text-vwhite-50 dark:text-neutral-300 hover:text-vred-400 hover:dark:text-vred-300"
                        :class="{ 'opacity-100' : toastHovered, 'opacity-0' : !toastHovered }"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"
                          ></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                </template>
              </span>
            </li>
          </template>
        </ul>

TEMPLATING ALPINE!

<!-- Alpine.js Initialization -->
<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('dropdown', () => ({
    open: false,  // Dropdown state

    // Trigger property for the button
    trigger: {
      ['@click']() {
        this.open = !this.open;  // Toggles the dropdown
      },
    },

    // Dialogue property to control dropdown visibility
    dialogue: {
      ['x-show']() {
        return this.open;  // Shows the dropdown if open is true
      },
    },
  }));
});
</script>

<!-- HTML Structure -->
<div x-data="dropdown">
  <!-- Button to trigger dropdown -->
  <button x-bind="trigger" class="px-4 py-2 text-white bg-blue-500 rounded">
    Toggle Dropdown
  </button>

  <!-- Dropdown menu -->
  <div x-bind="dialogue" class="p-4 mt-2 bg-white shadow-lg">
    This is the dropdown content.
  </div>
</div>

Just use @Apply after and im on the way to simplify my code a lot

Styles removed
<button
@click="tabButtonClicked('styles')"
:class="{ 'tab-button-active': tabContentActive('styles') }"
class="tab-button flex items-center">

<div x-show="sideBar" class="flex items-center p-2">
<object data-feather="package" class="mr-1.5 w-4"></object>

                <span>Items</span>
              </div>
              <div x-show="!sideBar" class="p-2">
                <object data-feather="package"></object>
              </div>
            </button>

<div
  x-data="totalsInvoice"
  class="p-2 text-xs rounded-md bg-vlp text-vls3 outline outline-1 outline-offset-8 outline-vls/80 dark:bg-vdp dark:text-vds dark:outline-vdp3">
  <div class="grid items-end grid-cols-4">
    <!--MARK: MAIN PRICE MENU COL 1 -->
    <div class="flex-col self-center text-lg font-medium align-middle">
      <h3>
        Subtotal:
        <span x-text="'£' + staticSubtotal"></span>
      </h3>
      <!-- MARK: Discount -->
      <div class="flex">
        <h3 class="flex">
          <span class="mr-1">Discount:</span>
          <span x-show="discount !== 0">-</span>
          <span x-text="symbol === '%' ? discount + '%' : '£' + discount"></span>
          <span x-show="discount !== 0 && isDiscountPercent === true" x-text="(`(£${discountValue})`)"></span>
        </h3>
        <button
          x-show="discount != 0"
          x-transition.duration.300
          @click="resetDiscounts();"
          class="table-interaction-icon-red">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trash" />
          </svg>
        </button>
      </div>
      <!-- MARK: Vat -->
      <h3 class="text-lg font-medium">
        VAT:
        <span>£</span>
        <span x-text="vat"></span>
      </h3>
      <!-- MARK: Total -->
      <div class="flex w-full">
        <h3 class="flex">
          Total:
          <span class="ml-1">£</span>
          <span x-text="total"></span>
        </h3>
        <h3 x-show="discount !== 0" x-transition.duration.300 class="ml-1 line-through text-vls dark:text-neutral-400">
          <span x-text="preDiscountTotal"></span>
        </h3>
      </div>
      <!-- MARK: Deposit -->
      <div class="flex w-full">
        <div x-show="deposit != 0" x-transition.opacity.duration.300>
          <h3 class="flex">
            <span class="mr-1">Deposit:</span>
            <!-- Display deposit as either percentage + numeric value or just numeric value -->
            <span x-text="depositSymbol === '%' ? depositDisplay : '£' + deposit"></span>
          </h3>
        </div>
        <button
          x-show="deposit !== 0"
          x-transition.opacity.duration.300
          @click="resetDeposit();"
          class="table-interaction-icon-red">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trash" />
          </svg>
        </button>
      </div>
    </div>
    <!-- MARK: DISCOUNT MODAL -->
    <div class="flex justify-center">
      <div class="relative inline-block">
        <button
          @click="popoverOpen = !popoverOpen; if(popoverOpen) $nextTick(() => $refs.discountInput.focus())"
          class="flex self-center gap-2 butt-style">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#trending-down" />
          </svg>
          Discount
        </button>
        <div
          x-cloak
          x-show="popoverOpen"
          x-transition:enter="transition ease-out duration-300"
          @click.outside="popoverOpen = false"
          @keyup.esc="popoverOpen = false"
          x-transition:enter-start="opacity-0 translate-y-2"
          x-transition:enter-end="opacity-100 translate-y-0"
          x-transition:leave="transition ease-in duration-145"
          x-transition:leave-start="opacity-100 translate-y-0"
          x-transition:leave-end="opacity-0 -translate-y-10"
          class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
          <div class="modal-bg-and-borders overflow-hidden !p-6">
            <div class="relative">
              <div class="flex flex-col items-center justify-center mb-2">
                <h3 class="modal-title mb-4 !text-xl">Discount</h3>
                <!-- Input Value Discount -->
                <div class="relative mb-2">
                  <!-- 0 SYMBOL CONTROL WITH PADDING -->
                  <input
                    id="discount-input"
                    type="number"
                    placeholder="0"
                    x-model.number="tempDiscount"
                    x-ref="discountInput"
                    class="modal-input-style w-full !py-2 !pl-12" />
                  <!-- PERCENT SYMBOL CONTROL WITH PADDING -->
                  <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span
                      x-text="symbol"
                      id="symbolIdDiscount"
                      class="text-lg text-vls2/80 hover:text-gray-200 focus:text-gray-200 dark:text-vds"></span>
                    <!-- PIPE SYMBOL CONTROL WITH MARGIN -->
                    <span class="absolute h-4 mx-2 ml-6 border-l border-gray-300"></span>
                  </div>
                </div>
              </div>

              <div class="flex justify-between mb-4">
                <button
                  id="toggle-discount-btn"
                  @click="switchOpen = !switchOpen; changeDiscount(); revolveSymbol('symbolIdDiscount')"
                  :class="switchOpen ? ' rounded bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-semibold' : ' rounded bg-vla2 text-white text-sm hover:bg-vla3 transition duration-300 font-semibold'"
                  class="px-1.5 py-1 transition duration-300">
                  <svg id="rotateIcon" width="20" height="20">
                    <use href="/icons/icons.svg#rotate" />
                  </svg>
                </button>
                <button
                  id="confirm-discount"
                  @click="confirmDiscount()"
                  x-transition
                  class="ml-4 rounded bg-vls2 dark:bg-vds2 px-1.5 py-1 text-sm font-semibold text-white dark:text-vds transition duration-300 hover:bg-gray-300"
                  :class="discount !== 0 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 hover:bg-gray-300 text-gray-950'">
                  <svg width="20" height="20">
                    <use href="/icons/icons.svg#check" />
                  </svg>
                </button>
                <button
                  @click="resetDiscounts()"
                  class="ml-4 rounded bg-gray-600 px-1.5 py-1 text-white transition duration-300 hover:bg-gray-700">
                  <svg width="20" height="20">
                    <use href="/icons/icons.svg#xmark" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div
            class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-t-zinc-900"
            aria-hidden="true"></div>
          <div
            class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
            aria-hidden="true"></div>
        </div>
      </div>
    </div>
    <!-- MARK: DEPOSIT  MODAL-->
    <!-- DEPOSIT MENU COL 3-->
    <div class="flex justify-center">
      <div class="relative inline-block">
        <button
          @mouseenter="(trigger === 'hover focus') ? depositOpen = true : null"
          @click="(trigger === 'click') ? depositOpen = !depositOpen : null; if (depositOpen) { $nextTick(() => { $refs.tempDeposit.focus()}); }"
          type="button"
          class="flex self-center gap-2 butt-style">
          <svg width="20" height="20">
            <use href="/icons/icons.svg#cash-bill" />
          </svg>
          Deposit
        </button>
        <div
          x-cloak
          x-show="depositOpen"
          x-transition:enter="transition ease-out duration-300"
          @click.outside="depositOpen = false"
          @keyup.esc="depositOpen = false"
          x-transition:enter-start="opacity-0 translate-y-2"
          x-transition:enter-end="opacity-100 translate-y-0"
          x-transition:leave="transition ease-in duration-145"
          x-transition:leave-start="opacity-100 translate-y-0"
          x-transition:leave-end="opacity-0 -translate-y-10"
          class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
          <div class="modal-bg-and-borders overflow-hidden !p-6">
            <h3 class="modal-title mb-4 text-center !text-xl">Deposit</h3>
            <div class="relative my-4">
              <input
                x-ref="tempDeposit"
                class="modal-input-style w-full !py-2 !pl-12"
                type="number"
                min="0"
                placeholder="Enter deposit..."
                x-model="tempDeposit"
                :value="tempDeposit === 0 ? 0 : tempDeposit"
                :placeholder="tempDeposit === 0 ? 'Enter deposit...' : 0"
                @input="handleDepositInput(event)" />
              <!-- PERCENT SYMBOL CONTROL WITH PADDING -->
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span
                  x-text="depositSymbol"
                  id="symbolIdDeposit"
                  class="text-lg text-vls2/80 hover:text-gray-200 focus:text-gray-200 dark:text-vds"></span>
                <!-- PIPE SYMBOL CONTROL WITH MARGIN -->
                <span class="absolute h-6 mx-2 ml-6 border-l border-gray-300"></span>
              </div>
            </div>
            <div class="flex justify-between mb-4">
              <button
                id="toggle-deposit"
                @click="isDepositPercent = ! isDepositPercent; handleDepositType(); revolveSymbol('symbolIdDeposit')"
                :class="!isDepositPercent ? ' rounded bg-gray-100 text-gray-950 text-sm hover:bg-gray-300 transition duration-300 font-semibold' : ' rounded bg-vla2 text-white text-sm hover:bg-vla3 transition duration-300 font-semibold'"
                class="px-1.5 py-1 transition duration-300">
                <svg id="toggle-deposit-btn" width="20" height="20">
                  <use href="/icons/icons.svg#rotate" />
                </svg>
              </button>
              <button
                id="confirm-deposit"
                @click="calculateDeposit()"
                x-transition
                class="ml-4 rounded bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-950 transition duration-300 hover:bg-gray-300">
                <svg width="20" height="20">
                  <use href="/icons/icons.svg#check" />
                </svg>
              </button>
              <button
                @click="depositOpen = false"
                class="ml-4 rounded bg-gray-600 px-1.5 py-1 text-white transition duration-300 hover:bg-gray-700">
                <svg width="20" height="20">
                  <use href="/icons/icons.svg#xmark" />
                </svg>
              </button>
            </div>
          </div>
          <div
            class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-vds2"
            aria-hidden="true"></div>
          <div
            class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
            aria-hidden="true"></div>
        </div>
      </div>
    </div>

    <!-- MARK: COL 4 NOTE PDF -->
    <div class="flex justify-between h-full">
      <!-- MARK: NOTE BUTTON -->
      <div>
        <div :class="invoiceNote !== '' ? 'hidden' : 'block'"></div>
        <div
          class="relative"
          @mouseover="hoverCardEnter()"
          @mouseleave="hoverCardLeave()"
          :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'"
          x-show="invoiceNote != ''">
          <div
            class="flex align-top transition-colors duration-300 text-vls hover:fill-vls hover:text-vla dark:text-vds dark:hover:fill-vred-300 dark:hover:text-vred-300"
            :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="feather feather-file-text">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <button
              @click="removeMessage()"
              class="flex transition duration-300 fade-in-hidden fade-out-hidden justify-items-end text-vls hover:text-vla dark:text-vred-300"
              x-ref="removeBtn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-x-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </button>
          </div>

          <div
            x-show="hoverCardHovered"
            class="absolute top-0 mt-5 translate-y-3 left-1/2 -z-50 w-72 max-w-72 -translate-x-3/4"
            x-cloak>
            <div
              x-show="hoverCardHovered"
              class="flex h-auto w-[full] items-start space-x-3 rounded-md border border-slate-300 bg-vlp p-4 shadow-sm dark:border-neutral-600 dark:bg-zinc-900"
              x-transition>
              <div class="flex w-full h-full text-vls dark:text-vds">
                <div class="flex items-center justify-center text-sm">
                  <p
                    x-text="invoiceNote"
                    class="font-normal fade-in-hidden fade-out-hidden text-wrap"
                    :class="invoiceNote !== '' ? 'fade-in-visible' : 'fade-out-hidden'"
                    x-ref="noteText"
                    x-show="invoiceNote != ''"></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col items-end justify-between h-full">
        <!-- MARK:NOTE POPOVER -->
        <div class="relative inline-block">
          <button
            @click=" invoiceNoteOpen = !invoiceNoteOpen; if (invoiceNoteOpen) { $nextTick(() => { $refs.invoiceNotePopover.focus()}); }"
            type="button"
            class="flex self-center gap-2 butt-style">
            <svg width="20" height="20">
              <use href="/icons/icons.svg#clipboard" />
            </svg>
            Invoicing Note
          </button>
          <div
            x-cloak
            x-show="invoiceNoteOpen"
            x-transition:enter="transition ease-out duration-300"
            @click.outside="invoiceNoteOpen = false"
            @keyup.esc="invoiceNoteOpen = false"
            x-transition:enter-start="opacity-0 translate-y-2"
            x-transition:enter-end="opacity-100 translate-y-0"
            x-transition:leave="transition ease-in duration-145"
            x-transition:leave-start="opacity-100 translate-y-0"
            x-transition:leave-end="opacity-0 -translate-y-10"
            class="absolute z-10 flex flex-col items-center justify-center origin-bottom bottom-full start-1/2 -ms-32 w-52 will-change-transform">
            <div class="modal-bg-and-borders overflow-hidden !p-6">
              <!-- TOOLTIP QUESTIONMARK -->
              <!-- MARK: INVOICE MESSAGE -->
              <!-- Custom Message for Deposit -->
              <div>
                <h3 class="modal-title mb-4 text-center !text-xl">Client Note</h3>
                <textarea
                  x-model="invoiceNotePopover"
                  x-ref="invoiceNotePopover"
                  @input="trackLength()"
                  rows="4"
                  class="modal-input-style w-full !p-2"
                  placeholder="Invoice note..."
                  style="resize: vertical; min-height: 100px; max-height: 300px"></textarea>
              </div>
              <div class="mb-4">
                <h1 x-transition.duration.300 class="mt-2 text-center text-small text-vls dark:text-vds">
                  Characters:
                  <span x-text="noteMaxLength"></span>
                  /
                  <span x-text="noteMaxLength - noteLength"></span>
                </h1>
              </div>
              <!-- Confirm Button -->
              <div class="flex justify-center">
                <button
                  @click="handleMessageSubmit()"
                  class="rounded bg-gray-100 px-1.5 py-1 text-sm font-semibold text-gray-950 transition duration-300 hover:bg-gray-300">
                  <svg width="20" height="20" class="">
                    <use href="/icons/icons.svg#check" />
                  </svg>
                </button>
              </div>
            </div>
            <div
              class="relative z-10 flex-none w-0 h-0 -mt-px border-t-8 border-e-8 border-s-8 border-e-transparent border-s-transparent border-t-vlp dark:border-t-zinc-900"
              aria-hidden="true"></div>
            <div
              class="relative z-0 -mt-[7px] h-0 w-0 flex-none border-e-8 border-s-8 border-t-8 border-e-transparent border-s-transparent border-t-vls2 dark:border-t-vds2"
              aria-hidden="true"></div>
          </div>
        </div>
        <!-- GENERATE PDF  -->
        <div>
          <button @click="generateInvoice" class="butt-style">
            <svg width="20" height="20" class="mr-1.5">
              <use href="/icons/icons.svg#download-document" />
            </svg>

            Generate PDF
          </button>
        </div>
      </div>
    </div>

  </div>
</div>
