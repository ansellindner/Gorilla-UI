/**
 *  scripts/controllers/mainController.js
 *
 *  A controller for the main menus and bars
 *  Will load and loop every minute to update
 */
'use strict';

angular.module('guerilla').controller(
    'mainController', 
    function( $scope, $http, $q ) {

        // create the scope array that we will put all our information
        $scope.info = [];
        // show LOADING to the user
        $scope.loader = true;
        $scope.info.loaded = false;
        // don't show the update button before the check is made
        $scope.needsUpdate = false;

        // call the main function
        loader();
        // set an interval to call the function regularly while the webpage is actively open
        var loop = setInterval( loader, 300000 ); // every 5 minutes

        // call the function to check for available updates
        updates();
        // set an interval to call the function regularly while the webpage is actively open
        // it will not check for updates if the page is not open
        var checkUpdate = setInterval(updates, 86400000); // every day

        function loader() {
            // show "LOADING" to the user instead of ONLINE
            $scope.info.loaded = false;

            // build array of get requests from our APIs
            $q.all([
                $http.get('http://192.168.0.160:8444/api/ip'),
                $http.get('http://192.168.0.160:8444/api/livesince'),
                $http.get('http://192.168.0.160:8444/api/getinfo'),
                $http.get('http://192.168.0.160:8444/api/networkstats'),
                $http.get('http://theindex.io/api/btc/index.php')
            ])
            // do this after all the get requests are completed
            .then(function( results ) {
                // create an empty array for the results
                var data = []; 
                // add all results to the array one at a time
                angular.forEach( results, function( result ) {
                    data = data.concat( result.data );
                });
                // Now let's set some variables to push info to the DOM
                // external ip
                $scope.info.ip = data[0].external_ip;
                // uptime
                var miniRunning = Date.now() - data[1].livesince;
                var day   = 86400000;
                if (miniRunning < day*365) {

                    if (miniRunning < day) {
                        $scope.info.livesince = '< 1 day';
                    } else {
                        var time = Math.round(miniRunning/day);
                        $scope.info.livesince = time +' days';
                    }
                }
                // Wire up the display of the data
                // The different numbers (ie data[2]) correspond to the different get requests
                $scope.info.peers = data[2].connections;
                $scope.info.difficulty = Math.round(data[2].difficulty);
                $scope.info.protocolversion = data[2].protocolversion;
                $scope.info.miniblock = data[2].blocks;

                $scope.info.txns = data[3].n_tx;
                $scope.info.blockmins = (data[3].minutes_between_blocks).toFixed(2);
                $scope.info.hashrate = Math.round(data[3].hash_rate);
                $scope.info.timestamp = data[3].timestamp;

                $scope.info.blocksbehind = (data[3].n_blocks_total - $scope.info.miniblock) + ' Blocks';

                $scope.info.index = data[4];
                
                // display the "ONLINE" message
                $scope.info.loaded = true;

                if($scope.info.loaded){
                    setTimeout(function(){
                        $scope.loader = false;
                    }, 2000);
                }
            });


        }

        // We need to check if an update is needed
        function updates() {
            // call our API
            $http.get('http://192.168.0.160:8444/admin/update')
            .then(function (response) {
                // the needsUpdate variable is bound to the DOM by an ngIf
                // The update button will appear if there is an update needed
                $scope.needsUpdate = response.data.needsUpdate;
                $scope.updateVersion = response.data.version;
            });
        }

        // $scope.$on('CONFIG', function() { $scope.STATSMENU = true; });
        // $scope.$on('HOME', function() { $scope.STATSMENU = false; });
        
});