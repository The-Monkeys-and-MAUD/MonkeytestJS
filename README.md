[![Build Status](https://travis-ci.org/TheMonkeys/MonkeytestJS.png)](https://travis-ci.org/TheMonkeys/MonkeytestJS)

QUnit Acceptance Tests
============

Open index.html to see the current tests specification. New pages and tests can be added by editng the QUnitRunner
config, towards the bottom of index.html.

NOTE: Check the 'No try-catch' option as this is currently causing some tests to fail

QUnitRunner object
------------------

QUnitRunner is added to the global namespace (window.QUnitRunner) as a singleton object. Kick of the runner with the
 following command:

```javascript
QUnitRunner.start (config, pagesToTest);
```

config - see QUnitRunner config below.

pagesToTest - an array of the urls of the pages you wish to test, or null for all

QUnitRunner config
-------------------

```javascript
var config = {
    envs:{
        production : ['PRODUCTION URL OR PART OF'],
        beta : ['BETA URL OR PART OF'],
        stage : ['STAGE URL OR PART OF'],
        dev : ['DEV URL OR PART OF']
    },
    testsDir:'/tests/tests/',
    globalTests :[
        'global/html_validate.js',
        'global/has_utf8.js'
    ],
    pages:[
        {
            url:'/',
            tests:['page/age_gate.js']
        },
        {
            url:'/entryform/index?gem_id=1',
            tests:[
                'page/form_validation.js'
            ]
        }
    ],
    workspace:window.frames[0],
    jQuery:window.jQuery
};
```

options.envs: Array - hash of environments, each has has an array of strings that match the url of the environment

options.testsDir: String - directory containing tests. - optional

options.workspace - this it the window or iframe the pages to be tested will be loaded into.

options.jQuery - jQuery object, primary used to to load pages via AJAX and to attached event listeners to the
workspace.

options.globalTests: Array - tests scripts to be run on every page.

options.pages: Array - pages to run the tests on, pages must contain a 'url' variable and an optional 'tests' array of
test scripts to run on this page.

Adding a page to run tests against
----------------------------------

Simply add a page object literal to the options.pages array, the pages literal must contain a url variable.


Creating a test
---------------

Add the path to the test script to either the options.globalTests[] array or for a specific page to the pages[].tests[]
array.

Create a test script file at the path entered above. At the most basic the test script should contain a call to the
registerTest (name, spec) function. Where the spec object literal must contain at least a load callback and an optional
setup callback. The load callback is call in the scope of a QUnitRunnerPageTest object which has numerous methods that
can be chained together to to perform test actions (see QUnitRunnerPageTest methods below). The last chain call should
be start() - this will start the test:

```javascript
registerTest ('Hello world test',
    {
        setup:function (container) {
            // this is run before the test
            // use it to do things like clear cookies
        }

        ,load : function () {
            // this is the test script
            this
            .test("Hello?",function($) {
                ok( true, "Hello world!");
            })
            .start();
        }
    }
);
```

QUnitRunnerPageTest properties
------------------------------

As test actions are called within the scope of QUnitRunnerPageTest you can access the objects properties by prefixing
them with this.property, eg: this.page

### this.page
Page spec.
[TO BE COMPLETED]

### this.testSpec
Test spec.
[TO BE COMPLETED]

### this.workspace
window or iframe containing the page - can be used to access JS objects on the page. eg:
alert(this.workspace.document.title);

### this.window
Same as this.workspace.

### this.runner
QUnitRunner object.

### this.$
JQuery object of the page, shortcut to this.workspace.JQuery.


QUnitRunnerPageTest utility methods
---------------------------

Out of the box QUnitRunnerPageTest comes with the following utility methods. These can be used within a test but are not chainable:


### env ()
Returns the current environment - based on the url of the current page.


### config ()
Returns the config object passed into QUnitRunner.

QUnitRunnerPageTest chain/test methods
---------------------------

Out of the box QUnitRunnerPageTest comes with the following methods:

### loadPage (url[optional])
Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
performing tests on an actual page, this will normally be the first call in a test chain.

### loadPageSource ()
Loads the source of a page (via AJAX) into this.page.source. Waits until the source is loaded before moving to the next
chain action. If you are performing test on the page source this will normally be the first call in the test chain.

### test (name, callback ($){})
Runs a synchronous QUint test.

### asyncTest (name, callback ($){})
Runs an asynchronous QUint test. Must call this.asyncTestDone when the test is complete. Only then will the next chain
action be called.

### run (callback ($){})
Runs arbitrary js code on the page, such as submitting a for, then moves to the next chain action.

### asyncRun (callback ($){})
Runs an asynchronous task. Must call this.asyncRunDone when the task is complete. Only then will the next chain
action be called.

### wait (duration = 1000)
Waits for duration before moving to next chain task

### waitForPageLoad ()
Pause the chain until a page load takes place. Should be used to wait if a form is submitted or a link click is
triggered. Once the page load is complete it'll move to the next chain action.


Custom QUnitRunnerPageTest methods
----------------------------------

You can add new QUnitRunnerPageTest methods by adding to the QUnitRunnerPageTest.prototype. eg:

```javascript
QUnitRunnerPageTest.prototype.alert = function (hello)
{
    // local reference to our QUnitRunnerPageTest object - REQUIRED
    var _this = this;

    // create a chain closure function - REQUIRED
    var chainFn = function () {
        alert(hello);

        // call next to move to next chain action - REQUIRED
        _this._next();
    };

    // add our closure to the chain - REQUIRED
    this.chain.push(chainFn);

    // return this to maintain chainability - REQUIRED
    return this;
};
 ```

Custom methods can be chained in exactly the same way:

```javascript
registerTest ('Alert test',
    {
        load : function () {
            this
            .alert("Hello!")
            .test("Alert test",function($) {
                ok( true, "You should have seen the alert");
            })
            .start();
        }
    }
);
```
