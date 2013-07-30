registerTest ('Demo page test', {
    setup: function() {
        this.containerElement = this.workspace.document.getElementById("container");
        this.startBackground = this.containerElement.style.background; 
    },
    load:function() {
        this

        .test ("Do we have an element with the id 'container'?",function(){
            ok(this.containerElement,'An element with the id "container" exists.');
        })

        // run statements are executed before the test happens
        .run(function(){
            this.containerElement.style.background = "red";
        })
        .test ("Does container have a background color 'red'?",function(){
            equal(this.containerElement.style.background, 'red', 'Container background should now be red');
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
    }
});
