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
