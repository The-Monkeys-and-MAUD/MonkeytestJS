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

/* globals QUnit, test, asyncTest */
(function (global) {

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} QUnitRunnerPage instance.
     * @api public
     */
    var QUnitRunnerPage = global.QUnitRunnerPage = function (config, runner) {
        config = config || {};

        global.Utils.__extends(this, config);
        this.source = "";
        this.tests = [];
        this.currentTest = -1;
        this.runner = runner;
    };

    /**
     * Call a callback function after the current page is loaded by the runner.
     *
     * @param {Function} callback callback when page is succesfuly loaded
     * @memberOf QUnitRunnerPage
     * @api public
     */
    QUnitRunnerPage.prototype.loadSource = function (callback) {
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
     * @memberOf QUnitRunnerPage
     * @return {Bool} a test has been run
     * @api public
     */
    QUnitRunnerPage.prototype.runNextTest = function (callback) {
        var testSpec = this.tests.shift(),
            cb = callback || function () {},
            ret = false;

        if (testSpec) {
            var pageTest = new global.QUnitRunnerPageTest({}, this.runner);

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

/* globals QUnit, test, asyncTest */
(function (global) {
    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} QUnitRunnerPage instance.
     * @api public
     */
    var QUnitRunnerTest = global.QUnitRunnerTest = function (config, runner) {
        config = config || {};

        global.Utils.__extends(this, config);
        this.runner = runner;
    };

    /**
     * Load script
     *
     * @memberOf QUnitRunnerTest
     * @api public
     */
    QUnitRunnerTest.prototype.load = function () {
        this.addTestScript("", this.src);
    };

    /**
     * create a script and add it do the dom if there is not one already with same id.
     *
     * @param {Obect} id script id
     * @param {String} src path to the script be loaded.
     * @memberOf QUnitRunnerTest
     * @api public
     */
    QUnitRunnerTest.prototype.addTestScript = function (id, src) {
        src = this.runner.testsUrl + src;
        var d = document;
        var js, ref = d.getElementsByTagName('script')[0];
        //if (d.getElementById(id)) {return;}
        js = d.createElement('script');
        //js.id = id;
        js.async = true;
        js.src = src;
        ref.parentNode.insertBefore(js, ref);
    };

}(this));

/* globals QUnit, test, asyncTest */
(function (global) {

    /**
     * Utility helpers.
     *
     *   * `log` Function - wrapper to allow logs to be output without causing browser error
     *   * `__hasProp` Function - checking for properties that are not part of prototype
     *   * `__extends` Function - extending object and adding constructor reference
     *
     * @api public
     */
    var UTILS = global.Utils = {
        log: function (s) {
            if (global.console) {
                console.log(s);
            }
        },
        registerTest: function (name, test) {
            global.QUnitRunner.registerTest(name, test);
        },
        __extends: function (child, parent) {
            for (var key in parent) {
                if (Object.prototype.hasOwnProperty.call(parent, key)) {
                    child[key] = parent[key];
                }
            }

            function CTor() {
                this.constructor = child;
            }
            if (parent.prototype) {
                CTor.prototype = parent.prototype;
                child.prototype = new CTor();
                child.__super__ = parent.prototype;
            }
            return child;
        }
    },
        log = UTILS.log,
        registerTest = UTILS.registerTest,
        __extends = UTILS.__extends;

    // poluting namespace
    // TODO: maybe get rid of this and just add UTILS to

    global.log = log;
    global.registerTest = registerTest;

}(this));

/* globals QUnit, test, asyncTest */
(function (global) {

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    // jquery no conflict 
    var $$ = global.$$ = global.jQuery.noConflict(true);

    // create our singleton / factory
    global.QUnitRunner = new global.QUnitRunnerClass();

    // TODO: create a nicer method to wrap this startup
    // start runner with json config file
    $$(function () {

        // read configuration from a file called 'config.json'
        $$.getJSON('config.json', function (data) {

            global.QUnitRunner.start($$.extend({}, {
                workspace: window.frames[0],
                jQuery: $$
            }, data));
        })
            .fail(function () {
                global.alert(
                    "Failed to load config.json, please make sure this file exist and it is correctly formatted."
                );
            });

    });

}(this));
