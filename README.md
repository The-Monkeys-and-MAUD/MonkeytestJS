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
            "env": [/DEV URL OR PART OF/]
        },
        "stage": {
            "env": [/STAGE URL OR PART OF/],
            "facebookId": "222222222222222"
        },
        "beta": {
            "env": [/BETA URL OR PART OF/],
            "facebookId": "33333333333333333"
        },
        "production": {
            "env": [/PRODUCTION URL OR PART OF/],
            "facebookId": "4444444444444444444"
        },
        "testsDir": "mytests",
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
        "proxyUrl": "core/proxy.php?mode=native&url=<%= url %>",
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

Any property in **/config.js** is deemed to be an environment specific setting if it contains an `env` property. The
`env` property should be set to an array whose members are either strings or regular expressions that will be matched
against the URL being tested. Note that strings are treated as regular expressions, and are tested against the entire
URL (including scheme, domain and pathname) so a string like "localhost" will match URLs like `localhost.subdomain.com`
or even URLs like `somedomain.com/path/with/localhosts/within`. So if you need to be more precise you can use regular
expression features, e.g. to test exclusively for the hostname you could use `/^https?\:\/\/localhost[\/:]/`.

Example:

```javascript

    "local": {
        "env": [/dev/,"localhost"],
    },
```

In this case, if the regular expression "dev" matches the website URL, or the string "localhost" is part of the website
URL, any other properties of "local" will be added to the `config` property, overriding any default of the same name
that might be present. For example, if your development environment URL contains the string "localhost" and you have
this in your **/config.js**:

```javascript

    "facebookId": "000000000000000",

    "local": {
        "env": [/dev/,"localhost"],
        "facebookId": "88888888888888888",
    },
```

then `this.config.facebookId` will have a value "88888888888888888".

At runtime, the name of the detected environment is available via `this.config.environment`; for example, in the above
example `this.config.environment` will have a value "local".

You can setup as many environments as you need. In the default **/config.js** file the `local` environment
doesn't override the default `facebookId` value, effectively making `local` the default. 

```javascript

    "facebookId": "000000000000000",

    "local": {
        "env": [/DEV URL OR PART OF/]
    },
    "stage": {
        "env": [/STAGE URL OR PART OF/],
        "facebookId": "222222222222222"
    },
    "beta": {
        "env": [/BETA URL OR PART OF/],
        "facebookId": "33333333333333333"
    },
    "production": {
        "env": [/PRODUCTION URL OR PART OF/],
        "facebookId": "4444444444444444444"
    },

```

***

### `facebookId` - String

Used in the included test **global/has_facebook_appid.js** as the expected Facebook ID, and compared to the Facebook ID
found within the tested page. In the demo **config.js** file, this is set to "000000000000000" so that the demo tests
pass, and is 'overridden' in the specific settings for each environment.

***

### `testsDir` - String

The directory where your test specs can be found, relative to the MonkeyTestJS base URL. For example, with the following
configuration:

```javascript
    "testsDir": "mytests",
    "globalTests": [
        "global/is_html_w3c_valid.js"
    ]
```

and the base URL `http://your-web-app.dev/MonkeyTestJS`, the path to the global test would become
`http://your-web-app.dev/MonkeyTestJS/mytests/global/is_html_w3c_valid.js`.

If you want to put your tests directly inside the MonkeyTestJS directory, you can set this setting to an empty string:

```javascript
    "testsDir": "",
    "globalTests": [
        "is_html_w3c_valid.js"
    ]
```

then the test URL constructed will be `http://your-web-app.dev/MonkeyTestJS/is_html_w3c_valid.js`.

If you want to put your tests outside of the MonkeyTestJS directory, thus minimising the changes you make to
MonkeyTestJS (and therefore making it easier to update in future), you can specify a leading slash to indicate that the
path is relative to the root:

```javascript
    "testsDir": "/mytests",
    "globalTests": [
        "global/is_html_w3c_valid.js"
    ]
```

then the test URL constructed will be `http://your-web-app.dev/mytests/global/is_html_w3c_valid.js`

> Note that in the above examples you will still run the tests by visiting `http://your-web-app.dev/MonkeyTestJS/`,
  or whatever base path you selected.

***

### `globalTests` - Array

The global tests will be run by [MonkeyTestJS][1] on all pages.

MonkeytestJS ships with three default tests:

- **global/is_html_w3c_valid.js** ( checks if the page is valid throught the w3c validator )
- **global/has_utf8_metatag.js** ( check for a presence of a utf8 metatag )
- **global/has_google_analytics.js** ( check if we have google analytics setup )

Removing or adding a global test from the test suite is just a matter of deleting or adding a reference to it in the "globalTests" section of the **/config.js** file:

```javascript

    "globalTests": [
        "global/is_html_w3c_valid.js",
        "global/has_utf8_metatag.js",
        "global/another_test_i_just_created.js"
    ]
```

Urls for all tests (including global tests) are relative to the directory configured in the `testsDir` setting, which
defaults to `mytests`.

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

Urls for all tests (including page tests) are relative to the directory configured in the `testsDir` setting, which
defaults to `mytests`.

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

Cross domain restrictions limit the scope of front end javascript. To help mitigate this, we recommend using a simple
proxy when it's necessary to access resources on other domains.

In the demo test **global/is_html_w3c_valid.js** we send the full page markup off to the W3C validator and get back the
result. Because the W3C site is a different domain, we use the proxy.

The URL for the proxy script is specified in the **/config.js** file and is relative to the MonkeyTestJS directory, and
is parsed as an [EJS template](http://underscorejs.org/#template) with one variable, `url`, available for substitution.

Example:

```javascript

    "proxyUrl": "core/proxy.php?mode=native&url=<%= url %>"
```

The proxy provided with MonkeyTestJS is written in [PHP][2]. If you're using another language on the server side, you
can use your own proxy script and change the path in the **/config.js** file to reference it.

For details on how to use the proxy, see the section below titled [Cross-domain AJAX](#cross-domain-ajax).

### `loadSources` - Boolean

If set to `true` (the default), MonkeyTestJS will fire off ajax requests to get the source code for your pages under
test. This is available from within your test scripts via the property `this.page.source`.

If set to `false`, you can still obtain sources via `this.page.source` but they will be runtime sources, so they won't
necessarily be the same as the source originally returned by the server. This can be bad for validation because some
libraries (for example the Facebook Javascript SDK) insert invalid HTML into the DOM.

> **Note**: When running from the local filesystem (i.e. at a `file:` url, not via a web server), `loadSources` is
> ignored and sources are always obtained from the DOM.

### `onLoadPage` - Function

If you need to perform some kind of global initialization before any tests are run on a page, then you can add an
`onLoadPage` event handler function to your config. The function will be called before each item in your `pages` config
is loaded into the iframe.

The `onLoadPage` function, if specified, is called with a single parameter which is the `url` about to be loaded into
the iframe; and it is executed in the context of (that is to say, the `this` variable refers to) the
`MonkeyTestJSRunnerPage` object for the page about to be tested (the same object as is exposed as `this.page` within
your tests). For example:

```javascript

  onLoadPage: function(url) {
    console.log('Now loading ' + url + ' in environment ' + this.runner.config.environment);
  },

```

> **Note**: this is impossible when using JSON config (`config.json`) - you must be using `config.js` to be able to
> add Javascript code to your config.

### `onLoadPageAsync` - Function

The same as the [onLoadPage](#onloadpage---function) option, but for use when you need to perform asynchronous tasks
prior to the page being loaded. Your function is passed a callback function as a second argument, which you should
call when your asynchronous tasks have completed and the page can be loaded into the iframe. For example:

```javascript

  onLoadPage: function(url, done) {
    console.log('Now loading ' + url + ' in environment ' + this.runner.config.environment);
    done();
  },

```

### `onPageTestsComplete` - Function

The counterpart to `onLoadPage`. If you need to perform some kind of clean up after all tests have finished running for
a page you can add an `onPageTestsComplete` event handler function to your config. The function will be called after
the last test has completed for each page, and before the next page (if any) is loaded into the iframe.

The `onPageTestsComplete` function, if specified, is called with a single parameter which is the `url` of the page that
has been tested; and it is executed in the context of (that is to say, the `this` variable refers to) the
`MonkeyTestJSRunnerPage` object for that page (the same object as is exposed as `this.page` within your tests). For
example:

```javascript

  onPageTestsComplete: function(url) {
    console.log('Finished testing ' + url + ' in environment ' + this.runner.config.environment);
  },

```

> **Note**: this is impossible when using JSON config (`config.json`) - you must be using `config.js` to be able to
> add Javascript code to your config.

### `onPageTestsCompleteAsync` - Function

The same as the [onPageTestsComplete](#onpagetestscomplete---function) option, but for use when you need to perform
asynchronous tasks after the tests have completed. Your function is passed a callback function as a second argument,
which you should call when your asynchronous tasks have completed and the next page can be loaded into the iframe.
For example:

```javascript

  onPageTestsCompleteAsync: function(url, done) {
    console.log('Finished testing ' + url + ' in environment ' + this.runner.config.environment);
    done();
  },

```

### `onFinish` - Function

Called when all tests have completed for all pages. Your function is called in the context of the MonkeyTestJS object.
For example:

```javascript

  onFinish: function() {
    console.log('Finished testing all pages in environment ' + this.config.environment);
  },

```


MonkeytestJS API
----------------

MonkeyTestJS is a wrapper around QUnit, so at heart a MonkeyTest is a [QUnit][3] test. For documentation of the specific assertions,
refer to the [QUnit API assertion documentation][4]. However, you can safely ignore the rest of the [QUnit][3] documentation. All that
stuff is happening behind the scenes of [MonkeyTestJS][1].

[MonkeyTestJS][1] gives you the following methods for defining tests:

### test (name, callback ($){})
Runs a synchronous QUnit test.

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
Runs an asynchronous [QUnit][3] test. Must call this.asyncTestDone when the test is complete. Only then will the next chain
action be called.

Parameters:

**name (String)** - A nice human readable name for your test, like "Is there a page title?".

**callback (Function)** - A function containing your [QUnit][3] assertions.

Returns:

An instance of ```MonkeyTestJSPageTest```, suitable for chaining JQuery style.

Example:

In this example from **global/is_html_w3c_valid.js**, we're sending the page source to the W3C
validator for checking, then doing some assertions with the returned page.

```javascript

   this
   .asyncTest('Is HTML Valid?',function() {

        this.post(this.validatorUrl, {fragment:this.page.source})
        .success(function(data) { // we got some validation results

            // Do some assertions on the returned markup, eg:
            //    ok( true, 'HTML is valid' );

            // needs to be called upon async tests
            self.asyncTestDone();
        })
        .error(function() { // validation couldnt be performed.

            ok( false, 'Unable to get validation results' );

            // needs to be called upon async tests
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

### waitForPageLoadAfter (function ($){}, timeout[optional])

Executes the given function and then waits until a new page is loaded into the testing iframe before moving to the next
action in the chain. This can be useful if you need to trigger a page load and then run some tests, but you can't use
`loadPage()` - for example, a common use case is that you want to submit a form and then test some assertions on the
resultant page.

Parameters:

**toExecute (Function)** - A function to be called before waiting for a new page to load. The function will be called
in the context of the current test, i.e. the same `this` object as within a `test()` call; and it will be passed a
jQuery object bound to the page under test.

**timeout (Number)** - The maximum number of milliseconds you'd like to wait before proceeding with the next action in
the chain. Defaults to 5000 if unspecified.

Returns:

An instance of `MonkeyTestJSPageTest`, suitable for chaining JQuery stylee.

Example:

```javascript

    this
    .test ("Do we have a form in the page?", function($) {
        equal($('form').length, 1, "A form exists in the page");

        // submit empty form to get error messages
        $('input,textarea,select').val('');
    })
    .waitForPageLoadAfter(function($) {
        $('form').submit();
    })
    .test ("Submitting an empty form causes error messages", function($) {
        equal($('input[name="first_name"]').parent().hasClass('error'), 1, "Firstname field has an error");
    });

```

### wait (function, timeout, throttle)

Waits for expression to be evaluated to true or timeout to happen, keeps checking for expression on throttle interval.

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

### Cross-domain AJAX

MonkeyTestJS comes with built-in wrappers around JQuery's AJAX methods `jQuery.ajax()`, `jQuery.post()` and
`jQuery.get()`, which pass the request through a proxy on your server and thus allow you to access other domains from
within your tests. One of the included tests, `global/is_html_w3c_valid.js` makes use of this to be able to submit the
page source to the W3C validator as a cross-domain AJAX request:

```javascript
    this.post(this.validatorUrl, {fragment:this.page.source})
```

This call is identical to calling `jQuery.post()` with the same arguments, except that the URL is altered internally to
use the server-side proxy configured via the configuration property `proxyUrl`.

The `jQuery.get()` and `jQuery.ajax()` functions are wrapped in the same way. See the [jQuery API docs](http://api.jquery.com/category/ajax/)
for details on these methods - just call the equivalent functions on your test context object (`this`).

#### Using the included PHP proxy script

The included PHP proxy script restricts access to whitelisted domains, so when you want to use it in your tests you'll
probably need to add new domains to the whitelist. To do that, open the `proxy.php` in your editor and find the
`$valid_url_regex` variable. By default it contains two domains:

```php
$valid_url_regex = '/^(validator.w3.org\/|api.openweathermap.org\/)/';
```

Just modify the regular expression to accept whatever domains you need it to. Avoid opening up the proxy too much -
an open proxy on the internet can attract all kinds of uncool behaviour. If you're using your own proxy script, bear
this in mind too.

Writing Tests
-------------

Add the path to the test script to either the `config.globalTests` array or, for a specific page, to the `config.pages[].tests`
array. If the path starts with a slash (`/`) it will be interpreted as relative to the root; otherwise it will be taken as
relative to the configured `testsDir`.

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

Refer to example test **page/demo_page_test.js**

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
