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
