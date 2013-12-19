/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

    /**
     * Constructor
     *
     * @return {Object} MonkeyTestJS instance.
     * @api public
     */
    var MonkeyTestJS = APP.MonkeyTestJS = function () {
        this._onCompleteCallback = [];
    };

    /**
     * Prepare tests base on the config.json file on the root of the test folder
     * it should have the global tests associated to it as well as page specific tests.
     *
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.setupTests = function () {

        // global tests
        var globalTests = this.config.globalTests || [];

        // pages
        this.pages = [];
        this.pagesToTest = [];

        // tests scripts
        this.tests = {};
        this.testsToLoad = [];

        // load our pages from the config
        // also loads tests and adds them to this.testToLoad
        for (var i = 0, lenI = this.config.pages.length; i < lenI; i++) {

            var page = new APP.MonkeyTestJSPage(this.config.pages[i]),
                pageTests = this.config.pages[i].tests || [];

            // store runner reference
            page.runner = this;

            // Add the actual name of the MonkeyTestJS
            // dir to the URL
            page.url = location.pathname + page.url;

            // K 20130926: This is not being used afaik
            // add page to be tested
            this.pagesToTest.push(location.pathname + this.config.pages[i].url);

            // add global tests
            for (var j = 0, lenJ = globalTests.length; j < lenJ; j++) {
                page.tests.push(this.getTest(globalTests[j]));
            }

            // add page specific tests 
            for (var k = 0, lenK = pageTests.length; k < lenK; k++) {
                page.tests.push(this.getTest(pageTests[k]));
            }

            page.totalTestsToBeRunned = page.tests.length;

            // add to array of pages
            this.pages.push(page);
        }

    };

    /**
     * Simple wrapper function to register test with the qunitRunner.
     * Returns a MonkeyTestJSTest instance.
     *
     * @memberOf MonkeyTestJS
     * @param {String} src path to the test
     * @return {Object} MonkeyTestJSTest instace
     * @api public
     */
    MonkeyTestJS.prototype.addTest = function (src) {
        var test = this.tests[src] = new APP.MonkeyTestJSTest({
            src: src
        }, this);

        this.testsToLoad.push(test);

        return test;
    };

    /**
     * Gets the test related to the src or create a new test if it doesnt exist one.
     *
     * @memberOf MonkeyTestJS
     * @param {String} src path to the test
     * @return {Object} MonkeyTestJSTest instace
     * @api public
     */
    MonkeyTestJS.prototype.getTest = function (src) {

        // return test or create one
        var test = this.tests[src] || this.addTest(src);

        return test;
    };

    /**
     * Loads current test and all its actions or finish testing.
     *
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.loadNextTest = function () {

        var self = this,
            currentTest = this.loadingCurrentTest = this.testsToLoad.shift(),
            lookUp = {
                loadTest: function () {
                    currentTest.load();
                },
                finishTesting: function () {
                    self.loadTestsDone();
                }
            };

        // load test or finish tests execution
        lookUp[currentTest ? 'loadTest' : 'finishTesting']();
    };

    /**
     * Adds name and function to testcase than get next one.
     *
     * @param {String} name name of the test
     * @param {Function} test function to be executed as the test
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.registerTest = function (name, test) {
        this.loadingCurrentTest.test = test;
        this.loadingCurrentTest.name = name;

        this.loadNextTest();
    };

    /**
     * When all tests finish loading runner is ready to start.
     *
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.loadTestsDone = function () {
        QUnit.start();
        this.startTests();
    };

    /**
     * Start QUnit than load each test from the beggining, until all is finished.
     *
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.startTests = function () {

        this.currentPage = this.pages.shift();
        this.nextPageTest();
    };

    /**
     * Loads next test and assign currentTest to the new loaded test.
     *
     * @memberOf MonkeyTestJS
     * @api public
     */
    MonkeyTestJS.prototype.nextPageTest = function () {
        var self = this;

        if (this.currentPage) {

            this.currentPage.runNextTest(function (response) {

                if (!response) {
                    self.currentPage = self.pages.shift();
                    self.nextPageTest();
                }
            });

        } else if (!this.__FINSHEDRUNNING) {
            this.__FINSHEDRUNNING = true;
            this.__FINISH();
        }

    };

    /**
     * Method to be called by tests running asyncTest once they are finished running.
     *
     * @param {Object} settings startup settings passed usually by config.json file
     * @memberOf MonkeyTestJS
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJS.prototype.start = function (settings) {

        this.config = {
            pageTests: {},
            globalTests: []
        };

        // K: Hack in a fix for the environment specific
        // overrides in config.json
        global.$$.each(settings, function (settingName, setting) {

            if (setting.hasOwnProperty('env')) {

                var envProps = setting;

                var env = envProps.env;

                global.$$.each(env, function (envKey, envString) {

                    if (location.href.indexOf(envString) >= 0) {

                        global.$$.each(envProps, function (
                            envPropName, envPropValue) {
                            settings[envPropName] =
                                envPropValue;
                        });
                    }

                });

                // K: For (probably misplaced) neatness,
                // delete the environment setting
                delete settings[settingName];
            }

        });

        APP.Utils.__extends(this.config, settings || {});

        // fully-qualified base url of test specs directory
        this.testsUrl = /^[^\/]+:\/\/[^\/]+\//.exec(location.href)[0] + // scheme + domain + /
            (function() {
                var l = location.pathname; // trim leading and trailing slashes from the current pathname
                if (l.charAt('0') === '/') {
                    l = l.substring(1);
                }
                if (l.charAt(l.length - 1) === '/') {
                    l = l.substring(0, l.length - 1);
                }
                return l;
            })() + '/tests/';
        this.workspace = this.config.workspace;
        this.jQuery = this.config.jQuery;

        // setup tests
        this.setupTests();

        // load our test scripts
        this.loadNextTest();

        return this;
    };

    /**
     * Attach a hook event to be called once all tests have finished running;
     *
     * @param {Function} callback function to be called when all tests have finished running.
     * @memberOf MonkeyTestJS
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJS.prototype.onFinish = function (callback) {

        if (typeof callback === 'function') {
            this._onCompleteCallback.push(callback);
        }

        return this;
    };

    /**
     * Calls all callbacks that are waiting for the finish event.
     * Should only be called once all tests are completed.
     *
     * @memberOf MonkeyTestJS
     * @return {Boolean} returns true if all callbacks have been succesfuly called.
     * @api public
     */
    MonkeyTestJS.prototype.__FINISH = function () {
        var funcArr = this._onCompleteCallback,
            f, len;

        for (f = 0, len = funcArr.length; f < len; f++) {
            funcArr[f]();
        }

        return true;
    };

}(this));
