registerTest ('Has a UTF-8 meta tag', {
    setup:function () {

        // lets store the source code as lowercase in order to validate UTF-8 and utf-8
        this.sourceCode = this.page.source.toLowerCase();
    },
    load : function () {
        this
        .loadPageSource() // making sure that the dom has finished loading on the iframe
        .test("Do we have a UTF8 meta tag?", function() {
            // do we have an utf8 metatag ?
            notEqual(this.sourceCode.indexOf('<meta charset="utf-8">'),-1,"Has UTF-8 meta tag");
        })
        .start();
    }
});
