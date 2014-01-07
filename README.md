[![Build Status](https://travis-ci.org/TheMonkeys/MonkeytestJS.png)](https://travis-ci.org/TheMonkeys/MonkeytestJS)

MonkeytestJS
============

***Automated functional testing for front end web developers***

You might be writing unit tests, but unless a project is large enough to warrant a dedicated test team,
there probably won't be any automated top level testing of the interface. This is sad because you get a
lot of value from even a few high level functional tests.


Why, when there are plenty of tools around for writing automated browser based tests (like [Selenium](#),
[Sahi](http://sahi.co.in/w/), [eValid](http://www.e-valid.com/), [Watir](http://wtr.rubyforge.org/)
and [Canoo](http://webtest.canoo.com/webtest/manual/WebTestHome.html)), do so few front end developers use them?
We thought about it and decided that the existing tools just didn't suit how we worked. They're not
hard to use exactly, but something about them just seem to take us too far out of the zone. Also, they're
slow and there's never any budget for automated testing.


So we made [MonkeyTestJS][1]. It's quick and easy to use, so we can build up a suite of regression tests
while we're building the functionality of our project. We write tests using straightforward client side
javascript and run them in a browser to see the result.

[MonkeyTestJS][1] is built on top of [QUnit][3], the unit testing framework used by
[JQuery](https://jquery.org/). However, instead of focusing on testing javascript functions,
[MonkeyTestJS][1] tests act on the actual DOM of your web app. Using standard [QUnit][3]
assertions, your tests simulate user interaction and then check the DOM for expected results.

Don't take our word for it, have a look:

http://monkeytestjs.io/tests

Because the test suite is run from a URL, it can be run in a browser tab while you're working. Or in a
headless browser like [PhantomJS](http://phantomjs.org/) as part of continuous integration
(see [grunt-MonkeytestJS](https://github.com/TheMonkeys/grunt-MonkeytestJS)). Or across a suite of browsers
using a service like [BrowserStack](http://www.browserstack.com/).

Tests can be asynchronous so it's good for AJAX and dynamically generated markup. [MonkeyTestJS][1] also
comes with a [PHP][2] proxy script for those situations where you need cross domain requests.

Custom tests are quick to write, but it's also easy to re-use tests across pages. You can test things like HTML
validation, Google Analytics, character encoding etc. on all pages of your site without writing a test.

One minute Installation
-----------------------

If you're using [MonkeyBones](http://monkeysbones.io) you can opt to have [MonkeyTestJS][1] installed as part of your
project scaffold.

Setting it up manually is almost as easy:

**Step 1**: Clone (or download and unzip) the repo into the webroot of your project: eg:

```
cd path/to/webroot
git clone git@github.com:TheMonkeys/MonkeytestJS.git
```

Assuming that you can already access your development site at a URL, eg: "http://your-web-app.dev", if you view the
/MonkeyTestJS directory now in a browser (as in go to "http://your-web-app.dev/MonkeyTestJS"), you'll see some default
tests running on your Home page and some demo pages.

**Optionally:** Feel free to rename the directory to something more friendly || unique || boring, like "tests":

```
mv MonkeytestJS tests
```

Then you can run them on that URL, eg "http://your-web-app.dev/tests/"

Running without a web server
----------------------------

It is possible to run MonkeyTestJS without a webserver by opening the `index.html` file in your browser. However,
modern browsers prevent javascript access between frames, and because the pages you'll be testing are loaded in an
`iframe`, this prevents MonkeyTestJS from working. Some browsers may have a workaround for this though - for example:

### Google Chrome

Chrome allows you to specify a command-line parameter (when starting Chrome):

```bash
$ /path/to/chrome --allow-file-access-from-files
```

### Firefox

Firefox has a preference called `security.fileuri.strict_origin_policy` which can be set to `false`.

Getting Started
---------------

The file **/config.js** is where you should put all your settings. It comes with some demo content and looks like this:

```javascript
(function(global) {
    global.monkeytestjs = {
        "facebookId": "000000000000000",

        "local": {
            "env": ["DEV URL OR PART OF"]
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
            "global/has_google_analytics.js"
        ],
        "pages": [
            {
                "url": "../"
            },
            {
                "url": "core/demo/index.html",
                "tests": [ "page/has_facebook_appid.js" ]
            },
            {
                "url": "core/demo/index.html?pretendIsAnotherPage=true",
                "tests": [ "page/demo_page_test.js","page/has_facebook_appid.js" ]
            }
        ],
        "proxyUrl": "core/proxy.php?url=",
        "loadSources": true
    };
})(this);
```

In a test, the config settings are accessible through the `config` property. For example, this setting in **/config.js**

```javascript

    "facebookId": "111111111111111",
```

is referenced like this:

```javascript

this.config.facebookId
```

> **Note**: We are using javascript rather than JSON for our config to make it easier to use MonkeyTestJS without having a webserver running. If you want, you can configure MonkeyTestJS to use a JSON file named `config.json` instead.

> 1. Populate your `config.json` with content in the same structure as shown above but without the javascript wrapper.
> 2. Delete the reference to `config.js` in the supplied `index.html` file.

> Using a JSON file has the drawback of not working from the local filesystem because it requires an AJAX
> request to load the JSON file; therefore if you're not running your own local webserver for development then you'll
> need to go with the default `config.js` approach.

***

### Setting environment specific (`env`) overrides

Any property in **/config.js** is deemed to be an environment specific setting if it contains an `env` property,
for Example:

```javascript

    "local": {
        "env": ["dev","localhost"],
    },
```
In this case, if the string "dev" or "localhost" is part of the website URL, any other properties of "local"
will be added to the `config` property, overriding any default of the same name that might be present. For example,
if your development environment URL contians the string "localhost" and you have this in your **/config.js**:

 ```javascript

    "facebookId": "000000000000000",

    "local": {
        "env": ["dev","localhost"],
        "facebookId": "88888888888888888",
    },
```

then `this.config.facebookId` will have a value "88888888888888888".

You can setup as many environments as you need. In the default **/config.js** file the `local` environment
doesn't override the default `facebookId` value, effectively making `local` the default. 

 ```javascript

    "facebookId": "000000000000000",

    "local": {
        "env": ["DEV URL OR PART OF"]
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

Used in the demo **/tests/global/has_facebook_appid.js** test to check the Facebook ID. In the demo **config/json** file, this is set to "000000000000000" so that the demo tests pass and is 'overridden' in the specific settings for each environment.


### `globalTests` - Array

The global tests will be run by [MonkeyTestJS][1] on all pages.

MonkeytestJS ships with three default tests:

- **/tests/global/is_html_w3c_valid.js** ( checks if the page is valid throught the w3c validator )
- **/tests/global/has_utf8_metatag.js** ( check for a presence of a utf8 metatag )
- **/tests/global/has_google_analytics.js** ( check if we have google analytics setup )

Removing or adding a global test from the test suite is just a matter of deleting or adding a reference to it in the "globalTests" section of the **/config.js** file:

```javascript

    "globalTests": [
        "global/is_html_w3c_valid.js",
        "global/has_utf8_metatag.js",
        "global/another_test_i_just_created.js"
    ]
```

Urls for the global tests are relative to the **/tests** directory in the MonkeyTestJS directory.

***

### `pages` - Object

**`pages[].url` - String**

URLs for the pages to be tested, relative to the MonkeyTestJS directory.

Example:

```javascript

    "pages": [
        {
            "url": "core/demo/index.html"
        }
```


**`pages[].tests` - Array**

Assign custom tests for the page. Custom tests will be run on the page after the global tests have finished.

Urls for the page tests are relative to the **/tests** directory in the MonkeyTestJS directory.

Example:

```javascript

    "pages": [
        {
            "url": "core/demo/index.html",
            "tests": [
                "page/demo_page_test.js"
        }

    ]
```

***

### `proxyUrl` - String

Cross domain restricitons limit the scope of front end javascript. To help mitigate this, we recommend using a simple
proxy when necessary.

In the demo test **/tests/global/is_html_w3c_valid.js** we send the full page markup off to the W3C validator and get back the result.
Because the W3C site is a different domain, we use the proxy.

The URL for the proxy script is specified in the **/config.js** file and is relative to the MonkeyTestJS directory.

Example:

```javascript

    "proxyUrl": "core/proxy.php?url="
```

The proxy is [PHP][2]. If you're using another language on the server side, you can use your own proxy script and change the path
in the **/config.js** file to reference it.

### `loadSources` - Boolean

If set to `true` (the default), MonkeyTestJS will fire off ajax requests to get the source code for your pages under
test. This is available from within your test scripts via the property `this.page.source`.

> **Note**: When running from the local filesystem (i.e. at a `file:` url, not via a web server), `loadSources` is
> ignored and sources are not available.


MonkeytestJS API
----------------

MonkeyTestJS is a wrapper around QUnit, so at heart a MonkeyTest is a [QUnit][3] test. For documentation of the specific assertions,
refer to the [QUnit API assertion documentation][4]. However, you can safely ignore the rest of the [QUnit][3] documentation. All that
stuff is happening behind the scenes of [MonkeyTestJS][1].

[MonkeyTestJS][1] gives you the following methods for defining tests:

### test (name, callback ($){})
Runs a synchronous QUint test.

Parameters:

**name (String)** - A nice human readable name for your test, like "Is there a page title?".

**callback (Function)** - A function containing your [QUnit][3] assertions.

Returns:

An instance of ```MonkeyTestJSPageTest```, suitable for chaining JQuery stylee.

Example:

```javascript

    this
    .test("Hello?",function($) {
        ok( true, "Hello world!");
    })

    .test("Hello again?",function($) {
        ok( true, "Hello again!");
    });

```

### asyncTest (name, callback ($){})
Runs an asynchronous [QUint][3] test. Must call this.asyncTestDone when the test is complete. Only then will the next chain
action be called.

Parameters:

**name (String)** - A nice human readable name for your test, like "Is there a page title?".

**callback (Function)** - A function containing your [QUnit][3] assertions.

Returns:

An instance of ```MonkeyTestJSPageTest```, suitable for chaining JQuery style.

Example:

In this example from **/tests/global/is_html_w3c_valid.js**, we're sending the page source to the W3C
validator for checking, then doing some assertions with the returned page.

```javascript

   this
   .asyncTest('Is HTML Valid?',function() {

        $$.post(this.config.proxyUrl + this.validatorUrl,{fragment:this.page.source})
        .success(function(data) { // we got some validation results

            // Do some assertions on the returned markup, eg:
            //    ok( true, 'HTML is valid' );

            // needs to be called upon assync tests
            self.asyncTestDone();
        })
        .error(function() { // validation couldnt be performed.

            ok( false, 'Unable to get validation results' );

            // needs to be called upon assync tests
            self.asyncTestDone();
        });

    })

    .test("Hello again?",function($) {
        ok( true, "Hello again!");
    });

```

### asyncTestDone ()
This needs to be called when an `asyncTest()` finishes.

Example: see above.

### loadPage (url[optional])
Loads a page into the iframe, also waits until page is loaded before moving to the next action in the chain. If you are
performing tests on an actual page, this will normally be the first call in a test chain.

Parameters:

**url (String)** - A relative URL of an HTML page in your site, eg: "/about-us.html".

Returns:

An instance of ```MonkeyTestJSPageTest```, suitable for chaining JQuery stylee.

Example:

Building on the example for test() above, we can load a second page and run further tests on it.

```javascript

    this
    .test("Hello?",function($) {
        ok( true, "Hello world!");
    })

    .loadPage("/about-us.html") // load a different page into the frame

    this.test("Hello again?",function($) {
        ok( true, "Hello again!");
    });

```

### wait (function, timeout, throttle)
Waits for expression to be evaluated to true or timeout to happen, keeps checking for experssion on throttle interval.

Parameters:

**function (Function)** - A function which performs a useful test, typically, returns true

**timeout (Integer)** - The maximum number of milliseconds for which you'd like to wait

**throttle (Integer)** - The number of milliseconds to wait between tests

Returns:

An instance of `MonkeyTestJSPageTest`, suitable for chaining JQuery stylee.

Example:

```javascript

    this.
    test("Hello?",function($) {
        ok( true, "Hello world!");

        // After this, we'll have to wait for the action page of the
        // form to load
        $('form').submit();
    })

    .wait(function() {
        
        // This will be called repeatedly until it returns true, killing the wait
        // (hopefully long before the 10 seconds is up)
        return self.workspace.window.$('p:contains("Thank you!")').length;

    }, 10000) // wait max 10 seconds ( Pause execution of tests per duration )

    this.test("Hello again?",function($) {
        ok( true, "Hello again!");
    });

```

Writing Tests
-------------

Add the path to the test script to either the `config.globalTests` array or, for a specific page, to the `config.pages[].tests`
array.

Create a test script file at the path entered above. At the most basic the test script should contain a call to the
registerTest (name, spec) function. 

The spec parameter is called in the scope of a MonkeytestJSPageTest object and should be a function contaning the test methods (see **MonkeytestJSPageTest** methods above): 

```javascript
registerTest ('Hello world test', function () {
    // this is the test script
    this
    .test("Hello?",function($) {
        ok( true, "Hello world!");
    });
);
```

Alternatively an object can be passed as the spec parameter, containing setup and load methods:

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
[2]: http://php.net/
[3]: http://qunitjs.com/
[4]: http://api.qunitjs.com/category/assert/
