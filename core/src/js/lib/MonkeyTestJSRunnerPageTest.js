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
                    f.call(self, self.workspace.jQuery);
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
            this.loadPage()
                .loadPageSource();
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
     * Loads the source of a page (via AJAX) into this.page.source. Waits until the source is loaded before moving to the next
     * chain action. If you are performing test on the page source this will normally be the first call in the test chain.
     *
     * @return {Object} context for chaining
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.loadPageSource = function () {
        var self = this;
        var fn = function () {
            self.page.loadSource(function () {
                self._next();
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
     * performing tests on an actual page, this will normally be the first call in a test chain.
     *
     * @return {Object} context for chaining
     * @param {String} url load content from url on the workspace
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.loadPage = function (url) {
        url = url || this.page.url;

        var self = this;
        var onloadFn = function () {
            self._next();
            self.runner.jQuery('#workspace')
                .off('load', onloadFn);
        };
        var fn = function () {
            self.runner.jQuery('#workspace')
                .on('load', onloadFn);
            self.runner.jQuery('#workspace')
                .attr('src', url);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Pause the chain until a page load takes place. Should be used to wait if a form is submitted or a link click is
     * triggered. Once the page load is complete it'll move to the next chain action.
     *
     * @return {Object} context for chaining
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.waitForPageLoad = function (timeout) {

        var self = this,
            _timeout = timeout || 5000,
            loadFn = function () {
                self._next();
                self.runner.jQuery('#workspace')
                    .off('load', loadFn);
            },
            fn = function () {
                self._waitingTimer = global.setTimeout(loadFn, _timeout);
                self.runner.jQuery('#workspace')
                    .on('load', function () {
                        global.clearTimeout(self._waitingTimer);
                        loadFn();
                    });

            };

        self.chain.push(fn);

        return self; // chainable
    };

    /**
     * Runs arbitrary js code on the page, such as submitting a for, then moves to the next chain action.
     *
     * @param {Function} runFN function to that will be called on a certain workspace using 'MonkeyTestJSPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.run = function (runFN) {
        var self = this;
        var fn = function () {
            runFN.call(self, self.workspace.jQuery);
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Runs an asynchronous task. Must call this.asyncRunDone when the task is complete. Only then will the next chain
     * action be called.
     *
     * @param {Function} runFN function to that will be called on a certain workspace using 'MonkeyTestJSPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.asyncRun = function (runFN) {
        var self = this;
        var fn = function () {
            // must call this.asyncRunDone() to continue the chain
            runFN.call(self, self.workspace.jQuery);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Method to be called by tests running asyncRun once they are finished running.
     *
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.asyncRunDone = function () {
        this._next();
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
                testFN.call(self, self.workspace.jQuery);
            });
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Pause execution of the next chainable method for duration time.
     *
     * @param {Int} duration duration in milliseconds to delay next action execution
     * @memberOf MonkeyTestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJSPageTest.prototype.wait = function (duration) {
        var self = this;
        duration = duration || 1000;

        var fn = function () {
            setTimeout(function () {
                self._next();
            }, duration);
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
                testFN.call(self, self.workspace.jQuery);
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
