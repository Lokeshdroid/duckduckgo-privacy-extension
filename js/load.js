var bg = chrome.extension.getBackgroundPage();

require.scopes.load = ( () => {

    function loadExtensionFile(url, returnType, source){
        var xhr = new XMLHttpRequest();

        if(source === 'external'){
            xhr.open("GET", url, false);
        }
        else {
            xhr.open("GET", chrome.extension.getURL(url), false);
        }

        xhr.send(null);

        if (xhr.readyState != 4) {
            return;
        }

        if (returnType === 'xml') {
            return xhr.responseXML;
        }
        
        if (returnType === 'json') {
            return xhr.responseText;
        }
    }

    function processMozillaBlockList(blockList){
        /* format Mozilla block list for our use
         * https://raw.githubusercontent.com/mozilla-services/shavar-prod-lists/master/disconnect-blacklist.json
         * "<tracker host>" : { "c": <company name>, "u": "company url" }
         */
        var trackers = {};
        var trackerTypes = ['Advertising', 'Analytics', 'Disconnect'];
        
        if (bg.isSocialBlockingEnabled) {
            trackerTypes.push('Social');
        }

        trackerTypes.forEach((type) => {
            blockList.categories[type].forEach((entry) => {
                for(var name in entry){
                    for( var domain in entry[name]){
                        entry[name][domain].forEach((trackerURL) => {
                        trackers[trackerURL] = {'c': name, 'u': domain};
                        });
                    }
                    
                    // Facebook and Twitter are listed as Disconnect type
                    // Remap them to Social
                    console.log("list tracker type: " + type);
                    if ((type === 'Disconnect') && (name.match(/(facebook|twitter)/i))) {
                        console.log(entry);
                        blockList.categories.Social.push(entry);
                        console.log("Social: " + blockList.categories.Social);
                        var id = blockList.categories.Disconnect.indexOf(entry);
                        blockList.categories.Disconnect.splice(id, 1);
                        console.log("Disconnect: " + blockList.categories.Social);
                    }
                }
            });
        });

        return trackers;
    }

    var exports = {};
    exports.loadExtensionFile = loadExtensionFile;
    exports.processMozillaBlockList = processMozillaBlockList;
    return exports;
})();
