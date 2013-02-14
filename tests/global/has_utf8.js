monkeyTest ('Has a UTF-8 meta tag',
    {
        setup:function () {

        }

        ,load : function () {
            this
            .loadPageSource ()
            .test("Do we have a UTF8 meta tag?", function() {
                var pos = this.page.source.indexOf('<meta charset="utf-8">');
                notEqual(pos,-1,"Has UTF-8 meta tag");
            })
            .start();
        }
    }
);