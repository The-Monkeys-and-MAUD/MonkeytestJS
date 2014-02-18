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

        // override config settings with environment-specific settings for environments that match the current URL
        global.$$.each(settings, function (settingName, setting) {

            if (setting.hasOwnProperty && setting.hasOwnProperty('env')) {

                var envProps = setting;

                var env = envProps.env;

                global.$$.each(env, function (envKey, envRegExp) {
                    if (!(envRegExp instanceof RegExp)) {
                        envRegExp = new RegExp(envRegExp);
                    }

                    if (envRegExp.test(location.href)) {
                        settings.environment = settingName;

                        global.$$.each(envProps, function (
                            envPropName, envPropValue) {
                            settings[envPropName] =
                                envPropValue;
                        });
                    }

                });

                // after processing the environment object, delete it from the config object so the resulting object
                // will contain only the settings applicable to the detected environment
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

        if (typeof this.config.onFinish === 'function') {
            this.onFinish(this.config.onFinish);
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

        this.setupProxy();

        // setup tests
        this.setupTests();

        // load our test scripts
        this.loadNextTest();

        return this;
    };


    /**
     * Parse the proxyUrl configuration option, and add ajax(), get() and post() methods to the MonkeyTestJS instance
     * that wrap jquery's corresponding methods and proxy requests through a configured server-side proxy script to
     * avoid cross-domain request restrictions.
     */
    MonkeyTestJS.prototype.setupProxy = function() {
        var proxyUrl = this.config.proxyUrl, $ = global.$$, self = this, makeUrl;
        if (proxyUrl.indexOf('<%') >= 0) {
            // need to parse the url as an EJS template
            var template = APP.template(proxyUrl);
            makeUrl = function(proxiedUrl) {
                return template({url: proxiedUrl});
            };
        } else {
            // backward compatibility mode: append the requested URL to the end of the configured URL
            makeUrl = function(proxiedUrl) {
                return proxyUrl + proxiedUrl;
            };
        }

        // wrap jQuery's $.ajax, $.get, $.post functions to proxy cross-domain requests
        this.ajax = function(url, settings) {
            if (typeof url === 'object') {
                settings = url;
                url = settings.url;
            }
            return $.ajax($.extend({}, settings, {
                url: makeUrl(url)
            }));
        };
        $.each( [ "get", "post" ], function( i, method ) {
            self[ method ] = function( url, data, callback, type ) {
                // shift arguments if data argument was omitted
                if ( $.isFunction( data ) ) {
                    type = type || callback;
                    callback = data;
                    data = undefined;
                }

                return self.ajax({
                    url: url,
                    type: method,
                    dataType: type,
                    data: data,
                    success: callback
                });
            };
        });
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
            funcArr[f].call(this);
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

        this.runner = runner;
        this.config = runner.config;

        // copy the ajax methods from the runner to the test context
        var self = this;
        global.$$.each(['ajax', 'get', 'post'], function(i, method) {
            self[method] = function() {
                return runner[method].apply(runner, arguments);
            };
        });

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
                    f.call(self, self.getJQuery());
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
        var self = this, url = targetUrl || this.page.url;

        return this.waitForPageLoadAfter(function () {
            self.runner.jQuery('#workspace')
                .attr('src', url);
            // no need to call _next() because waitForPageLoad has installed an event handler that will do that
        });

    };


    MonkeyTestJSPageTest.prototype.waitForPageLoadAfter = function (toExecute, timeout) {

        var self = this,
            _timeout = timeout || 5000,
            w = self.window,
            ensureJQuery = function() {
                if (!self.loadSources) {
                    var doctype = w.document.doctype || {name: 'html'};
                    doctype = "<!DOCTYPE " +
                        doctype.name +
                        (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '') +
                        (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') +
                        (doctype.systemId ? ' "' + doctype.systemId + '"' : '') +
                        '>\n';
                    self.page.source = doctype + w.document.documentElement.outerHTML;
                }

                if (w.jQuery) {
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
                self.page.loadSource(self.runner.jQuery('#workspace').attr('src'), function () {
                    callNext();
                });
            };
        }

        this.chain.push(function () {
            self.runner.jQuery('#workspace')
                .on('load', ensureJQuery);
            toExecute.call(self, self.getJQuery());
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
                testFN.call(self, self.getJQuery());
            });
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    /**
     * Get a jQuery instance that operates on the content of the test iframe.
     *
     * @returns {Object} jQuery instance tied to the iframe test page's context
     */
    MonkeyTestJSPageTest.prototype.getJQuery = function() {
        return this.runner.workspace.jQuery || this.runner.jQuery;
    };


    /* A conditionalExpression can be passed to pause execution until its evaluated to true or timesout.
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
                testFN.call(self, self.getJQuery());
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

        var script, firstScript = document.getElementsByTagName('script')[0],
            src = this.src.charAt(0) === '/' ? this.src : (this.runner.testsUrl + this.src);
        script = document.createElement('script');
        script.src = src + (src.indexOf('?')>=0 ? '&' : '?') + '_=' + (Math.random()*10000000000000000);
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

/**
 * Adds the _MonkeyTestJS.template() function, which parses an EJS template (passed as text to the function) and returns
 * a precompiled render function that accepts a model object and returns the rendered text.
 *
 * This code has been extracted from the underscore library:
 *
 * Underscore.js 1.5.2
 * http://underscorejs.org
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Underscore may be freely distributed under the MIT license.
 */
(function(global) {
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    var _ = {},
        ArrayProto = Array.prototype,
        nativeKeys  = Object.keys,
        nativeForEach = ArrayProto.forEach,
        slice = ArrayProto.slice;

    _.keys = nativeKeys || function(obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) if (_.has(obj, key)) keys.push(key);
        return keys;
    };

    var each = function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, length = obj.length; i < length; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            var keys = _.keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
            }
        }
    };

    _.defaults = function(obj) {
        each(slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    if (obj[prop] === void 0) obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };


    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /<%=([\s\S]+?)%>/g,
        escape      : /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
        "'":      "'",
        '\\':     '\\',
        '\r':     'r',
        '\n':     'n',
        '\t':     't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(text, data, settings) {
        var render;
        settings = _.defaults({}, settings, _.templateSettings);

        // Combine delimiters into one regular expression via alternation.
        var matcher = new RegExp([
            (settings.escape || noMatch).source,
            (settings.interpolate || noMatch).source,
            (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        // Compile the template source, escaping string literals appropriately.
        var index = 0;
        var source = "__p+='";
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset)
                .replace(escaper, function(match) { return '\\' + escapes[match]; });

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }
            index = offset + match.length;
            return match;
        });
        source += "';\n";

        // If a variable is not specified, place data values in local scope.
        if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n";

        try {
            render = new Function(settings.variable || 'obj', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, _);
        var template = function(data) {
            return render.call(this, data, _);
        };

        // Provide the compiled function source as a convenience for precompilation.
        template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

        return template;
    };

    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};
    APP.template = _.template;

})(this);
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
