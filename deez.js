
// Polyfills
// Selectors API Level 1 (http://www.w3.org/TR/selectors-api/)
// http://ajaxian.com/archives/creating-a-queryselector-for-ie-that-runs-at-native-speed
//
if (!document.querySelectorAll) {
    document.querySelectorAll = function(selectors) {
        var style = document.createElement('style'),
            elements = [],
            element;
        document.documentElement.firstChild.appendChild(style);
        document._qsa = [];

        style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
        window.scrollBy(0, 0);
        style.parentNode.removeChild(style);

        while (document._qsa.length) {
            element = document._qsa.shift();
            element.style.removeAttribute('x-qsa');
            elements.push(element);
        }
        document._qsa = null;
        return elements;
    };
}

if (!document.querySelector) {
    document.querySelector = function(selectors) {
        var elements = document.querySelectorAll(selectors);
        return (elements.length) ? elements[0] : null;
    };
}

if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

/* deez.js 1.0.0
 * (c) 2014 David Zuch | MIT
 * a minimal library targeted for lightweight, responsive applications
 *
 * global console */

(function() {
    // setup shortcuts
    var win = window,
        doc = win.document,
        ua = navigator.userAgent,
        slice = Array.prototype.slice,

        metaview = doc.querySelector('meta[name="viewport"]'),
        scrollEl = ua.match(/webkit/i) ? doc.body : doc.documentElement,
        bodyScrollTop = false,

        // reuasble constructor function for prototype setting
        ctor = function(){},

        // constructor
        deez = function(selector, context) {
            return new deez.fn.init(selector, context);
        };

    // most of the prototype methods make use of deez functions further down
    deez.fn = deez.prototype = {
        constructor: deez,

        // default length for a deez object
        length: 0,

        // event handler
        on: function(evs, fn, scope) {
            deez.on(this, evs, fn, scope);

            return this;
        },

        // iterate through elements belonging to deez instance
        each: function(fn) {
            return deez.each(this, fn);
        },

        hasClass: function(classNames) {
            return deez.hasClass(this, classNames);
        },

        removeClass: function(classNames) {
            return deez.removeClass(this, classNames);
        },

        addClass: function(classNames) {
            return deez.addClass(this, classNames);
        },

        toggleClass: function(classNames) {
            return deez.toggleClass(this, classNames);
        },

        extend: function(o) {
            deez.extend(this, o);

            return this;
        },

        // retrieve any property set directly to the deez object
        // main purpose is to retrieve elements by index
        get: function(key) {
            return this[key];
        },

        // read element properties such as offsetHeight or scrollTop
        prop: function(prop) {
            return this[0] && this[0][prop];
        },

        // get or set element attributes
        // pass in an object to set multiple attributes at once
        // pass in an empty string as a value to remove the attribute
        // example get: $el.attr('name');
        // example set: $el.attr('name', 'foo');
        // example set: $el.attr({'name': 'foo', 'data-name': 'bar'});
        // example unset: $el.attr('name', '');
        attr: function(attr, set) {
            if ('object' === typeof attr) {
                for (var key in attr) {
                    this.attr(key, attr[key]);
                }
                return this;
            }
            if (undefined !== set) {
                if (set) {
                    this[0] && this[0].setAttribute(attr, set);
                } else {
                    this[0] && this[0].removeAttribute(attr);
                }
                return this;
            }
            return this[0] && this[0].getAttribute(attr);
        },

        // scroll to first element
        scrollPage: function(offset, time) {
            deez.scrollPage(this, offset, time);

            return this;
        },

        // set innerHTML for multiple elements or
        // get innerHTML for first element
        html: function(html) {
            if (undefined !== html) {
                this.each(function() {
                    this.innerHTML = html;
                });
                return this;
            }
            return this[0] && this[0].innerHTML;
        },

        // set inline style for multiple elements or
        // get existing styles for first element, inline or not
        style: function(prop, val) {
            if ('object' === typeof prop) {
                for (var key in prop) {
                    this.style(key, prop[key]);
                }
                return this;
            }
            if (undefined !== val) {
                this.each(function() {
                    this.style[prop] = val;
                });
                return this;
            }
            return deez.getStyle(this, prop);
        }
    };

    // constructor, matches selector and returns deez object with matched elements
    var init = deez.fn.init = function(selector, context) {
            if (!selector) { return this; }
            if (selector instanceof deez) { return selector; }
            if (context && context instanceof deez) { context = context[0]; }

            var match;
            // if array of selectors, join into one
            if (Array.isArray(selector) && selector[0] && 'string' === typeof selector[0]) {
                selector = selector.join(', ');
            }
            if ('string' === typeof selector) {
                // Experimental: if ID, match ID (faster), else match query
                if (/^#[^\s><+~*\[\]]+$/.test(selector)) {
                    match = [deez.matchId(selector.substr(1), context)];
                // Experimental: if tag, match tag (faster), else match query
                } else if (/^\w+[A-Za-z0-9]?$/.test(selector)) {
                    match = deez.matchTags(selector, context);
                } else {
                    match = slice.call((context || doc).querySelectorAll(selector), 0);
                }
            } else if (selector.tagName || selector === win || selector === doc) {
                match = [selector];
            }

            this.length = match && match.length;
            this.extend(Object(match));

            return this;
        },

        // deez properties and functions
        fns = {
            UA: ua,

            scrollEl: scrollEl,

            // event handling
            on: function(selector, evs, fn, scope) {
                var self = this,
                    $el = selector instanceof deez ? selector : deez(selector);
                evs = evs.split(' ');

                $el.each(function() {
                    for (var i = 0, l = evs.length; i < l; i++) {
                        self._addEvent(this, evs[i], fn, scope);
                    }
                });
            },

            _addEvent: function(el, ev, fn, scope) {
                scope = scope || ev;
                if (el.addEventListener) {
                    el.addEventListener(ev, function(e) {
                        fn.call(scope, e);
                    }, false);
                } else if (el.attachEvent) { // IE
                    el.attachEvent('on' + ev, function() {
                        fn.call(scope, window.event);
                    });
                }
            },

            // iterate through array
            each: function(arr, fn) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    if (false === fn.call(arr[i], i)) { break; }
                }
                return arr;
            },

            // dom selectors
            matchId: function(id, context) {
                if (context && context instanceof deez) { context = context[0]; }
                return (context || doc).getElementById(id);
            },

            matchTags: function(tag, context) {
                if (context && context instanceof deez) { context = context[0]; }
                return slice.call((context || doc).getElementsByTagName(tag), 0);
            },

            matchTag: function(tag, context) {
                if (context && context instanceof deez) { context = context[0]; }
                return this.matchTags(tag, context)[0];
            },

            // dom class functions
            hasClass: function(selector, classNames) {
                var $el = selector instanceof deez ? selector : deez(selector),
                    match = false;
                classNames = classNames.split(' ');

                $el.each(function() {
                    for (var i = 0, l = classNames.length; i < l; i++) {
                        if ((' '+this.className+' ').indexOf(' '+classNames[i]+' ') !== -1) {
                            match = true;
                            break;
                        }
                    }

                    if (match) { return false; }
                });

                return match;
            },

            removeClass: function(selector, classNames) {
                var $el = selector instanceof deez ? selector : deez(selector);
                classNames = classNames.split(' ');

                $el.each(function() {
                    if ('className' in this && this.className) {
                        for (var i = 0, l = classNames.length; i < l; i++) {
                            this.className = (' '+this.className+' ').replace(' '+classNames[i]+' ', ' ').trim();
                        }
                    }
                });

                return $el;
            },

            addClass: function(selector, classNames) {
                var self = this,
                    $el = selector instanceof deez ? selector : deez(selector);
                classNames = classNames.split(' ');

                $el.each(function() {
                    for (var i = 0, l = classNames.length; i < l; i++) {
                        if (!self.hasClass(this, classNames[i])) {
                            this.className = this.className.trim() + ' ' + classNames[i];
                        }
                    }
                });

                return $el;
            },

            toggleClass: function(selector, classNames) {
                var self = this,
                    $el = selector instanceof deez ? selector : deez(selector);
                classNames = classNames.split(' ');

                $el.each(function() {
                    for (var i = 0, l = classNames.length; i < l; i++) {
                        var className = classNames[i];
                        if (self.hasClass(this, className)) {
                            self.removeClass(this, className);
                        } else {
                            self.addClass(this, className);
                        }
                    }
                });

                return $el;
            },

            // get computed or inline styles for an element
            getStyle: function(selector, prop) {
                var el = (selector instanceof deez ? selector : deez(selector))[0];

                if (win.getComputedStyle) { // standard
                    return win.getComputedStyle(el)[prop];
                } else if (el.currentStyle) { // IE
                    return el.currentStyle[prop];
                } else { // may as well try
                    return el.style[prop];
                }
            },

            extend: function(source, add) {
                if (!source || !add) { return; }
                for (var key in add) {
                    source[key] = add[key];
                }
            },

            // ripped straight out of underscore.js
            bind: function(fn, context) {
                var nativeBind = Function.prototype.bind,
                    args, bound;

                if (nativeBind && fn.bind === nativeBind) {
                    return nativeBind.apply(fn, slice.call(arguments, 1));
                }

                if ('function' !== typeof fn) { throw new TypeError(); }

                args = slice.call(arguments, 2);

                return bound = function() {
                    if (!(this instanceof bound)) {
                        return fn.apply(context, args.concat(slice.call(arguments)));
                    }
                    ctor.prototype = fn.prototype;
                    var self = new ctor();
                    ctor.prototype = null;
                    var result = fn.apply(self, args.concat(slice.call(arguments)));
                    if (Object(result) === result) { return result; }
                    return self;
                };
            },

            bindAll: function(o) {
                var self = this,
                    fns = slice.call(arguments, 1);
                if (!fns.length) {
                    throw new Error('bindAll must be passed funciton names');
                }
                this.each(fns, function() {
                    o[this] = self.bind(o[this], o);
                });
                return o;
            },

            // create a new inline stylesheet
            newStyle: function(css) {
                if (!css || 'string' !== typeof css) { return false; }
                var self = this,
                    head = deez('head')[0],
                    style = doc.createElement('style');

                style.type = 'text/css';
                style.media = 'screen';
                if (style.styleSheet) {
                    style.styleSheet.cssText = css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }

                head.appendChild(style);

                style.update = function(css) {
                    self.updateStyle(this, css);
                };

                return style;
            },

            updateStyle: function(style, css) {
                if (!style || 'style' !== style.tagName.toLowerCase()) {
                    return this.newStyle(css);
                }
                if (style.styleSheet) {
                    style.styleSheet.cssText += css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }
                return style;
            },

            replaceStyle: function(style, css) {
                if (!style || 'style' !== style.tagName.toLowerCase()) {
                    style.parentNode.removeChild(style);
                }
                return this.newStyle(css);
            },

            // scroll the page to position of targeet
            // target can be an integer or element
            scrollPage: function(target, offset, time) {
                if (undefined === target) { return; }
                if (!offset && isNaN(offset) && this.scrollOffset) {
                    offset = this.scrollOffset;
                    if ('function' === typeof offset) { offset = offset(); }
                }

                offset = offset && isNaN(offset) ? deez(offset).prop('offsetHeight') : offset || 0;
                target = isNaN(target) ? deez(target).prop('offsetTop') + offset : target;
                time = time || 500;

                var from = scrollEl.scrollTop,
                    start = new Date().getTime(),
                    timer = setInterval(function() {
                        var step = Math.min(1, (new Date().getTime()-start) / time);
                        scrollEl.scrollTop = (from + step * (target - from));
                        if (1 === step) { clearInterval(timer); }
                    }, 25);
            },

            setScrollOffset: function(offset) {
                this.scrollOffset = offset;
            },

            // mobile fixes
            scaleFix: function() {
                if (metaview && /iPhone|iPad|iPod/.test(ua) && !/Opera Mini/.test(ua)) {
                    metaview.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
                    doc.addEventListener('gesturestart', this.gestureStart, false);
                }
            },

            gestureStart: function() {
                metaview.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
            },

            hideUrlBarOnLoad: function() {
                var self = this,
                    bodycheck;

                // If there's a hash, or addEventListener is undefined, stop here
                if (!location.hash && win.addEventListener) {

                    // scroll to 1
                    win.scrollTo(0, 1);
                    bodyScrollTop = 1;

                    // reset to 0 on bodyready, if needed
                    bodycheck = setInterval(function() {
                        if (doc.body) {
                            clearInterval(bodycheck);
                            bodyScrollTop = self.getScrollTop();
                            self.hideUrlBar();
                        }
                    }, 15);

                    self.on(win, 'load', function() {
                        setTimeout(function() {
                            if (self.getScrollTop() < 20) {
                                self.hideUrlBar();
                            }
                        }, 0);
                    });
                }
            },

            hideUrlBar: function() {
                if (!location.hash && bodyScrollTop !== false) {
                    win.scrollTo(0, bodyScrollTop === 1 ? 0 : 1);
                }
            },

            getScrollTop: function() {
                return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
            },

            enableActive: function() {
                doc.addEventListener('touchstart', ctor, false);
            },

            // serialize form data
            serialize: function(data) {
                var arr = [];
                for (var key in data) {
                    arr.push(key + '=' + data[key]);
                }
                return arr.join('&');
            },

            initMobileFixes: function() {
                this.scaleFix();
                this.hideUrlBarOnLoad();
                this.enableActive();
            }
        };

    init.prototype = deez.fn;

    fns.extend(deez, fns);

    // export as Common JS module
    if ('undefined' !== typeof module && module.exports) {
        module.exports = deez;
    }
    // or AMD module
    else if ('function' === typeof define && define.amd) {
        define(function() {
            return deez;
        });
    }
    // or set as browser global
    else {
        window.deez = deez;
    }
})();