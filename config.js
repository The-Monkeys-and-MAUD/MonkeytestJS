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
                "tests": [ "page/has_facebook_appid.js", "page/demo_page_test.js" ]
            }
        ],
        "proxyUrl": "core/proxy.php?mode=native&url=<%= url %>",
        "loadSources": true
    };
})(this);