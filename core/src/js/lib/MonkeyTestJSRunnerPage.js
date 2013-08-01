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
        this.source = "";
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
            .success(function (data) {
                self.source = data;
                callback();
            })
            .error(function () {
                //log("error occured trying to loadSource");
                callback();
            });
    };

    /**
     * Run tests and return a boolean if there are still other tests.
     *
     * @memberOf MonkeyTestJSPage
     * @return {Bool} return information if there is any other tests to be runned.
     * @api public
     */
    MonkeyTestJSPage.prototype.runNextTest = function (callback) {
        var firstTime = this.totalTestsToBeRunned === this.tests.length,
            lastTime = this.tests.length === 1,
            cb = callback || function () {},
            testSpec = this.tests.shift(),
            ret = false;

        if (testSpec) {
            var pageTest = new APP.MonkeyTestJSPageTest({}, this.runner);

            pageTest.testSpec = testSpec;
            pageTest.runner = this.runner;
            pageTest.page = this;
            pageTest.window = pageTest.workspace = this.runner.workspace;
            pageTest.$ = this.runner.workspace.jQuery;
            pageTest.runTest(firstTime);

            ret = true;
        }

        cb(ret);

        return ret;
    };

}(this));
