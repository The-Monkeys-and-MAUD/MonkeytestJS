/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} MonkeyTestJSPage instance.
     * @api public
     */
    var MonkeyTestJSPage = APP.MonkeyTestJSPage = function (config, runner) {
        config = config || {};

        APP.Utils.__extends(this, config);
        this.source = '';
        this.tests = [];
        this.currentTest = -1;
        this.runner = runner;
    };

    /**
     * Call a callback function after the current page is loaded by the runner.
     *
     * @param {Function} callback callback when page is succesfuly loaded
     * @memberOf MonkeyTestJSPage
     * @api public
     */
    MonkeyTestJSPage.prototype.loadSource = function (targetUrl, callback) {
        var self = this,
            url = targetUrl || this.url;

        this.runner.jQuery.get(url)
            .success(function (data, textStatus, jqXHR) {
                self.status = jqXHR.status;
                self.source = data;
                callback();
            })
            .error(function (jqXHR) {
                self.status = jqXHR.status;
                self.source = jqXHR.responseText;
                callback();
            });
    };

    /**
     * Run tests and return a boolean if there are still other tests.
     *
     * @memberOf MonkeyTestJSPage
     * @return {boolean} return information if there is any other tests to be runned.
     * @api public
     */
    MonkeyTestJSPage.prototype.runNextTest = function (callback) {
        var firstTime = this.totalTestsToBeRunned === this.tests.length,
            lastTime = this.tests.length === 1,
            cb = callback || function () {},
            testSpec = this.tests.shift();

        if (testSpec) {
            var self = this;
            var doRunTest = function() {
                var pageTest = new APP.MonkeyTestJSPageTest(self.runner);

                pageTest.testSpec = testSpec;
                pageTest.runner = self.runner;
                pageTest.page = self;
                pageTest.window = pageTest.workspace = self.runner.workspace;
                pageTest.runTest(firstTime);

                cb(true);
            };
            if (firstTime) {
                if (typeof this.runner.config.onLoadPage === 'function') {
                    this.runner.config.onLoadPage.call(this, this.url);
                }
                if (typeof this.runner.config.onLoadPageAsync === 'function') {
                    this.runner.config.onLoadPageAsync.call(this, this.url, doRunTest);
                } else {
                    doRunTest();
                }
            } else {
                doRunTest();
            }

        } else {
            var done = function() {
                cb(false);
            };
            if (typeof this.runner.config.onPageTestsComplete === 'function') {
                this.runner.config.onPageTestsComplete.call(this);
            }
            if (typeof this.runner.config.onPageTestsCompleteAsync === 'function') {
                this.runner.config.onPageTestsCompleteAsync.call(this, this.url, done);
            } else {
                done();
            }
        }

        return !!testSpec;
    };

}(this));
