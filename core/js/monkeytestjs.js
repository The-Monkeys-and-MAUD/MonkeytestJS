/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    /**
     * Constructor
     *
     * @return {Object} MonkeytestJS instance.
     * @api public
     */
    var MonkeytestJS = APP.MonkeytestJS = function () {};

    /**
     * Prepare tests base on the config.json file on the root of the test folder
     * it should have the global tests associated to it as well as page specific tests.
     *
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.setupTests = function () {

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

            var page = new APP.MonkeytestJSPage(this.config.pages[i]),
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
     * Returns a MonkeytestJSTest instance.
     *
     * @memberOf MonkeytestJS
     * @param {String} src path to the test
     * @return {Object} MonkeytestJSTest instace
     * @api public
     */
    MonkeytestJS.prototype.addTest = function (src) {
        var test = this.tests[src] = new APP.MonkeytestJSTest({
            src: src
        }, this);

        this.testsToLoad.push(test);

        return test;
    };

    /**
     * Gets the test related to the src or create a new test if it doesnt exist one.
     *
     * @memberOf MonkeytestJS
     * @param {String} src path to the test
     * @return {Object} MonkeytestJSTest instace
     * @api public
     */
    MonkeytestJS.prototype.getTest = function (src) {

        // return test or create one
        var test = this.tests[src] || this.addTest(src);

        return test;
    };

    /**
     * Loads current test and all its actions or finish testing.
     *
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.loadNextTest = function () {

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
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.registerTest = function (name, test) {
        this.loadingCurrentTest.test = test;
        this.loadingCurrentTest.name = name;

        this.loadNextTest();
    };

    /**
     * When all tests finish loading runner is ready to start.
     *
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.loadTestsDone = function () {
        this.startTests();
    };

    /**
     * Start QUnit than load each test from the beggining, until all is finished.
     *
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.startTests = function () {

        QUnit.start();
        this.currentPage = this.pages.shift();
        this.nextPageTest();
    };

    /**
     * Loads next test and assign currentTest to the new loaded test.
     *
     * @memberOf MonkeytestJS
     * @api public
     */
    MonkeytestJS.prototype.nextPageTest = function () {
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
     * @memberOf MonkeytestJS
     * @return {Object} context for chaining
     * @api public
     */
    MonkeytestJS.prototype.start = function (settings) {

        this.config = {
            testsDir: '/tests/', // requires leading and trailing slash or just '/' if root of server
            pageTests: {},
            globalTests: []
        };

        APP.Utils.__extends(this.config, settings || {});

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

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} MonkeytestJSPage instance.
     * @api public
     */
    var MonkeytestJSPage = APP.MonkeytestJSPage = function (config, runner) {
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
     * @memberOf MonkeytestJSPage
     * @api public
     */
    MonkeytestJSPage.prototype.loadSource = function (callback) {
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
     * @memberOf MonkeytestJSPage
     * @return {Bool} a test has been run
     * @api public
     */
    MonkeytestJSPage.prototype.runNextTest = function (callback) {
        var testSpec = this.tests.shift(),
            cb = callback || function () {},
            ret = false;

        if (testSpec) {
            var pageTest = new APP.MonkeytestJSPageTest({}, this.runner);

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

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @return {Object} MonkeytestJSPageTest instance.
     * @api public
     */
    var MonkeytestJSPageTest = APP.MonkeytestJSPageTest = function (config) {
        config = config || {};

        APP.Utils.__extends(this, config);

        this.chain = [];
    };

    /**
     * Run tests for the related page.
     *
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.runTest = function () {

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
     * MonkeytestJSPageTest chain control methods
     *
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.start = function () {
        this._next();
        return this; // chainable
    };

    /**
     * This is the method responsible for handle chaining. It will call all methods for the current page until
     * there is no more left than it will call the next page.
     *
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype._next = function () {

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
     *          MonkeytestJSPageTest.env();
     *          // => 'staging'
     *
     * @return {String} environment string
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.env = function () {
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
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.config = function () {
        return this.runner.config;
    };

    /**
     * Loads the source of a page (via AJAX) into this.page.source. Waits until the source is loaded before moving to the next
     * chain action. If you are performing test on the page source this will normally be the first call in the test chain.
     *
     * @return {Object} context for chaining
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.loadPageSource = function () {
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
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.loadPage = function (url) {
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
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.waitForPageLoad = function () {
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
     * @param {Function} runFN function to that will be called on a certain workspace using 'MonkeytestJSPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.run = function (runFN) {
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
     * @param {Function} runFN function to that will be called on a certain workspace using 'MonkeytestJSPageTest' as context.
     * @return {Object} context for chaining
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.asyncRun = function (runFN) {
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
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.asyncRunDone = function () {
        this._next();
    };

    /**
     * Method to be called by tests running asyncRun once they are finished running.
     *
     * @param {String} name name of the test to be run.
     * @param {Function} testFN function to be tested.
     * @memberOf MonkeytestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeytestJSPageTest.prototype.test = function (name, testFN) {
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
     * @memberOf MonkeytestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeytestJSPageTest.prototype.wait = function (duration) {
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
     * @memberOf MonkeytestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeytestJSPageTest.prototype.asyncTest = function (name, testFN) {
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
     * @memberOf MonkeytestJSPageTest
     * @api public
     */
    MonkeytestJSPageTest.prototype.asyncTestDone = function () {
        var self = this;
        QUnit.start();
        self._next();
    };

}(this));

/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} MonkeytestJSPage instance.
     * @api public
     */
    var MonkeytestJSTest = APP.MonkeytestJSTest = function (config, runner) {
        config = config || {};

        APP.Utils.__extends(this, config);
        this.runner = runner;
    };

    /**
     * Load script
     *
     * @memberOf MonkeytestJSTest
     * @api public
     */
    MonkeytestJSTest.prototype.load = function () {
        this.addTestScript("", this.src);
    };

    /**
     * create a script and add it do the dom if there is not one already with same id.
     *
     * @param {Obect} id script id
     * @param {String} src path to the script be loaded.
     * @memberOf MonkeytestJSTest
     * @api public
     */
    MonkeytestJSTest.prototype.addTestScript = function (id, src) {
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

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    /**
     * Utility helpers.
     *
     *   * `__extends` Function - extending object and adding constructor reference
     *   * `log` Function - Wrapper on console.log to avoid undefined errors.
     *   * `registerTest` Function - wrapper to allow test suites to be created
     *
     * @api public
     */
    var UTILS = APP.Utils = {
        log: function (s) {
            if (global.console) {
                console.log(s);
            }
        },
        registerTest: function (name, test) {
            global.monkeytestjs.registerTest(name, test);
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

    // APP namespace
    var APP = global._MonkeytestJS = global._MonkeytestJS || {};

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    // jquery no conflict 
    var $$ = global.$$ = global.jQuery.noConflict(true);

    // create our singleton / factory
    var monkeytestjs = global.monkeytestjs = new APP.MonkeytestJS();

    // TODO: create a nicer method to wrap this startup
    // start runner with json config file
    $$(function () {

        // read configuration from a file called 'config.json'
        $$.getJSON('config.json', function (data) {

            monkeytestjs.start($$.extend({}, {
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
