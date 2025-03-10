;(() => {
  var _ = [
      'input',
      'select',
      'textarea',
      'a[href]',
      'button',
      '[tabindex]:not(slot)',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]:not([contenteditable="false"])',
      'details>summary:first-of-type',
      'details',
    ],
    k = _.join(','),
    K = typeof Element > 'u',
    N = K
      ? function () {}
      : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector,
    B =
      !K && Element.prototype.getRootNode
        ? function (i) {
            return i.getRootNode()
          }
        : function (i) {
            return i.ownerDocument
          },
    V = function (e, t, a) {
      var n = Array.prototype.slice.apply(e.querySelectorAll(k))
      return t && N.call(e, k) && n.unshift(e), (n = n.filter(a)), n
    },
    $ = function i(e, t, a) {
      for (var n = [], r = Array.from(e); r.length; ) {
        var s = r.shift()
        if (s.tagName === 'SLOT') {
          var l = s.assignedElements(),
            m = l.length ? l : s.children,
            p = i(m, !0, a)
          a.flatten ? n.push.apply(n, p) : n.push({ scope: s, candidates: p })
        } else {
          var v = N.call(s, k)
          v && a.filter(s) && (t || !e.includes(s)) && n.push(s)
          var h = s.shadowRoot || (typeof a.getShadowRoot == 'function' && a.getShadowRoot(s)),
            y = !a.shadowRootFilter || a.shadowRootFilter(s)
          if (h && y) {
            var w = i(h === !0 ? s.children : h.children, !0, a)
            a.flatten ? n.push.apply(n, w) : n.push({ scope: s, candidates: w })
          } else r.unshift.apply(r, s.children)
        }
      }
      return n
    },
    Y = function (e, t) {
      return e.tabIndex < 0 &&
        (t || /^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName) || e.isContentEditable) &&
        isNaN(parseInt(e.getAttribute('tabindex'), 10))
        ? 0
        : e.tabIndex
    },
    se = function (e, t) {
      return e.tabIndex === t.tabIndex ? e.documentOrder - t.documentOrder : e.tabIndex - t.tabIndex
    },
    Z = function (e) {
      return e.tagName === 'INPUT'
    },
    ce = function (e) {
      return Z(e) && e.type === 'hidden'
    },
    le = function (e) {
      var t =
        e.tagName === 'DETAILS' &&
        Array.prototype.slice.apply(e.children).some(function (a) {
          return a.tagName === 'SUMMARY'
        })
      return t
    },
    fe = function (e, t) {
      for (var a = 0; a < e.length; a++) if (e[a].checked && e[a].form === t) return e[a]
    },
    de = function (e) {
      if (!e.name) return !0
      var t = e.form || B(e),
        a = function (l) {
          return t.querySelectorAll('input[type="radio"][name="' + l + '"]')
        },
        n
      if (typeof window < 'u' && typeof window.CSS < 'u' && typeof window.CSS.escape == 'function')
        n = a(window.CSS.escape(e.name))
      else
        try {
          n = a(e.name)
        } catch (s) {
          return (
            console.error(
              'Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s',
              s.message,
            ),
            !1
          )
        }
      var r = fe(n, e.form)
      return !r || r === e
    },
    be = function (e) {
      return Z(e) && e.type === 'radio'
    },
    ve = function (e) {
      return be(e) && !de(e)
    },
    W = function (e) {
      var t = e.getBoundingClientRect(),
        a = t.width,
        n = t.height
      return a === 0 && n === 0
    },
    he = function (e, t) {
      var a = t.displayCheck,
        n = t.getShadowRoot
      if (getComputedStyle(e).visibility === 'hidden') return !0
      var r = N.call(e, 'details>summary:first-of-type'),
        s = r ? e.parentElement : e
      if (N.call(s, 'details:not([open]) *')) return !0
      var l = B(e).host,
        m = l?.ownerDocument.contains(l) || e.ownerDocument.contains(e)
      if (!a || a === 'full') {
        if (typeof n == 'function') {
          for (var p = e; e; ) {
            var v = e.parentElement,
              h = B(e)
            if (v && !v.shadowRoot && n(v) === !0) return W(e)
            e.assignedSlot ? (e = e.assignedSlot) : !v && h !== e.ownerDocument ? (e = h.host) : (e = v)
          }
          e = p
        }
        if (m) return !e.getClientRects().length
      } else if (a === 'non-zero-area') return W(e)
      return !1
    },
    pe = function (e) {
      if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName))
        for (var t = e.parentElement; t; ) {
          if (t.tagName === 'FIELDSET' && t.disabled) {
            for (var a = 0; a < t.children.length; a++) {
              var n = t.children.item(a)
              if (n.tagName === 'LEGEND') return N.call(t, 'fieldset[disabled] *') ? !0 : !n.contains(e)
            }
            return !0
          }
          t = t.parentElement
        }
      return !1
    },
    I = function (e, t) {
      return !(t.disabled || ce(t) || he(t, e) || le(t) || pe(t))
    },
    G = function (e, t) {
      return !(ve(t) || Y(t) < 0 || !I(e, t))
    },
    ge = function (e) {
      var t = parseInt(e.getAttribute('tabindex'), 10)
      return !!(isNaN(t) || t >= 0)
    },
    me = function i(e) {
      var t = [],
        a = []
      return (
        e.forEach(function (n, r) {
          var s = !!n.scope,
            l = s ? n.scope : n,
            m = Y(l, s),
            p = s ? i(n.candidates) : l
          m === 0
            ? s
              ? t.push.apply(t, p)
              : t.push(l)
            : a.push({ documentOrder: r, tabIndex: m, item: n, isScope: s, content: p })
        }),
        a
          .sort(se)
          .reduce(function (n, r) {
            return r.isScope ? n.push.apply(n, r.content) : n.push(r.content), n
          }, [])
          .concat(t)
      )
    },
    z = function (e, t) {
      t = t || {}
      var a
      return (
        t.getShadowRoot
          ? (a = $([e], t.includeContainer, {
              filter: G.bind(null, t),
              flatten: !1,
              getShadowRoot: t.getShadowRoot,
              shadowRootFilter: ge,
            }))
          : (a = V(e, t.includeContainer, G.bind(null, t))),
        me(a)
      )
    },
    x = function (e, t) {
      t = t || {}
      var a
      return (
        t.getShadowRoot
          ? (a = $([e], t.includeContainer, { filter: I.bind(null, t), flatten: !0, getShadowRoot: t.getShadowRoot }))
          : (a = V(e, t.includeContainer, I.bind(null, t))),
        a
      )
    },
    A = function (e, t) {
      if (((t = t || {}), !e)) throw new Error('No node provided')
      return N.call(e, k) === !1 ? !1 : G(t, e)
    },
    ye = _.concat('iframe').join(','),
    R = function (e, t) {
      if (((t = t || {}), !e)) throw new Error('No node provided')
      return N.call(e, ye) === !1 ? !1 : I(t, e)
    }
  function Q(i, e) {
    var t = Object.keys(i)
    if (Object.getOwnPropertySymbols) {
      var a = Object.getOwnPropertySymbols(i)
      e &&
        (a = a.filter(function (n) {
          return Object.getOwnPropertyDescriptor(i, n).enumerable
        })),
        t.push.apply(t, a)
    }
    return t
  }
  function X(i) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e] != null ? arguments[e] : {}
      e % 2
        ? Q(Object(t), !0).forEach(function (a) {
            we(i, a, t[a])
          })
        : Object.getOwnPropertyDescriptors
          ? Object.defineProperties(i, Object.getOwnPropertyDescriptors(t))
          : Q(Object(t)).forEach(function (a) {
              Object.defineProperty(i, a, Object.getOwnPropertyDescriptor(t, a))
            })
    }
    return i
  }
  function we(i, e, t) {
    return (
      e in i ? Object.defineProperty(i, e, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : (i[e] = t), i
    )
  }
  var J = (function () {
      var i = []
      return {
        activateTrap: function (t) {
          if (i.length > 0) {
            var a = i[i.length - 1]
            a !== t && a.pause()
          }
          var n = i.indexOf(t)
          n === -1 || i.splice(n, 1), i.push(t)
        },
        deactivateTrap: function (t) {
          var a = i.indexOf(t)
          a !== -1 && i.splice(a, 1), i.length > 0 && i[i.length - 1].unpause()
        },
      }
    })(),
    Te = function (e) {
      return e.tagName && e.tagName.toLowerCase() === 'input' && typeof e.select == 'function'
    },
    Fe = function (e) {
      return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27
    },
    Se = function (e) {
      return e.key === 'Tab' || e.keyCode === 9
    },
    ee = function (e) {
      return setTimeout(e, 0)
    },
    te = function (e, t) {
      var a = -1
      return (
        e.every(function (n, r) {
          return t(n) ? ((a = r), !1) : !0
        }),
        a
      )
    },
    O = function (e) {
      for (var t = arguments.length, a = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++) a[n - 1] = arguments[n]
      return typeof e == 'function' ? e.apply(void 0, a) : e
    },
    L = function (e) {
      return e.target.shadowRoot && typeof e.composedPath == 'function' ? e.composedPath()[0] : e.target
    },
    re = function (e, t) {
      var a = t?.document || document,
        n = X({ returnFocusOnDeactivate: !0, escapeDeactivates: !0, delayInitialFocus: !0 }, t),
        r = {
          containers: [],
          containerGroups: [],
          tabbableGroups: [],
          nodeFocusedBeforeActivation: null,
          mostRecentlyFocusedNode: null,
          active: !1,
          paused: !1,
          delayInitialFocusTimer: void 0,
        },
        s,
        l = function (o, u, c) {
          return o && o[u] !== void 0 ? o[u] : n[c || u]
        },
        m = function (o) {
          return r.containerGroups.findIndex(function (u) {
            var c = u.container,
              b = u.tabbableNodes
            return (
              c.contains(o) ||
              b.find(function (f) {
                return f === o
              })
            )
          })
        },
        p = function (o) {
          var u = n[o]
          if (typeof u == 'function') {
            for (var c = arguments.length, b = new Array(c > 1 ? c - 1 : 0), f = 1; f < c; f++) b[f - 1] = arguments[f]
            u = u.apply(void 0, b)
          }
          if ((u === !0 && (u = void 0), !u)) {
            if (u === void 0 || u === !1) return u
            throw new Error('`'.concat(o, '` was specified but was not a node, or did not return a node'))
          }
          var g = u
          if (typeof u == 'string' && ((g = a.querySelector(u)), !g))
            throw new Error('`'.concat(o, '` as selector refers to no known node'))
          return g
        },
        v = function () {
          var o = p('initialFocus')
          if (o === !1) return !1
          if (o === void 0)
            if (m(a.activeElement) >= 0) o = a.activeElement
            else {
              var u = r.tabbableGroups[0],
                c = u && u.firstTabbableNode
              o = c || p('fallbackFocus')
            }
          if (!o) throw new Error('Your focus-trap needs to have at least one focusable element')
          return o
        },
        h = function () {
          if (
            ((r.containerGroups = r.containers.map(function (o) {
              var u = z(o, n.tabbableOptions),
                c = x(o, n.tabbableOptions)
              return {
                container: o,
                tabbableNodes: u,
                focusableNodes: c,
                firstTabbableNode: u.length > 0 ? u[0] : null,
                lastTabbableNode: u.length > 0 ? u[u.length - 1] : null,
                nextTabbableNode: function (f) {
                  var g = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0,
                    F = c.findIndex(function (E) {
                      return E === f
                    })
                  if (!(F < 0))
                    return g
                      ? c.slice(F + 1).find(function (E) {
                          return A(E, n.tabbableOptions)
                        })
                      : c
                          .slice(0, F)
                          .reverse()
                          .find(function (E) {
                            return A(E, n.tabbableOptions)
                          })
                },
              }
            })),
            (r.tabbableGroups = r.containerGroups.filter(function (o) {
              return o.tabbableNodes.length > 0
            })),
            r.tabbableGroups.length <= 0 && !p('fallbackFocus'))
          )
            throw new Error(
              'Your focus-trap must have at least one container with at least one tabbable node in it at all times',
            )
        },
        y = function d(o) {
          if (o !== !1 && o !== a.activeElement) {
            if (!o || !o.focus) {
              d(v())
              return
            }
            o.focus({ preventScroll: !!n.preventScroll }), (r.mostRecentlyFocusedNode = o), Te(o) && o.select()
          }
        },
        w = function (o) {
          var u = p('setReturnFocus', o)
          return u || (u === !1 ? !1 : o)
        },
        S = function (o) {
          var u = L(o)
          if (!(m(u) >= 0)) {
            if (O(n.clickOutsideDeactivates, o)) {
              s.deactivate({ returnFocus: n.returnFocusOnDeactivate && !R(u, n.tabbableOptions) })
              return
            }
            O(n.allowOutsideClick, o) || o.preventDefault()
          }
        },
        D = function (o) {
          var u = L(o),
            c = m(u) >= 0
          c || u instanceof Document
            ? c && (r.mostRecentlyFocusedNode = u)
            : (o.stopImmediatePropagation(), y(r.mostRecentlyFocusedNode || v()))
        },
        T = function (o) {
          var u = L(o)
          h()
          var c = null
          if (r.tabbableGroups.length > 0) {
            var b = m(u),
              f = b >= 0 ? r.containerGroups[b] : void 0
            if (b < 0)
              o.shiftKey
                ? (c = r.tabbableGroups[r.tabbableGroups.length - 1].lastTabbableNode)
                : (c = r.tabbableGroups[0].firstTabbableNode)
            else if (o.shiftKey) {
              var g = te(r.tabbableGroups, function (P) {
                var j = P.firstTabbableNode
                return u === j
              })
              if (
                (g < 0 &&
                  (f.container === u ||
                    (R(u, n.tabbableOptions) && !A(u, n.tabbableOptions) && !f.nextTabbableNode(u, !1))) &&
                  (g = b),
                g >= 0)
              ) {
                var F = g === 0 ? r.tabbableGroups.length - 1 : g - 1,
                  E = r.tabbableGroups[F]
                c = E.lastTabbableNode
              }
            } else {
              var C = te(r.tabbableGroups, function (P) {
                var j = P.lastTabbableNode
                return u === j
              })
              if (
                (C < 0 &&
                  (f.container === u ||
                    (R(u, n.tabbableOptions) && !A(u, n.tabbableOptions) && !f.nextTabbableNode(u))) &&
                  (C = b),
                C >= 0)
              ) {
                var oe = C === r.tabbableGroups.length - 1 ? 0 : C + 1,
                  ue = r.tabbableGroups[oe]
                c = ue.firstTabbableNode
              }
            }
          } else c = p('fallbackFocus')
          c && (o.preventDefault(), y(c))
        },
        M = function (o) {
          if (Fe(o) && O(n.escapeDeactivates, o) !== !1) {
            o.preventDefault(), s.deactivate()
            return
          }
          if (Se(o)) {
            T(o)
            return
          }
        },
        q = function (o) {
          var u = L(o)
          m(u) >= 0 ||
            O(n.clickOutsideDeactivates, o) ||
            O(n.allowOutsideClick, o) ||
            (o.preventDefault(), o.stopImmediatePropagation())
        },
        H = function () {
          if (r.active)
            return (
              J.activateTrap(s),
              (r.delayInitialFocusTimer = n.delayInitialFocus
                ? ee(function () {
                    y(v())
                  })
                : y(v())),
              a.addEventListener('focusin', D, !0),
              a.addEventListener('mousedown', S, { capture: !0, passive: !1 }),
              a.addEventListener('touchstart', S, { capture: !0, passive: !1 }),
              a.addEventListener('click', q, { capture: !0, passive: !1 }),
              a.addEventListener('keydown', M, { capture: !0, passive: !1 }),
              s
            )
        },
        U = function () {
          if (r.active)
            return (
              a.removeEventListener('focusin', D, !0),
              a.removeEventListener('mousedown', S, !0),
              a.removeEventListener('touchstart', S, !0),
              a.removeEventListener('click', q, !0),
              a.removeEventListener('keydown', M, !0),
              s
            )
        }
      return (
        (s = {
          get active() {
            return r.active
          },
          get paused() {
            return r.paused
          },
          activate: function (o) {
            if (r.active) return this
            var u = l(o, 'onActivate'),
              c = l(o, 'onPostActivate'),
              b = l(o, 'checkCanFocusTrap')
            b || h(), (r.active = !0), (r.paused = !1), (r.nodeFocusedBeforeActivation = a.activeElement), u && u()
            var f = function () {
              b && h(), H(), c && c()
            }
            return b ? (b(r.containers.concat()).then(f, f), this) : (f(), this)
          },
          deactivate: function (o) {
            if (!r.active) return this
            var u = X(
              {
                onDeactivate: n.onDeactivate,
                onPostDeactivate: n.onPostDeactivate,
                checkCanReturnFocus: n.checkCanReturnFocus,
              },
              o,
            )
            clearTimeout(r.delayInitialFocusTimer),
              (r.delayInitialFocusTimer = void 0),
              U(),
              (r.active = !1),
              (r.paused = !1),
              J.deactivateTrap(s)
            var c = l(u, 'onDeactivate'),
              b = l(u, 'onPostDeactivate'),
              f = l(u, 'checkCanReturnFocus'),
              g = l(u, 'returnFocus', 'returnFocusOnDeactivate')
            c && c()
            var F = function () {
              ee(function () {
                g && y(w(r.nodeFocusedBeforeActivation)), b && b()
              })
            }
            return g && f ? (f(w(r.nodeFocusedBeforeActivation)).then(F, F), this) : (F(), this)
          },
          pause: function () {
            return r.paused || !r.active ? this : ((r.paused = !0), U(), this)
          },
          unpause: function () {
            return !r.paused || !r.active ? this : ((r.paused = !1), h(), H(), this)
          },
          updateContainerElements: function (o) {
            var u = [].concat(o).filter(Boolean)
            return (
              (r.containers = u.map(function (c) {
                return typeof c == 'string' ? a.querySelector(c) : c
              })),
              r.active && h(),
              this
            )
          },
        }),
        s.updateContainerElements(e),
        s
      )
    }
  function ne(i) {
    let e, t
    window.addEventListener('focusin', () => {
      ;(e = t), (t = document.activeElement)
    }),
      i.magic('focus', a => {
        let n = a
        return {
          __noscroll: !1,
          __wrapAround: !1,
          within(r) {
            return (n = r), this
          },
          withoutScrolling() {
            return (this.__noscroll = !0), this
          },
          noscroll() {
            return (this.__noscroll = !0), this
          },
          withWrapAround() {
            return (this.__wrapAround = !0), this
          },
          wrap() {
            return this.withWrapAround()
          },
          focusable(r) {
            return R(r)
          },
          previouslyFocused() {
            return e
          },
          lastFocused() {
            return e
          },
          focused() {
            return t
          },
          focusables() {
            return Array.isArray(n) ? n : x(n, { displayCheck: 'none' })
          },
          all() {
            return this.focusables()
          },
          isFirst(r) {
            let s = this.all()
            return s[0] && s[0].isSameNode(r)
          },
          isLast(r) {
            let s = this.all()
            return s.length && s.slice(-1)[0].isSameNode(r)
          },
          getFirst() {
            return this.all()[0]
          },
          getLast() {
            return this.all().slice(-1)[0]
          },
          getNext() {
            let r = this.all(),
              s = document.activeElement
            if (r.indexOf(s) !== -1)
              return this.__wrapAround && r.indexOf(s) === r.length - 1 ? r[0] : r[r.indexOf(s) + 1]
          },
          getPrevious() {
            let r = this.all(),
              s = document.activeElement
            if (r.indexOf(s) !== -1)
              return this.__wrapAround && r.indexOf(s) === 0 ? r.slice(-1)[0] : r[r.indexOf(s) - 1]
          },
          first() {
            this.focus(this.getFirst())
          },
          last() {
            this.focus(this.getLast())
          },
          next() {
            this.focus(this.getNext())
          },
          previous() {
            this.focus(this.getPrevious())
          },
          prev() {
            return this.previous()
          },
          focus(r) {
            r &&
              setTimeout(() => {
                r.hasAttribute('tabindex') || r.setAttribute('tabindex', '0'),
                  r.focus({ preventScroll: this.__noscroll })
              })
          },
        }
      }),
      i.directive(
        'trap',
        i.skipDuringClone(
          (a, { expression: n, modifiers: r }, { effect: s, evaluateLater: l, cleanup: m }) => {
            let p = l(n),
              v = !1,
              h = { escapeDeactivates: !1, allowOutsideClick: !0, fallbackFocus: () => a }
            if (r.includes('noautofocus')) h.initialFocus = !1
            else {
              let T = a.querySelector('[autofocus]')
              T && (h.initialFocus = T)
            }
            let y = re(a, h),
              w = () => {},
              S = () => {},
              D = () => {
                w(), (w = () => {}), S(), (S = () => {}), y.deactivate({ returnFocus: !r.includes('noreturn') })
              }
            s(() =>
              p(T => {
                v !== T &&
                  (T &&
                    !v &&
                    (r.includes('noscroll') && (S = Ee()),
                    r.includes('inert') && (w = ae(a)),
                    setTimeout(() => {
                      y.activate()
                    }, 15)),
                  !T && v && D(),
                  (v = !!T))
              }),
            ),
              m(D)
          },
          (a, { expression: n, modifiers: r }, { evaluate: s }) => {
            r.includes('inert') && s(n) && ae(a)
          },
        ),
      )
  }
  function ae(i) {
    let e = []
    return (
      ie(i, t => {
        let a = t.hasAttribute('aria-hidden')
        t.setAttribute('aria-hidden', 'true'), e.push(() => a || t.removeAttribute('aria-hidden'))
      }),
      () => {
        for (; e.length; ) e.pop()()
      }
    )
  }
  function ie(i, e) {
    i.isSameNode(document.body) ||
      !i.parentNode ||
      Array.from(i.parentNode.children).forEach(t => {
        t.isSameNode(i) ? ie(i.parentNode, e) : e(t)
      })
  }
  function Ee() {
    let i = document.documentElement.style.overflow,
      e = document.documentElement.style.paddingRight,
      t = window.innerWidth - document.documentElement.clientWidth
    return (
      (document.documentElement.style.overflow = 'hidden'),
      (document.documentElement.style.paddingRight = `${t}px`),
      () => {
        ;(document.documentElement.style.overflow = i), (document.documentElement.style.paddingRight = e)
      }
    )
  }
  document.addEventListener('alpine:init', () => {
    window.Alpine.plugin(ne)
  })
})()
/*! Bundled license information:

tabbable/dist/index.esm.js:
  (*!
  * tabbable 5.3.3
  * @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
  *)

focus-trap/dist/focus-trap.esm.js:
  (*!
  * focus-trap 6.9.4
  * @license MIT, https://github.com/focus-trap/focus-trap/blob/master/LICENSE
  *)
*/
