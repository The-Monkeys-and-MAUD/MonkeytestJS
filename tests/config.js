(function(global) {
    global.monkeytestjs = {
        "facebookId": "000000000000000",

        "local": {
            "env": ["dev"]
        },
        "stage": {
            "env": ["stage"],
            "facebookId": "222222222222222"
        },
        "production": {
            "env": [".io"],
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
                "url": "/"
            },
            {
                "url": "/docs"
            },
            {
                "url": "/philosophy"
            },
            {
                "url": "/projects"
            }

        ],
        "proxyUrl": "core/proxy.php?mode=native&url=<%= url %>",
        "loadSources": true
    };
})(this);