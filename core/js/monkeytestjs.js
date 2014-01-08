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
            page.uri = page.url;
            if (page.url.charAt(0) !== '/') {
                page.url = this.baseUrl + page.url;
            }

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
            testsDir: 'mytests/',
            loadSources: true,
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

        if (location.href.substr(0, 4) === 'file') {
            if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
                console.log('Running from local filesystem so disabling loading page sources');
            }
            this.config.loadSources = false;
        }

        // work out the fully-qualified base url of monkeytestjs (this.baseUrl)
        // and our test specs directory (this.testsUrl)
        // some examples and the desired results:
        //   http://domain.com/tests/ -> no change
        //   file:///path/to/tests/index.html -> file:///path/to/tests/
        this.baseUrl = location.href.substr(0, location.href.lastIndexOf('/') + 1);

        // if the testsDir setting begins with a slash, it is considered to be absolute and so is not appended to the
        // baseUrl. We want it to always end with a slash, unless it's an empty string which means to use the baseUrl
        // as the testsDir
        if (this.config.testsDir === '') {
            this.testsUrl = this.baseUrl;
        } else if (this.config.testsDir.charAt(0) === '/') {
            this.testsUrl = this.config.testsDir;
        } else {
            this.testsUrl = this.baseUrl + this.config.testsDir;
        }
        if (this.testsUrl !== '' && this.testsUrl.charAt(this.testsUrl.length - 1) !== '/') {
            this.testsUrl += '/';
        }

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
            var pageTest = new APP.MonkeyTestJSPageTest(this.runner);

            pageTest.testSpec = testSpec;
            pageTest.runner = this.runner;
            pageTest.page = this;
            pageTest.window = pageTest.workspace = this.runner.workspace;
            pageTest.$ = this.runner.workspace.jQuery || this.runner.jQuery;
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
    var MonkeyTestJSPageTest = APP.MonkeyTestJSPageTest = function (runner) {

        // K: This is probably not required. It doesn't seem to
        // be used in the tests
        this.runner = runner;

        this.config = runner.config;

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
                if (f && typeof f === 'function') {
                    f.call(self, self.$);
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
            this.loadPage();
        }

        lookUp[typeof _test === 'function' ? 'isFunction' : 'isObject']();

        QUnit.module('Testing ' + self.page.uri);

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

        lookUp[pageActions ? 'callCurrentPageAction' : 'callNextPage']();
    };

    /**
     * Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
     * performing tests on an actual page, this will normally be the first call in a test chain.
     *
     * @return {Object} context for chaining
     * @param {String} targetUrl load content from url on the workspace
     * @param {String} timeout how long before we keep execution defaults to 5000
     * @memberOf MonkeyTestJSPageTest
     * @api public
     */
    MonkeyTestJSPageTest.prototype.loadPage = function (targetUrl, timeout) {

        var self = this,
            _timeout = timeout || 5000,
            url = targetUrl || this.page.url,
            w = self.window,
            ensureJQuery = function() {
                if (w.jQuery) {
                    self.$ = w.jQuery;
                    loadFn();
                } else {
                    var src = self.runner.jQuery('script[src*=jquery]').attr('src');
                    if (src.charAt(0) !== '/' && src.indexOf('//') !== 0 && src.indexOf('://') < 0) {
                        src = self.runner.baseUrl + src;
                    }
                    var script, firstScript = w.document.getElementsByTagName('script')[0];
                    script = w.document.createElement('script');
                    script.src = src;
                    if (firstScript) {
                        firstScript.parentNode.insertBefore(script, firstScript);
                    } else {
                        var body = w.document.getElementsByTagName('body')[0];
                        body.insertBefore(script, body.lastChild);
                    }
                    setTimeout(function() {
                        self.$ = w.jQuery;
                        loadFn();
                    }, 10);
                }
            },
            callNext = function () {
                clearTimeout(self._waitingTimer);

                self._next();
                self.runner.jQuery('#workspace')
                    .off('load', ensureJQuery);
            },
            loadFn = callNext;
        if (this.config.loadSources) {
            loadFn = function() {
                self._waitingTimer = setTimeout(callNext, _timeout);
                self.page.loadSource(url, function () {
                    callNext();
                });
            };
        }

        this.chain.push(function () {
            self.runner.jQuery('#workspace')
                .on('load', ensureJQuery)
                .attr('src', url);
        });

        return this; // chainable
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
                testFN.call(self, self.$);
            });
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /* A conditonalExpression can be passed to pause execution until its evaluated to true or timesout.
     *
     * @param {Int} conditonalExpression this will be called on an interval until evaluates to true
     * @param {Int} timeout timeout in milliseconds when should wait timeout and continue execution
     * @param {Int} throttle how often should we check for conditional func
     * @memberOf MonkeyTestJSPageTest
     * @return {Object} context for chaining
     * @api public
     */
    MonkeyTestJSPageTest.prototype.wait = function (conditonalExpression,
        timeout, throttle) {
        var self = this,
            func = conditonalExpression || function () {},
            _timeout = timeout || 5000,
            _throttle = throttle || 60;

        var fn = function () {

            var that = this,
                start = new Date();

            setTimeout(function checkCondition() {
                // if we timed out or condition has been met
                if (func() || new Date() - start >= _timeout) {
                    clearTimeout(that._throttle);
                    self._next();
                } else {
                    that._throttle = setTimeout(checkCondition,
                        _throttle);
                }
            }, _throttle);

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
                testFN.call(self, self.$);
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
        this.config = runner.config;
    };

    /**
     * Load script
     *
     * @memberOf MonkeyTestJSTest
     * @api public
     */
    MonkeyTestJSTest.prototype.load = function () {

        var script, firstScript = document.getElementsByTagName('script')[0];
        script = document.createElement('script');
        script.src = this.src.charAt(0) === '/' ? this.src : (this.runner.testsUrl + this.src);
        firstScript.parentNode.insertBefore(script, firstScript);

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

    'use strict';

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {}, // APP namespace
        $$ = global.$$ = global.jQuery.noConflict(true); // jquery no conflict

    $$(function() {
        // MonkeyTestJS can be configured by assigning the configuration object to a global variable monkeytestjs
        // before this script loads. If no such variable has been defined, this script will attempt to load config.json
        // (via ajax) from the server.
        function configured(config) {
            var monkeytestjs = global.monkeytestjs = new APP.MonkeyTestJS(); // create our singleton
            monkeytestjs.start($$.extend({}, {
                workspace: window.frames[0],
                jQuery: $$
            }, config));
        }
        if (typeof global.monkeytestjs === 'object') {
            var config = global.monkeytestjs;
            configured(config);
        } else {
            $$.getJSON('config.json', function (data) {
                configured(data);
            })
                .fail(function () {
                    global.alert(
                        'Failed to load config.json. Please make sure this file exists and it is correctly formatted.\n\n' +
                        'Alternatively, configure MonkeyTestJS by defining a global variable before including the monkeytestjs script:\n\n' +
                        '    var monkeytestjs = <contents of config.json>;'
                    );
                });
        }

    });

}(this));
