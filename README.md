[![Build Status](https://travis-ci.org/TheMonkeys/MonkeytestJS.png)](https://travis-ci.org/TheMonkeys/MonkeytestJS)

MonkeytestJS
============

***Automated functional testing for front end web developers***

There are plenty of tools around for writing automated browser based tests (like [Selenium](#),
[Sahi](http://sahi.co.in/w/), [eValid](http://www.e-valid.com/), [Watir](http://wtr.rubyforge.org/)
and [Canoo](http://webtest.canoo.com/webtest/manual/WebTestHome.html)) but normal people don't use them.
By "normal people" we mean front end developers.

You might be writing unit tests, but unless a project is large enough to warrant a dedicated test team,
the chances are that there won't be any automated top level testing of the interface. We find we get a
lot of value for not much effort when we have at least a few high level funtional tests.

[MonkeyTestJS][1] is great for building up a suite of regression tests while you're building the functionality
of your project. You can write tests quickly using straightforward client side javascript and then run
them in a browser. 

[MonkeyTestJS][1] is built on top of [QUnit](http://qunitjs.com/), the unit testing framework used by
[JQuery](https://jquery.org/). However, instead of focusing on testing javascript functions,
[MonkeyTestJS][1] pulls whole web pages into an ifame and tests the DOM of the page. Your tests trigger
events to simulate user interaction and then check the DOM for expected results.

Don't take our word for it, have a look:

http://monkeytestjs.io/tests

Because the test suite is run from a URL, it can be run in a browser tab while you're working. Or in a
headless browser like [PhantomJS](http://phantomjs.org/) as part of coninuous integration
(see [grunt-MonkeytestJS](https://github.com/TheMonkeys/grunt-MonkeytestJS)). Or across a suite of browsers
using a service like [BrowserStack](http://www.browserstack.com/).

Tests can be asynchronous so it's good for AJAX and dynamically generated markup. [MonkeyTestJS][1] also
comes with a PHP proxy and a NodeJS proxy for those situations where you need cross domain requests. We use it to
validate markup with the W3C Validator (see /tests/global/is_html_w3c_valid.js).

Custom tests are quick to write, but it's also easy to re-use tests across pages. Simply by adding a page
of your site to the config.json file, you can automatically test things like HTML validation, Google Analytics,
character encoding etc. without writing a test. Check out the /core/demo pages for some global tests you can
apply out of the box.

Installation
-------------

If you're using [MonkeyBones](http://monkeysbones.io) you can opt to have [MonkeyTestJS][1] installed as part of your
project scaffold.

Setting it up manually is almost as easy:

**Step 1**: Clone (or download and unzip) the repo into the webroot of your project: eg:

```
cd path/to/webroot
git clone git@github.com:TheMonkeys/MonkeytestJS.git
```

If you view the [MonkeyTestJS][1] directory now in a browser (as in go to "http://your-web-app.dev/[MonkeyTestJS][1]"), you'll
see some default tests running on the demo HTML page

**Step 2**: Open up the config.json and find the "pages" section. At the top of the "pages" section, put in an entry
for the Home page of your app, so that the `pages` section looks like this:

```javascript

    "pages": [
        {
            "url": "/"
        },
        {
            "url": "/tests/core/demo/index.html"
        },
        {
            "url": "/tests/core/demo/index.html?pretendIsAnotherPage=true",
            "tests": [ "page/demo_page_test.js" ]
        }
    ]
```

If you go to http://your-web-app.dev/[MonkeyTestJS][1] now, you'll see some global tests being run on your Home page as
well as the demo pages.

**Step 3**: Optionally: Rename the directory to something more friendly (or, if you like, unique to your project), like "tests":

```
mv MonkeytestJS tests
```

Then you can run them on that URL, eg "http://your-web-app.dev/tests/"


Getting Started
---------------

The file **/config.json** is where you should put all your settings. Out of the box it looks like this:

```javascript

{
    "facebookId": "111111111111111",

    "local": {
        "env": ["LOCAL URL OR PART OF"]
    },
    "stage": {
        "env": ["STAGE URL OR PART OF"],
        "facebookId": "222222222222222"
    },
    "beta": {
        "env": ["BETA URL OR PART OF"],
        "facebookId": "33333333333333333"
    },
    "production": {
        "env": ["PRODUCTION URL OR PART OF"],
        "facebookId": "4444444444444444444"
    },

    "globalTests": [
        "global/not_server_error.js",
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
            "url": "/tests/core/demo/index.html?pretendIsAnotherPage=true",
            "tests": [ "page/demo_page_test.js" ]
        }
    ]
}
```

In a test, the config settings are accessible through the `config` property. For example, this setting in **/config.json**

```javascript

    "facebookId": "111111111111111",
```

is referenced like this:

```javascript

this.config.facebookId
```

***

### Setting environment specific (`env`) overrides

Any property in **/config.json** is deemed to be an environment specific setting if it contains an `env` property,
for example:

```javascript

    "local": {
        "env": ["dev","localhost"],
    },
```
In this case, if the string "dev" or "localhost" is part of the website URL, any other properties of "local"
will be added to the `config` property, overriding any default of the same name that might be present. For example,
if your development environment URL contians the string "localhost" and you have this in your **/config.json**:

 ```javascript

    "facebookId": "111111111111111",

    "local": {
        "env": ["dev","localhost"],
        "facebookId": "222222222222222222",
    },
```

then `this.config.facebookId` will have a value "222222222222222222".

You can setup as many environments as you wish. In the default **/config.json** file the `local` environment
doesn't override the default `facebookId` value, effectively making `local` the default. 

 ```javascript

    "facebookId": "111111111111111",

    "local": {
        "env": ["LOCAL URL OR PART OF"],
    },
    "stage": {
        "env": ["STAGE URL OR PART OF"],
        "facebookId": "222222222222222"
    },
    "beta": {
        "env": ["BETA URL OR PART OF"],
        "facebookId": "33333333333333333"
    },
    "production": {
        "env": ["PRODUCTION URL OR PART OF"],
        "facebookId": "4444444444444444444"
    },

```

***

### `facebookId` - String

Used in the demo tests to check the Facebook ID. This is overridden in the specific settings for each environment.


### `globalTests` - Array

The global tests will be run by [MonkeyTestJS][1] on all pages.

MonkeytestJS ships with four default tests:

- **/tests/global/is_html_w3c_valid.js** ( checks if the page is valid throught the w3c validator )
- **/tests/global/has_utf8_metatag.js** ( check for a presence of a utf8 metatag )
- **/tests/global/has_facebook_appid.js** ( check for the facebookAPP id based on the environment )
- **/tests/global/has_google_analytics.js** ( check if we have google analytics setup )

Removing** or adding a global test from the test suite is just a matter of deleting or adding a reference to it in the "globalTests" section:

```javascript

    "globalTests": [
        "global/is_html_w3c_valid.js",
        "global/has_utf8_metatag.js",
        "global/another_test_i_just_created.js"
    ]
```

Note that the path to the tests should be relative to the **/tests** directory.

***

### `pages` - Object

**`pages[].url` - String**

URLs for the pages to be tested, relative to the webroot of the site.

example:

```javascript

    "pages": [
        {
            "url": "/MonkeytestJS/tests/core/demo/index.html"
        }
```


**`pages[].tests` - Array**

Assign custom tests for the page. Custom tests will be run on the page after the **global tests** have finished.

**Url for the tests are based on the `testsDir`**

example:

```javascript

    "pages": [
        {
            "url": "/MonkeytestJS/tests/core/demo/index.html",
            "tests": [
                "page/demo_page_test.js"
        }

    ]
```

MonkeytestJS API
----------------

These methods are used on the test page.

### test (name, callback ($){})
Runs a synchronous QUint test.

example:



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


Writing Tests
-------------

Add the path to the test script to either the `config.globalTests` array or, for a specific page, to the `config.pages[].tests`
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

                ok( this.config.foo.bar, "Accessing an item from config on a specific environment" );
                ok( true, "Hello world!");
            });
        }
    }
);
```

Refer to example test on: **/tests/page/demo_page_test.js**

***

### Contributors

   - Kynan Stewart Hughes - @k7n4n5t3w4rt
   - Thomas Garrood - @sandboxdigital
   - Mitermayer Reis - @mitermayer
   - Peter Feltham  - @felthy


**Change log**

   - **1.0.0** - Initial release.

------------------------------------------------

[1]: http://monkeytestjs.io/