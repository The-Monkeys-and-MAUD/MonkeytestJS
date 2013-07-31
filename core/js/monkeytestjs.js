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
    var MonkeyTestJS = APP.MonkeyTestJS = function () {};

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
        lookUp[currentTest ? "loadTest" : "finishTesting"]();
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
     * @memberOf MonkeyTestJS
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJS.prototype.start = function (settings) {

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
        var firstTime = this.totalTestsToBeRunned === this.tests.length,
            testSpec = this.tests.shift(),
            cb = callback || function () {},
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
    MonkeyTestJSPageTest.prototype.runTest = function (firstTime) {

        var self = this,
            callTest = function(f) {
                if( f && typeof f === "function" ) {
                    f.call(self, self.workspace.jQuery);
                }
            },
            _test = self.testSpec.test,
            lookUp = {
                isFunction: function() {
                    callTest( _test );
                },
                isObject: function() {
                    callTest( _test.setup ); // call bootstrap for test
                    callTest( _test.load ); // call the test itself
                }
            };

        if(firstTime) {
            // When we run the first tet we want to load the page and source code.
            this.loadPage().loadPageSource();
        }

        lookUp[ typeof _test === "function" ? "isFunction": "isObject"]();

        QUnit.module('Testing ' + self.page.url);

        self.start();
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
    MonkeyTestJSPageTest.prototype.waitForPageLoad = function ( timeout ) {

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
                    .on('load', function() { 
                        global.clearTimeout( self._waitingTimer );
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
    var MonkeyTestJSTest = APP.MonkeyTestJSTest = function (config, runner) {
        config = config || {};

        APP.Utils.__extends(this, config);
        this.runner = runner;
    };

    /**
     * Load script
     *
     * @memberOf MonkeyTestJSTest
     * @api public
     */
    MonkeyTestJSTest.prototype.load = function () {

        var self = this,
            time = new Date();

        global.$$.ajax({
           url: self.runner.testsUrl + self.src,
           success: function(data, textStatus) {
                //global.log("Test ready on ", new Date(), " - loading on (ms): ", new Date() - time);
           },
           error: function(error) {
                //global.log("Request to load " + src + " failed. ", error);
           },
           dataType: 'script',
           async: false
        });

        return true;
    };

}(this));

/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

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

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {}, // APP namespace
        $$ = global.$$ = global.jQuery.noConflict(true), // jquery no conflict 
        monkeytestjs = global.monkeytestjs = new APP.MonkeyTestJS(), // create our singleton
        START = function() {
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

        };

    // When dom is ready read 'config.json' file and kickstart application.
    $$(START);

}(this));
