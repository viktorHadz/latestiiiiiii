<!-- You need the alpine and htmx plugins - Check Versions -->

1.  `
<head>
<script src="https://unpkg.com/htmx.org@2.0.3"></script>
<script src="/public/alpinejs/plugins/morph.js"></script>
</head>
<body>
<!-- Alpine Plugins -->
<script src="/public/alpinejs/plugins/alpine-morph.js" defer>
  <script src="./alpinejs/plugins/anchor.js" defer></script>
<script src="./alpinejs/plugins/persist.js" defer></script>
<script src="./alpinejs/plugins/collapse.js" defer></script>
<!--  Alpine Core  -->
<script src="./alpinejs/dist/cdn.min.js" defer></script>
</body>
`
2.  Now place your element in an html file somewhere and call it like so
`
<div hx-target="this" hx-ext="alpine-morph" hx-swap="morph" hx-trigger="load" hx-get="/toast.html"></div>
`
