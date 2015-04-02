registerTest('Does not contain any Development URLs', {
    setup: function() {

    	 this.devUrl = 'mytesturl.co';
    },
    
    load: function() {
        this 
        .test ("No Development URLs present?", function(assert) {

			var html = this.page.source,
				found = html.indexOf(this.devUrl);
			assert.ok(found < 0, "No dev URLs were found");

        })

        .test ("Fake test #2",function(assert, $){

                var p = $("p");
                assert.ok(p.length > 0, "OK");

        })

        .test ("Faux test #3",function(assert){
            var yep = true;
            assert.ok(yep, "OK");

        })
    }
});