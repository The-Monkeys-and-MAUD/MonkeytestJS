REQUIREMENTS
============
 * nodejs (http://nodejs.org/)
 * ruby
 * rubygems
 * grunt 0.3.x ( node module )
 * phantomjs
 * compass ( node module and ruby gem ) 
 * testem ( node module )
 * livereload ( node module and browser extenssion )
 * docco ( node module )
 * Pygments( python - this is a dependency of docco )

this will install the node modules globally and append to the bin path

    sudo easy_install Pygments &&
    sudo npm install -g grunt mocha testem livereload docco &&
    sudo gem install compass &&
    npm install

Now, in Chrome, install the Live Reload extension from the Chrome Web Store.
Also install phantomjs by following the instructions at http://phantomjs.org/download.html

DEVELOPMENT
===========
In development, run the following command to have the grunt watcher build your sass and js as you work:

    cd build/web/
    grunt dev

Prior to checkin, run a full grunt build to ensure the linter is happy with your code and all tests pass:

    grunt


BUILDING A RELEASE
==================
The deployment server should run the following to build the js and css prior to deploying to staging or prod:

    cd build/web/
    npm install         # in case someone has changed package.json and new modules need to be installed
    grunt
