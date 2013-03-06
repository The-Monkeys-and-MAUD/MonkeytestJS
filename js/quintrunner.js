/*! quintrunner - v0.1.0 - 2013-03-06
* https://github.com/organizations/TheMonkeys
* Copyright (c) 2013 The Monkeys; Licensed  */
;/*globals QUnit, test, asyncTest
 */

(function(global) {
    var log = function (s)
    {
        if (global.console) {
            console.log(s);
        }
    };

    /**
     * Simple wrapper function to register test with the qunitRunner
     * @param name
     * @param test
     */
    var registerTest = function (name, test)
    {
        global.QUnitRunner.registerTest (name, test);
    };

    var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) { if (__hasProp.call(parent, key)) {child[key] = parent[key];} }
        function CTor() { this.constructor = child; }
        if (parent.prototype) {
            CTor.prototype = parent.prototype;
            child.prototype = new CTor ();
            child.__super__ = parent.prototype;
        }
        return child;
    };

    var QUnitRunner = function() {

    };

    QUnitRunner.prototype.start = function(config, pagesToTest)
    {
        config = config ||  {};

        this.config = {
            testsDir:'/tests/', // requires leading and trailing slash or just '/' if root of server
            pageTests:{},
            globalTests:[]
        };

        __extends(this.config, config);

        this.testsUrl = /^[^\/]+:\/\/[^\/]+\//.exec(location.href)[0] + this.config['testsDir'];
        this.workspace = this.config.workspace;
        this.jQuery = this.config.jQuery;

        // figure out which pages we are testing
        // if nothing was passed in assume all
        var i= 0,j=0;

        pagesToTest = pagesToTest || [];
        if (pagesToTest.length === 0) {
            for (i=0;i<this.config.pages.length;i++) {
                pagesToTest.push(this.config.pages[i].url);
            }
        }
        this.pagesToTest = pagesToTest;

        // tests scripts
        this.tests = {};
        this.testsToLoad = [];

        i=0;
        // page specific test scripts

        // load our pages from the config
        // also loads tests and adds them to this.testToLoad
        this.pages = [];
        for (i=0;i<this.config.pages.length;i++) {
            var page = new QUnitRunnerPage(this.config.pages[i]);
            page.runner = this;

            // add global tests
            for (j=0;j<this.config.globalTests.length;j++)
            {
                page.tests.push(this.getTest(this.config.globalTests[j]));
            }

            // add page specific tests - if there are any
            if (this.config.pages[i].tests) {
                for (j=0;j<this.config.pages[i].tests.length;j++) {
                    page.tests.push(this.getTest(this.config.pages[i].tests[j]));
                }
            }

            this.pages.push(page);
        }

        // load our test scripts
        this.loadNextTest();

        return this;
    };

    QUnitRunner.prototype.getTest = function (src)
    {
        if (!this.tests.hasOwnProperty(src))
        {
            var test = new QUnitRunnerTest({src:src}, this);
            this.tests[src] = test;
            this.testsToLoad.push(test);
        }
        return this.tests[src];
    };

    QUnitRunner.prototype.loadNextTest = function ()
    {
        this.loadingCurrentTest = this.testsToLoad.shift(); // take from start
        if (this.loadingCurrentTest)  {
            this.loadingCurrentTest.load();
        } else {
            this.loadTestsDone ();
        }
    };

    QUnitRunner.prototype.registerTest = function (name, test)
    {
        log ('->registerTest '+this.loadingCurrentTest.src+' '+name);
        var testSpec = this.loadingCurrentTest;
        this.loadingCurrentTest.test = test;
        this.loadingCurrentTest.name = name;
        //this.tests[testSpec.src]=({name:name, test:test, script:testSpec.script, id:testSpec.id, type:testSpec.type, url:testSpec.page});

        this.loadNextTest ();
    };

    QUnitRunner.prototype.loadTestsDone = function(  ) {

        this.startTests();
    };

    QUnitRunner.prototype.startTests = function(  ) {
        log ('->startTests ');
        log (this.tests);

        QUnit.start();
        this.currentPage = this.pages.shift();
        this.nextPageTest();
    };

    QUnitRunner.prototype.nextPageTest = function( ) {
        if (this.currentPage) {
            if (!this.currentPage.runNextTest()) {
                // move to next page and run
                this.currentPage = this.pages.shift();
                this.nextPageTest();
            }
        } else {
            log ('All test complete');
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

    QUnitRunnerPage.prototype.loadSource = function(callback)
    {
        if (this.source!=="") {
            callback ();
            return;
        }

        var _this = this;
        this.runner.jQuery.get(this.url)
            .success(function(data) {
                _this.source = data;
                callback ();
            })
            .error(function() {
                callback ();
            });
    };

    QUnitRunnerPage.prototype.runNextTest = function(callback)
    {
        var testSpec = this.tests.shift();

        if (testSpec) {
            var pageTest = new QUnitRunnerPageTest({}, this.runner);
            pageTest.testSpec = testSpec;
            pageTest.runner = this.runner;
            pageTest.page = this;
            pageTest.window = pageTest.workspace = this.runner.workspace;
            pageTest.$ = this.runner.workspace.jQuery;
            pageTest.runTest ();
            return true;
        } else {
            return false;
        }
    };


    /********************************************************************************
     * QUnitRunnerTest
     */

    var QUnitRunnerTest = function(config, runner) {
        config = config || {};

        __extends(this, config);
        this.runner = runner;
    };

    QUnitRunnerTest.prototype.load = function(callback)
    {
        this.addTestScript("", this.src);
    };

    QUnitRunnerTest.prototype.addTestScript = function (id, src)
    {
        src =  this.runner.testsUrl+src;
        var d = document;
        var js, ref = d.getElementsByTagName('script')[0];
        //if (d.getElementById(id)) {return;}
        js = d.createElement('script');
        //js.id = id;
        js.async = true; js.src = src;
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

    QUnitRunnerPageTest.prototype.runTest = function()
    {
        log ('->testPageTest starting '+this.page.url + ' with '+this.testSpec.name);

        var _this = this;

        QUnit.module('testing '+this.page.url + ' with '+this.testSpec.name);

        if (this.test.test instanceof Function) {
            // test is run on page load
            this.config.jQuery('#workspace').on('load',function() {
                _this.testSpec.test.call (_this, _this.workspace.jQuery, 0);
            });
        } else {
            var loadCount = 0;
            if (this.testSpec.test.setup) {
                this.testSpec.test.setup.call (this);
            }
            if (this.testSpec.test.load)
            {
                _this.testSpec.test.load.call (_this, _this.workspace.jQuery);
            }
        }

    };


    /**
     * QUnitRunnerPageTest chain control methods
     */


    QUnitRunnerPageTest.prototype.start = function ()
    {
        log ('->testPageTest  '+this.page.url + ':'+this.testSpec.name+" start "+this.chain.length);
        this._next();
        return this; // chainable
    };


    QUnitRunnerPageTest.prototype._next = function ()
    {
        log ('->testPageTest  '+this.page.url + ':'+this.testSpec.name+" _next");
        var fn = this.chain.shift();
        if (fn){
            fn.call(this);
        }else {
            log ('->testPageTest complete '+this.page.url + ' with '+this.testSpec.name);
            this.runner.nextPageTest ();
        }
    };

    /**
     * QUnitRunnerPageTest utility methods - these are not chainable!
     */

    QUnitRunnerPageTest.prototype.env = function ()
    {
        var envs = this.runner.config.envs;
        var env = "notfound";
        var that = this;

        this.runner.jQuery.each(envs,function(envKey,value){
            var envTests = envs[envKey];

            that.runner.jQuery.each(envTests,function(key,value){
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

    QUnitRunnerPageTest.prototype.config = function ()
    {
        return this.runner.config;
    };

    /**
     * QUnitRunnerPageTest methods - these are all chainable
     */

    QUnitRunnerPageTest.prototype.loadPageSource = function ()
    {
        var _this = this;
        var fn = function () {
            _this.page.loadSource(function(){
                _this._next();
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.loadPage = function (url)
    {
        url = url || this.page.url;

        var _this = this;
        var onloadFn = function() {
            _this._next();
            _this.runner.jQuery('#workspace').off('load',onloadFn);
        };
        var fn = function () {
            _this.runner.jQuery('#workspace').on('load',onloadFn);
            _this.runner.jQuery('#workspace').attr('src',url);
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.waitForPageLoad = function ()
    {
        var _this = this;
        var loadFn = function() {
            _this._next();
            _this.runner.jQuery('#workspace').off('load',loadFn);
        };
        var fn = function () {
            _this.runner.jQuery('#workspace').on('load',loadFn);

            // TODO - add timeout ...
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.run = function (runFN)
    {
        var _this = this;
        var fn = function () {
            runFN.call(_this, _this.workspace.jQuery);
            _this._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.test = function (name, testFN)
    {
        var _this = this;
        var fn = function () {
            test( name, function(){
                testFN.call(_this, _this.workspace.jQuery);
            });
            QUnit.start ();
            _this._next();
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncTest = function (name, testFN)
    {
        var _this = this;
        var fn = function () {
            asyncTest( name, function(){
                testFN.call(_this, _this.workspace.jQuery);
            });
        };

        this.chain.push(fn);

        return this; // chainable
    };

    QUnitRunnerPageTest.prototype.asyncTestDone = function ()
    {
        var _this = this;
        QUnit.start ();
        _this._next();
    };

    // pollute the global namespace
    global.QUnitRunnerPageTest = QUnitRunnerPageTest;
    global.log = log;
    global.registerTest = registerTest;

    // create our singleton / factory
    global.QUnitRunner = new QUnitRunner ();
}(this));

