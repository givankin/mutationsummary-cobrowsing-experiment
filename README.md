## What is this

An experiment in building the simplest screen-sharing application using only web stack.

Based on [mutation-summary](http://code.google.com/p/mutation-summary/) by [Rafael Weinstein](https://plus.google.com/111386188573471152118/posts), particularly on screen sharing extension included as one of the examples.

However, no browser extension is used and it works in all modern browsers.

On the other hand it doesn't support live DOM changes: only loading a page and navigating to other pages via anchor tags.

As it turned out in the process, PhantomJS currently (v 1.7) has no support for MutationObservers, so (after unsuccessful attempts to build it with latest WebKit) I stripped out all code that depended on it. In fact, that is the mutation-summary library itself: only the parts that are responsible for initial DOM copying and rebuilding from that copy (tree_mirror.js) are used.

## How to use

In order to run the code, you will need:

* PhantomJS v 1.7 or greater
* Node (I have 0.6.13 now and it works)
* Chrome or Firefox

When you got that, run

    git clone https://github.com/abbakym/mutationsummary-cobrowsing-experiment.git
    cd mutationsummary-cobrowsing-experiment
    npm install

After that, start the proxy server which will handle WebSockets connection between client and phantom instance:

    node wsproxy.js

If it tells you "Server listening on 8081", in another console instance start the phantom server

    phantomjs server.js

If it says "Web server running on port 8080", go to [http://localhost:8080](http://localhost:8080)

Enter the url in the address bar (don't omit the http:// part!) and wait a little.

If the page opens successfully, open [http://localhost:8080](http://localhost:8080) in another browser instance: you should see the "mirror" of the loaded page.

Note that first opened instance acts as a "master": you can enter urls in the address bar and click on links in the opened page. All subsequent instances are mere slaves: address bar is disabled and they just mirror what happens in the "master".

