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
    var MonkeyTestJSPageTest = APP.MonkeyTestJSPageTest = function (config) {
        config = config || {};

        APP.Utils.__extends(this, config);

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
                if (f && typeof f === "function") {
                    f.call(self, self.$);
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

        lookUp[typeof _test === "function" ? "isFunction" : "isObject"]();

        QUnit.module('Testing ' + self.page.url);

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

        lookUp[pageActions ? "callCurrentPageAction" : "callNextPage"]();
    };

    /**
     * Returns the current environment - based on the url of the current page.
     *
     * Example:
     *          MonkeyTestJSPageTest.env();
     *          // => 'staging'
     *
     * @return {String} environment string
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.env = function () {
        var self = this,
            envs = self.runner.config.envs,
            _defaultEnv,
            env;

        env = _defaultEnv = "default";

        this.runner.jQuery.each(envs, function (envKey, value) {
            var envTests = envs[envKey];

            self.runner.jQuery.each(envTests, function (key, value) {
                if (self.runner.workspace.location.href.indexOf(
                    value) >= 0) {
                    env = envKey;
                    return false;
                }
            });

            if (env !== _defaultEnv) {
                return false;
            }
        });

        return env;
    };

    /**
     * Returns the configuration used by the runner.
     *
     * @return {Object}
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.config = function () {
        return this.runner.config;
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

        var self = this,
            _timeout = timeout || 5000,
            url = targetUrl || this.page.url,
            callNext = function () {
                clearTimeout(self._waitingTimer);

                self._next();
                self.runner.jQuery('#workspace')
                    .off('load', loadFn);
            },
            loadFn = function () {
                self._waitingTimer = setTimeout(callNext, _timeout);
                self.page.loadSource(url, function () {
                    callNext();
                });
            },
            fn = function () {
                self.runner.jQuery('#workspace')
                    .on('load', loadFn)
                    .attr('src', url);
            };

        this.chain.push(fn);

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
                testFN.call(self, self.workspace.window.$);
            });
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /* A conditonalExpression can be passed to pause execution until its evaluated to true or timesout.
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
                testFN.call(self, self.$);
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
