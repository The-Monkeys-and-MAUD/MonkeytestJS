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
    MonkeyTestJSPage.prototype.loadSource = function (callback) {
        if (this.source !== "") {
            callback();
            return;
        }

        var self = this;
        this.runner.jQuery.get(this.url)
            .success(function (data) {
                self.source = data;
                callback();
            })
            .error(function () {
                callback();
            });
    };

    /**
     * Run following tests and returns a boolen if a test has been runned.
     *
     * @param {Function} callback callback when page is succesfuly loaded
     * @memberOf MonkeyTestJSPage
     * @return {Bool} a test has been run
     * @api public
     */
    MonkeyTestJSPage.prototype.runNextTest = function (callback) {
        var testSpec = this.tests.shift(),
            cb = callback || function () {},
            ret = false;

        if (testSpec) {
            var pageTest = new APP.MonkeyTestJSPageTest({}, this.runner);

            pageTest.testSpec = testSpec;
            pageTest.runner = this.runner;
            pageTest.page = this;
            pageTest.window = pageTest.workspace = this.runner.workspace;
            pageTest.$ = this.runner.workspace.jQuery;
            pageTest.runTest();

            ret = true;
        }

        cb(ret);

        return ret;
    };

}(this));
