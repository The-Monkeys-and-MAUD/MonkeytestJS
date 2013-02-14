monkeyTest ('Is not a server error page',
    {
        setup:function () {

        }

        ,load : function () {
        this
            .loadPage()
            .test("Do we have a Server Error message in the page?", function( $ ) {
                equal($("body").hasClass("pageError"), false, "No server error");
            })
            .start();
    }
    }
);
