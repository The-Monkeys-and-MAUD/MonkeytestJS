/*globals QUnit, test, asyncTest */ 

(function(global) {

    global.QUnit.config.autostart = false;
    
    var $$ = global.$$ = global.jQuery.noConflict(true);

    var utils = {
            log: function(s) {
                if (global.console) {
                    console.log(s);
                }
            },
            __hasProp: Object.prototype.hasOwnProperty,
            __extends: function(child, parent) {
                for (var key in parent) {
                    if (__hasProp.call(parent, key)) {
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
        log = utils.log,
        __hasProp = utils.__hasProp,
        __extends = utils.__extends;

    /**
     * Simple wrapper function to register test with the qunitRunner
     * @param name
     * @param test
     */
    var registerTest = function(name, test) {
        global.QUnitRunner.registerTest(name, test);
    };

    var QUnitRunner = function() {};

    QUnitRunner.prototype.setupTests = function() {
        
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
        for (var i = 0, lenI=this.config.pages.length; i < lenI; i++) {

            var page = new QUnitRunnerPage(this.config.pages[i]),
                pageTests = this.config.pages[i].tests || [];

            // store runner reference
            page.runner = this;

            // add page to be tested
            this.pagesToTest.push(this.config.pages[i].url);

            // add global tests
            for (var j = 0, lenJ=globalTests.length; j<lenJ; j++) {
                page.tests.push(this.getTest(globalTests[j]));
            }

            // add page specific tests 
            for (var k=0, lenK=pageTests.length; k<lenK; k++) {
                page.tests.push(this.getTest(pageTests[k]));
            }

            // add to array of pages
            this.pages.push(page);
        }

    };

    QUnitRunner.prototype.addTest = function(src) {
        var test = this.tests[src] = new QUnitRunnerTest({
            src: src
        }, this);

        this.testsToLoad.push(test);

        return test;
    };

    QUnitRunner.prototype.getTest = function(src) {

        // return test or create one
        var test = this.tests[src] || this.addTest(src);

        return test;
    };

    QUnitRunner.prototype.loadNextTest = function() {

        var self = this, 
            currentTest = this.loadingCurrentTest = this.testsToLoad.shift(),
            lookUp = {
                loadTest: function() {
                    currentTest.load();
                },
                finishTesting: function() {
                    self.loadTestsDone();
                }
            };
        
        // load test or finish tests execution
        lookUp[currentTest ? "loadTest" : "finishTesting"]();
    };

    QUnitRunner.prototype.registerTest = function(name, test) {
        this.loadingCurrentTest.test = test;
        this.loadingCurrentTest.name = name;

        this.loadNextTest();
    };

    QUnitRunner.prototype.loadTestsDone = function() {
        this.startTests();
    };

    QUnitRunner.prototype.startTests = function() {

        QUnit.start();
        this.currentPage = this.pages.shift();
        this.nextPageTest();
    };

    QUnitRunner.prototype.nextPageTest = function() {
        if (this.currentPage && !this.currentPage.runNextTest()) {
            // move to next page and run
            this.currentPage = this.pages.shift();
            this.nextPageTest();
        } 
    };


    /********************************************************************************
     * QUnitRunnerPage
     */

    var QUnitRunnerPage = function(config, runner) {
        config = config || {};

        __extends(this, config);
        this.source = "";
        this.tests = [];
        this.currentTest = -1; 
        this.runner = runner;
    };

    QUnitRunnerPage.prototype.loadSource = function(callback) {
        if (this.source !== "") {
            callback();
            return;
        }

        var self = this;
        this.runner.jQuery.get(this.url)
        .success(function(data) {
            self.source = data;
            callback();
        })
        .error(function() {
            callback();
        });
    };

    QUnitRunnerPage.prototype.runNextTest = function(callback) {
        var testSpec = this.tests.shift(),
            ret;

        if (testSpec) {
            var pageTest = new QUnitRunnerPageTest({}, this.runner);

            pageTest.testSpec = testSpec;
            pageTest.runner = this.runner;
            pageTest.page = this;
            pageTest.window = pageTest.workspace = this.runner.workspace;
            pageTest.$ = this.runner.workspace.jQuery;
            pageTest.runTest();

            ret = true;
        } else {

            ret = false;
        }

        return ret;
    };


    /********************************************************************************
     * QUnitRunnerTest
     */

    var QUnitRunnerTest = function(config, runner) {
        config = config || {};

        __extends(this, config);
        this.runner = runner;
    };

    QUnitRunnerTest.prototype.load = function(callback) {
        this.addTestScript("", this.src);
    };

    QUnitRunnerTest.prototype.addTestScript = function(id, src) {
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

    /********************************************************************************
     * QUnitRunnerPage
     */

    var QUnitRunnerPageTest = function(config) {
        config = config || {};

        __extends(this, config);

        this.chain = [];
    };

    QUnitRunnerPageTest.prototype.runTest = function() {
        //log('->testPageTest starting ' + this.page.url + ' with ' + this.testSpec.name);

        var self = this;

        QUnit.module('testing ' + this.page.url + ' with ' + this.testSpec.name);

        if (this.test.test instanceof Function) {
            // test is run on page load
            this.config.jQuery('#workspace').on('load', function() {
                self.testSpec.test.call(self, self.workspace.jQuery, 0);
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
     */


    QUnitRunnerPageTest.prototype.start = function() {
        //log('->testPageTest  ' + this.page.url + ':' + this.testSpec.name + " start " + this.chain.length);
        this._next();
        return this; // chainable
    };


    QUnitRunnerPageTest.prototype._next = function() {
        //log('->testPageTest  ' + this.page.url + ':' + this.testSpec.name + " _next");
        var fn = this.chain.shift();
        if (fn) {
            fn.call(this);
        } else {
            //log('->testPageTest complete ' + this.page.url + ' with ' + this.testSpec.name);
            this.runner.nextPageTest();
        }
    };

    /**
     * QUnitRunnerPageTest utility methods - these are not chainable!
     */

    QUnitRunnerPageTest.prototype.env = function() {
        var envs = this.runner.config.envs;
        var env = "notfound";
        var that = this;

        this.runner.jQuery.each(envs, function(envKey, value) {
            var envTests = envs[envKey];

            that.runner.jQuery.each(envTests, function(key, value) {
                if (that.runner.workspace.location.href.indexOf(value) >= 0) {
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

    QUnitRunnerPageTest.prototype.config = function() {
        return this.runner.config;
    };

    /**
     * QUnitRunnerPageTest methods - these are all chainable
     */

    QUnitRunnerPageTest.prototype.loadPageSource = function() {
        var self = this;
        var fn = function() {
            self.page.loadSource(function() {
                self._next();
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.loadPage = function(url) {
        url = url || this.page.url;

        var self = this;
        var onloadFn = function() {
            self._next();
            self.runner.jQuery('#workspace').off('load', onloadFn);
        };
        var fn = function() {
            self.runner.jQuery('#workspace').on('load', onloadFn);
            self.runner.jQuery('#workspace').attr('src', url);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.waitForPageLoad = function() {
        var self = this;
        var loadFn = function() {
            self._next();
            self.runner.jQuery('#workspace').off('load', loadFn);
        };
        var fn = function() {
            self.runner.jQuery('#workspace').on('load', loadFn);

            // TODO - add timeout ...
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.run = function(runFN) {
        var self = this;
        var fn = function() {
            runFN.call(self, self.workspace.jQuery);
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncRun = function(runFN) {
        var self = this;
        var fn = function() {
            // must call this.asyncRunDone() to continue the chain
            runFN.call(self, self.workspace.jQuery);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncRunDone = function() {
        this._next();
    };

    QUnitRunnerPageTest.prototype.test = function(name, testFN) {
        var self = this;
        var fn = function() {
            test(name, function() {
                testFN.call(self, self.workspace.jQuery);
            });
            QUnit.start();
            self._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.wait = function(duration) {
        var self = this;
        duration = duration || 1000;

        var fn = function() {
            setTimeout(function() {
                this._next();
            }, duration);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncTest = function(name, testFN) {
        var self = this;
        var fn = function() {
            asyncTest(name, function() {
                testFN.call(self, self.workspace.jQuery);
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncTestDone = function() {
        var self = this;
        QUnit.start();
        self._next();
    };

    QUnitRunner.prototype.start = function(settings) {

        this.config = {
            testsDir: '/tests/', // requires leading and trailing slash or just '/' if root of server
            pageTests: {},
            globalTests: []
        };

        __extends(this.config, settings || {});

        // test specs
        this.testsUrl = /^[^\/]+:\/\/[^\/]+\//.exec(location.href)[0] + this.config.testsDir;
        this.workspace = this.config.workspace;
        this.jQuery = this.config.jQuery;

        // setup tests
        this.setupTests();

        // load our test scripts
        this.loadNextTest();

        return this;
    };

    // pollute the global namespace
    global.QUnitRunnerPageTest = QUnitRunnerPageTest;
    global.log = log;
    global.registerTest = registerTest;

    // create our singleton / factory
    global.QUnitRunner = new QUnitRunner();


    // start runner with json config file
    $$(function() {

      $$.getJSON('config.json', function(data) {

        global.QUnitRunner.start($$.extend({}, {
            workspace:window.frames[0],
            jQuery:$$
        }, data));
      })
      .fail(function() {
        global.alert("Failed to load config.json, please make sure this file exist and it is correctly formatted.");
      });

   });

}(this));
