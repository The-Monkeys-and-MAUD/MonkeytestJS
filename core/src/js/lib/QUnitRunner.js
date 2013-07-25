/* globals QUnit, test, asyncTest */
(function (global) {

    /**
     * Constructor
     *
     * @return {Object} QUnitRunner instance.
     * @api public
     */
    var QUnitRunner = global.QUnitRunnerClass = function () {};

    /**
     * Prepare tests base on the config.json file on the root of the test folder
     * it should have the global tests associated to it as well as page specific tests.
     *
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.setupTests = function () {

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

            var page = new global.QUnitRunnerPage(this.config.pages[i]),
                pageTests = this.config.pages[i].tests || [];

            // store runner reference
            page.runner = this;

            // add page to be tested
            this.pagesToTest.push(this.config.pages[i].url);

            // add global tests
            for (var j = 0, lenJ = globalTests.length; j < lenJ; j++) {
                page.tests.push(this.getTest(globalTests[j]));
            }

            // add page specific tests 
            for (var k = 0, lenK = pageTests.length; k < lenK; k++) {
                page.tests.push(this.getTest(pageTests[k]));
            }

            // add to array of pages
            this.pages.push(page);
        }

    };

    /**
     * Simple wrapper function to register test with the qunitRunner.
     * Returns a QUnitRunnerTest instance.
     *
     * @memberOf QUnitRunner
     * @param {String} src path to the test
     * @return {Object} QUnitRunnerTest instace
     * @api public
     */
    QUnitRunner.prototype.addTest = function (src) {
        var test = this.tests[src] = new global.QUnitRunnerTest({
            src: src
        }, this);

        this.testsToLoad.push(test);

        return test;
    };

    /**
     * Gets the test related to the src or create a new test if it doesnt exist one.
     *
     * @memberOf QUnitRunner
     * @param {String} src path to the test
     * @return {Object} QUnitRunnerTest instace
     * @api public
     */
    QUnitRunner.prototype.getTest = function (src) {

        // return test or create one
        var test = this.tests[src] || this.addTest(src);

        return test;
    };

    /**
     * Loads current test and all its actions or finish testing.
     *
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.loadNextTest = function () {

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
        lookUp[currentTest ? "loadTest" : "finishTesting"]();
    };

    /**
     * Adds name and function to testcase than get next one.
     *
     * @param {String} name name of the test
     * @param {Function} test function to be executed as the test
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.registerTest = function (name, test) {
        this.loadingCurrentTest.test = test;
        this.loadingCurrentTest.name = name;

        this.loadNextTest();
    };

    /**
     * When all tests finish loading runner is ready to start.
     *
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.loadTestsDone = function () {
        this.startTests();
    };

    /**
     * Start QUnit than load each test from the beggining, until all is finished.
     *
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.startTests = function () {

        QUnit.start();
        this.currentPage = this.pages.shift();
        this.nextPageTest();
    };

    /**
     * Loads next test and assign currentTest to the new loaded test.
     *
     * @memberOf QUnitRunner
     * @api public
     */
    QUnitRunner.prototype.nextPageTest = function () {
        if (this.currentPage && !this.currentPage.runNextTest()) {
            // move to next page and run
            this.currentPage = this.pages.shift();
            this.nextPageTest();
        }
    };

    /**
     * Method to be called by tests running asyncTest once they are finished running.
     *
     * @param {Object} settings startup settings passed usually by config.json file
     * @memberOf QUnitRunner
     * @return {Object} context for chaining
     * @api public
     */
    QUnitRunner.prototype.start = function (settings) {

        this.config = {
            testsDir: '/tests/', // requires leading and trailing slash or just '/' if root of server
            pageTests: {},
            globalTests: []
        };

        global.Utils.__extends(this.config, settings || {});

        // test specs
        this.testsUrl = /^[^\/]+:\/\/[^\/]+\//.exec(location.href)[0] +
            this.config.testsDir;
        this.workspace = this.config.workspace;
        this.jQuery = this.config.jQuery;

        // setup tests
        this.setupTests();

        // load our test scripts
        this.loadNextTest();

        return this;
    };

}(this));
