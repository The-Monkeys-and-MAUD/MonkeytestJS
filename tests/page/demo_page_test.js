registerTest ('Demo page test', {
    setup: function() {
        this.proxyUrl = '/tests/core/proxy.php?url=';
        this.containerElement = this.workspace.document.getElementById("container");
        this.startBackground = this.containerElement.style.background; 
        this.otherColor = "red";
    },
    load:function() {
        var self = this;
    
        self 
        .test ("Do we have an element with the id 'container'?",function(){
            ok(this.containerElement,'An element with the id "container" exists.');
        })

        // run statements are executed before the test happens
        .run(function(){
            this.containerElement.style.background = this.otherColor;
        })
        .test ("Does container have a background color of "+ self.otherColor +" ?",function(){
            equal(this.containerElement.style.background, this.otherColor, 'Container background should now be ' + self.otherColor );
        })
        .wait(1500) // wait 1.5 seconds ( Pause execution of tests per duration )

        // run statements are executed before the test happens
        .run(function(){
            this.containerElement.style.background = this.startBackground;
        })
        .wait(1500) // wait 1.5 seconds ( Pause execution of tests per duration )
        .test ("Have container background being restored to its previosu value?",function(){
            equal(this.containerElement.style.background, this.startBackground, 'Container background should now be set as its start value');
        })

        .waitForPageLoad() // tells the monkeytestJS that we are going to load a page next and that we should stop chaining execution until that gets loaded
        .loadPage("/tests/core/demo/other.html") // load a different page into the frame
        .run(function(){
            this.workspace.document.getElementsByTagName("body")[0].style.background = self.otherColor;

            // lets inject jquery on that workspace since it doesnt exist in there for this demo.
            this.workspace.jQuery = $$;
        })
        .wait(1500) // wait 1.5 seconds ( Pause execution of tests per duration )

        .asyncTest ("Can we load some content into the page from openweathermap.org?",function($){
            // lets setup a global function to receive a jsonp request
            var self = this, 
                url = "api.openweathermap.org/data/2.5/weather?q=Sydney,au",
                body = $("iframe").contents().find("body");

            $.get(this.proxyUrl + url)
            .success(function(data) { // we got some validation results

                var cityName = data.contents.name,
                    weather = data.contents.weather[0].description;

                ok( true, 'We got a response from wheather website using an assyncTest.' );
                ok( cityName, 'We got the city name from the json response.' );
                ok( weather, 'We got the weather description from the json response.' );

                // update the page just for the sake of displaying some visual info
                body
                .css({"background": "white"})
                .find("h1")
                .html(cityName + " weather now: " + weather);

                self.asyncTestDone();
            })
            .error(function() { // validation couldnt be performed.

                ok( false, 'Unable to load content from the weather station.' );

                // needs to be called upon assync tests
                self.asyncTestDone();
            });
        })
    }
});
