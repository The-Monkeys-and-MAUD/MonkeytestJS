/* globals QUnit, test, asyncTest */
(function (global) {

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @return {Object} QUnitRunnerPageTest instance.
     * @api public
     */
    var QUnitRunnerPageTest = global.QUnitRunnerPageTest = function (config) {
        config = config || {};

        global.Utils.__extends(this, config);

        this.chain = [];
    };

    /**
     * Run tests for the related page.
     *
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.runTest = function () {

        var self = this;

        QUnit.module('testing ' + this.page.url + ' with ' + this.testSpec.name);

        if (this.test.test instanceof Function) {
            // test is run on page load
            this.config.jQuery('#workspace')
                .on('load', function () {
                    self.testSpec.test.call(self, self.workspace.jQuery,
                        0);
                });
        } else {
            var loadCount = 0;
            if (this.testSpec.test.setup) {
                this.testSpec.test.setup.call(this);
            }
            if (this.testSpec.test.load) {
                self.testSpec.test.load.call(self, self.workspace.jQuery);
            }
        }

    };

    /**
     * QUnitRunnerPageTest chain control methods
     *
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.start = function () {
        this._next();
        return this; // chainable
    };

    /**
     * This is the method responsible for handle chaining. It will call all methods for the current page until
     * there is no more left than it will call the next page.
     *
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype._next = function () {

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
     *          QUnitRunnerPageTest.env();
     *          // => 'staging'
     *
     * @return {String} environment string
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.env = function () {
        var envs = this.runner.config.envs;
        var env = "notfound";
        var that = this;

        this.runner.jQuery.each(envs, function (envKey, value) {
            var envTests = envs[envKey];

            that.runner.jQuery.each(envTests, function (key, value) {
                if (that.runner.workspace.location.href.indexOf(
                    value) >= 0) {
                    env = envKey;
                    return false;
                }
            });

            if (env !== "notfound") {
                return false;
            }
        });

        return env;
    };

    /**
     * Returns the configuration used by the runner.
     *
     * @return {Object}
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.config = function () {
        return this.runner.config;
    };

    /**
     * Loads the source of a page (via AJAX) into this.page.source. Waits until the source is loaded before moving to the next
     * chain action. If you are performing test on the page source this will normally be the first call in the test chain.
     *
     * @return {Object} context for chaining
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.loadPageSource = function () {
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
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.loadPage = function (url) {
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
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.waitForPageLoad = function () {
        var self = this;
        var loadFn = function () {
            self._next();
            self.runner.jQuery('#workspace')
                .off('load', loadFn);
        };
        var fn = function () {
            self.runner.jQuery('#workspace')
                .on('load', loadFn);

            // TODO - add timeout ...
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Runs arbitrary js code on the page, such as submitting a for, then moves to the next chain action.
     *
     * @param {Function} runFN function to that will be called on a certain workspace using 'QUnitRunnerPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.run = function (runFN) {
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
     * @param {Function} runFN function to that will be called on a certain workspace using 'QUnitRunnerPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.asyncRun = function (runFN) {
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
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.asyncRunDone = function () {
        this._next();
    };

    /**
     * Method to be called by tests running asyncRun once they are finished running.
     *
     * @param {String} name name of the test to be run.
     * @param {Function} testFN function to be tested.
     * @memberOf QUnitRunnerPageTest
     * @return {Object} context for chaining
     * @api public
     */
    QUnitRunnerPageTest.prototype.test = function (name, testFN) {
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
     * @memberOf QUnitRunnerPageTest
     * @return {Object} context for chaining
     * @api public
     */
    QUnitRunnerPageTest.prototype.wait = function (duration) {
        var self = this;
        duration = duration || 1000;

        var fn = function () {
            setTimeout(function () {
                this._next();
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
     * @memberOf QUnitRunnerPageTest
     * @return {Object} context for chaining
     * @api public
     */
    QUnitRunnerPageTest.prototype.asyncTest = function (name, testFN) {
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
     * @memberOf QUnitRunnerPageTest
     * @api public
     */
    QUnitRunnerPageTest.prototype.asyncTestDone = function () {
        var self = this;
        QUnit.start();
        self._next();
    };

}(this));
