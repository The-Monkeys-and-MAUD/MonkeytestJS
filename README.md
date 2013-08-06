[![Build Status](https://travis-ci.org/TheMonkeys/MonkeytestJS.png)](https://travis-ci.org/TheMonkeys/MonkeytestJS)

MonkeytestJS
============


Getting Started
---------------

The file `config.json` include the **options** for the runner:

```javascript
{
    "envs": {
        "local": ["LOCAL URL OR PART OF"],
        "stage": ["STAGE URL OR PART OF"],
        "beta": ["BETA URL OR PART OF"],
        "production": ["PRODUCTION URL OR PART OF"]
    },
    "facebook": {
        "ids": {
            "local": "111111111111111",
            "stage": "222222222222222",
            "beta": "333333333333333",
            "production": "444444444444444",
            "default": "000000000000000"
        }
    },
    "testsDir": "tests",
    "globalTests": [
        "global/is_html_w3c_valid.js",
        "global/has_utf8_metatag.js",
        "global/has_facebook_appid.js",
        "global/has_google_analytics.js"
    ],
    "pages": [
        {
            "url": "/tests/core/demo/index.html"
        },
        {
            "url": "/tests/core/demo/index.html?anotherPageUrl=1",
            "tests": [ "page/demo_page_test.js" ]
        }
    ]
}

```

***

### options.envs - Object

This is where your environment is declared, you can specify on the config urls to be matched to a specific environment.

example:

```javascript

    "envs" : {
        "production": ["mywebsite.com", "anotheralias"]
    }

```

if the string "**mywebsite.com**" or "**anotheralias**" is part of the website URL than that environment name will be returned by the `.env()` (in this case "**production**") method call from a test page. if no environment is found the string "**default**" will be returned.

You can setup as many environments as you wish, bear in mind that if a match is not found "**default**" will be returned.

***

### options.testsDir - String

This is the locations for MonkeytestJS **based on the root of the website**.

example: **http://mywebsite.com/tests/**

```javascript
"testsDir": "tests"

```

***

### options.globalTests - Array

Global tests are the tests that will be runned by all pages.

By default MonkeytestJS include 4 default tests:

     - is_html_w3c_valid ( checks if the page is valid throught the w3c validator )
     - has_utf8_metatag ( check for a presence of a utf8 metatag )
     - has_facebook_appid ( check for the facebookAPP id based on the environment )
     - has_google_analytics ( check if we have google analytics setup )

**Removing** or **adding** a test is just a matter of deleting or adding a reference to it:

```javascript
    "globalTests": [
        "global/is_html_w3c_valid.js",
        "global/has_utf8_metatag.js",
        "global/another_test_i_just_created.js"
    ]
```

***

### options.pages - Object

**options.pages.url - String**

Url for the page to be tested, based on the root.

example:

```javascript
    "url": "/tests/core/demo/index.html"
```


**options.pages.tests - Array**

Assign custom tests for the page. Custom tests will be runned on the page after the **global tests** have finished.

**Url for the tests are based on the `testsDir`**

example:

```javascript
    "tests": [
        "page/demo_page_test.js"
    ]
```

MonkeytestJS API
----------------

This methods are used on the test page.

### test (name, callback ($){})
Runs a synchronous QUint test.

### asyncTest (name, callback ($){})
Runs an asynchronous QUint test. Must call this.asyncTestDone when the test is complete. Only then will the next chain
action be called.

### asyncTestDone ()
This needs to be called when an `asyncTest()` finishes.

### loadPage (url[optional])
Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
performing tests on an actual page, this will normally be the first call in a test chain.

### wait (function, timeout, throttle)
Waits for expression to be evaluated to true or timeout to happen, keeps checking for experssion on throttle interval.

### env ()
Returns the current environment - based on the url of the current page. If not match is found it returns "default"

### config ()
Returns the config object passed into MonkeytestJS.


**NOTE**

`config()` and `env()` cant be used for chaining since they dont return **context**, they are meant to be used inside the
`test()` or `asyncTest()`.

Writing Tests
-------------

Add the path to the test script to either the options.globalTests[] array or for a specific page to the pages[].tests[]
array.

Create a test script file at the path entered above. At the most basic the test script should contain a call to the
registerTest (name, spec) function. Where the spec object literal must contain at least a function callback. An object can
be passed instead and an optional with a setup and load callback. The load callback is call in the scope of a MonkeytestJSPageTest object
which methods that should be chained together to to perform test actions (see **MonkeytestJSPageTest** methods above):

```javascript
registerTest ('Hello world test', function () {
    // this is the test script
    this
    .test("Hello?",function($) {
        ok( true, "Hello world!");
    });
);
```

This can also be written as

```javascript
registerTest ('Hello world test',
    {
        setup:function (container) {
            // this is run before the test
            // use it to do things like clear cookies or assign helpers
            this.myhelper = function doSomething() {};
        }
        ,load : function () {
            // this is the test script
            this
            .test("Hello?",function($) {

                var env = this.env(); // getting the environment
                var config = this.config(); // getting the config

                ok( config.foo[env].bar, "Accessing an item from config on a specific environment" );
                ok( true, "Hello world!");
            });
        }
    }
);
```

Refer to example test on: ```./tests/page/demo_page_test.js```

***

### Contributors

   - Kynan Stewart Hughes - @k7n4n5t3w4rt
   - Thomas Garrood - @sandboxdigital
   - Mitermayer Reis - @mitermayer
   - Peter Feltham  - @felthy


**Change log**

   - **1.0.0** - Initial release.
