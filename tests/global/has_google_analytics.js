monkeyTest ('Has Google Analytics',
    function ($, container) {
        var scripts = $('script');

        asyncTest( "test we have a GA script tag", function() {
            var found = false;
            for(var i=0;i<scripts.length;i++)
            {
                var src = $(scripts[i]).attr('src');
                if (src && src.indexOf('www.google-analytics.com/ga.js')>=0) {
                   found = true;
                }
            }

            equal( found, true, "tag found" );
            QUnit.start ();
        });

        // little hacky - tried looking at the container._gat and container._gaq objects to determine the id
        // but couldn't find anything
        asyncTest( "test we have a valid GA ID (not UA-XXXXX-X)", function() {
            var found = false;
            for(var i=0;i<scripts.length;i++)
            {
                var html = $(scripts[i]).html();
                if (html && html.indexOf("_setAccount','UA-")>=0 && html.indexOf("_setAccount','UA-XXXXX-X")<0) {
                    found = true;
                }
            }

            equal( found, true, "id found" );
            QUnit.start ();
        });
    }
);