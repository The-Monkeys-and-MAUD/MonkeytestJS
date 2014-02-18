/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @return {Object} MonkeyTestJSPageTest instance.
     * @api public
     */
    var MonkeyTestJSPageTest = APP.MonkeyTestJSPageTest = function (runner) {

        this.runner = runner;
        this.config = runner.config;

        // copy the ajax methods from the runner to the test context
        var self = this;
        global.$$.each(['ajax', 'get', 'post'], function(i, method) {
            self[method] = function() {
                return runner[method].apply(runner, arguments);
            };
        });

        this.chain = [];
    };

    /**
     * Run tests for the related page.
     *
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.runTest = function (firstTime, callback) {

        var self = this,
            cb = callback || function () {},
            callTest = function (f) {
                if (f && typeof f === 'function') {
                    f.call(self, self.getJQuery());
                }
            },
            _test = self.testSpec.test,
            lookUp = {
                isFunction: function () {
                    callTest(_test);
                },
                isObject: function () {
                    callTest(_test.setup); // call bootstrap for test
                    callTest(_test.load); // call the test itself
                }
            };

        if (firstTime) {
            // When we run the first tet we want to load the page and source code.
            this.loadPage();
        }

        lookUp[typeof _test === 'function' ? 'isFunction' : 'isObject']();

        QUnit.module('Testing ' + self.page.uri);

        self.start();

        cb();
    };

    /**
     * MonkeyTestJSPageTest chain control methods
     *
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.start = function () {
        this._next();
        return this; // chainable
    };

    /**
     * This is the method responsible for handle chaining. It will call all methods for the current page until
     * there is no more left than it will call the next page.
     *
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype._next = function () {

        var self = this,
            pageActions = this.chain.shift(),
            lookUp = {
                callCurrentPageAction: function () {
                    pageActions.call(self);
                },
                callNextPage: function () {
                    self.runner.nextPageTest();
                }
            };

        lookUp[pageActions ? 'callCurrentPageAction' : 'callNextPage']();
    };

    /**
     * Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
     * performing tests on an actual page, this will normally be the first call in a test chain.
     *
     * @return {Object} context for chaining
     * @param {String} targetUrl load content from url on the workspace
     * @param {String} timeout how long before we keep execution defaults to 5000
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.loadPage = function (targetUrl, timeout) {
        var self = this, url = targetUrl || this.page.url;

        return this.waitForPageLoadAfter(function () {
            self.runner.jQuery('#workspace')
                .attr('src', url);
            // no need to call _next() because waitForPageLoad has installed an event handler that will do that
        });

    };


    MonkeyTestJSPageTest.prototype.waitForPageLoadAfter = function (toExecute, timeout) {

        var self = this,
            _timeout = timeout || 5000,
            w = self.window,
            ensureJQuery = function() {
                if (!self.loadSources) {
                    var doctype = w.document.doctype || {name: 'html'};
                    doctype = "<!DOCTYPE " +
                        doctype.name +
                        (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
                        (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') +
                        (doctype.systemId ? ' "' + doctype.systemId + '"' : '') +
                        '>\n';
                    self.page.source = doctype + w.document.documentElement.outerHTML;
                }

                if (w.jQuery) {
                    loadFn();
                } else {
                    var src = self.runner.jQuery('script[src*=jquery]').attr('src');
                    if (src.charAt(0) !== '/' && src.indexOf('//') !== 0 && src.indexOf('://') < 0) {
                        src = self.runner.baseUrl + src;
                    }
                    var script, firstScript = w.document.getElementsByTagName('script')[0];
                    script = w.document.createElement('script');
                    script.src = src;
                    if (firstScript) {
                        firstScript.parentNode.insertBefore(script, firstScript);
                    } else {
                        var body = w.document.getElementsByTagName('body')[0];
                        body.insertBefore(script, body.lastChild);
                    }
                    setTimeout(function() {
                        loadFn();
                    }, 10);
                }
            },
            callNext = function () {
                clearTimeout(self._waitingTimer);

                self._next();
                self.runner.jQuery('#workspace')
                    .off('load', ensureJQuery);
            },
            loadFn = callNext;
        if (this.config.loadSources) {
            loadFn = function() {
                self._waitingTimer = setTimeout(callNext, _timeout);
                self.page.loadSource(self.runner.jQuery('#workspace').attr('src'), function () {
                    callNext();
                });
            };
        }

        this.chain.push(function () {
            self.runner.jQuery('#workspace')
                .on('load', ensureJQuery);
            toExecute.call(self, self.getJQuery());
        });

        return this; // chainable
    };

    /**
     * Method to be called by tests running asyncRun once they are finished running.
     *
     * @param {String} name name of the test to be run.
     * @param {Function} testFN function to be tested.
     * @memberOf MonkeyTestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJSPageTest.prototype.test = function (name, testFN) {
        var self = this;
        var fn = function () {
            test(name, function () {
                testFN.call(self, self.getJQuery());
            });
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Get a jQuery instance that operates on the content of the test iframe.
     *
     * @returns {Object} jQuery instance tied to the iframe test page's context
     */
    MonkeyTestJSPageTest.prototype.getJQuery = function() {
        return this.runner.workspace.jQuery || this.runner.jQuery;
    };


    /* A conditionalExpression can be passed to pause execution until its evaluated to true or timesout.
     *
     * @param {Int} conditonalExpression this will be called on an interval until evaluates to true
     * @param {Int} timeout timeout in milliseconds when should wait timeout and continue execution
     * @param {Int} throttle how often should we check for conditional func
     * @memberOf MonkeyTestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJSPageTest.prototype.wait = function (conditonalExpression,
        timeout, throttle) {
        var self = this,
            func = conditonalExpression || function () {},
            _timeout = timeout || 5000,
            _throttle = throttle || 60;

        var fn = function () {

            var that = this,
                start = new Date();

            setTimeout(function checkCondition() {
                // if we timed out or condition has been met
                if (func() || new Date() - start >= _timeout) {
                    clearTimeout(that._throttle);
                    self._next();
                } else {
                    that._throttle = setTimeout(checkCondition,
                        _throttle);
                }
            }, _throttle);

        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Runs an asynchronous QUint test. Must call this.asyncTestDone when the test is complete. Only then will the next chain
     * action be called.
     *
     * @param {String} name name of the test to be run.
     * @param {Function} testFN function to be tested.
     * @memberOf MonkeyTestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJSPageTest.prototype.asyncTest = function (name, testFN) {
        var self = this;
        var fn = function () {
            asyncTest(name, function () {
                testFN.call(self, self.getJQuery());
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Method to be called by tests running asyncTest once they are finished running.
     *
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.asyncTestDone = function () {
        var self = this;
        QUnit.start();
        self._next();
    };

}(this));
