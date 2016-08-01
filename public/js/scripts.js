// Google Map
// will contain a reference (i.e., a pointer of sorts) to the map we’ll soon be instantiating;
var map;

// markers for map
// will contain references to any markers we add atop the map;
var markers = [];

// info window
// a reference to an "info window" in which we’ll ultimately display links to articles.
var info = new google.maps.InfoWindow();

// styles for map
// https://developers.google.com/maps/documentation/javascript/styling
// an array of two objects that we’ll use to configure our map
var styles = [

    // hide Google's labels
    {
        featureType: "all",
        elementType: "labels",
        stylers: [
            {visibility: "off"}
        ]
    },

    // hide roads
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [
            {visibility: "off"}
        ]
    }

];

var styles1 = [

    // hide Google's labels
    {
        featureType: "all",
        elementType: "labels",
        stylers: [
            {visibility: "off"}
        ]
    },

    // hide roads
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [
            {visibility: "on"}
        ]
    }

];

// execute when the DOM is fully loaded
$(function() {

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 39.5814, lng:	-104.9557}, // LIttleton, CO
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };
    
    var options1 = {
        center: {lat: 39.5814, lng:	-104.9557}, // LIttleton, CO
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles1,
        zoom: 13,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    //$("#map-canvas") returns a jQuery object (that has a whole bunch of functionality built-in),
    // $("#map-canvas").get(0) returns the actual, underlying DOM node that jQuery is just wrapping.
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    // Perhaps the most powerful line yet is the next one in which we assign map (that global variable) a value
    // we’re telling the browser to instantiate a new map, injecting it into the 
    // DOM node specified by canvas), configured per options.
    map = new google.maps.Map(canvas, options);
    var map_canvas = map;
    
    //map1 = new google.maps.Map(canvas, options1);
    
    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

       $("#car").on("click", function(){
        $(this).toggleClass("roads-hidden");
        if(map_canvas == map)
        {
            map1 = new google.maps.Map(canvas, options1);
            map_canvas = map1;
        }
        else
        {
            map = new google.maps.Map(canvas, options);
            map_canvas = map;
        }
    }); 
});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    // we are speaking JS now
    // get lat and lang from places object
    var myLatLng = {lat: Number(place.latitude), lng: +place.longitude};
    
    var label = place.place_name + ", " + place.admin_name1;
    // to tell marker where to go
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        animation: google.maps.Animation.DROP,
        // animation: google.maps.Animation.BOUNCE,
        // city
        title: label,
        // label: label
        // setLabel(label) //unexpected token } next line 101
    });
    
    marker.addListener('click', showArticles);
    
    // add markers to end of array
    markers.push(marker);
    
    function showArticles(event) {
        getArticlesContent(label, function(articles){
           //  console.log(articles);
           var template =  _.template('<li><a href="<%- link %>"><%- title %></a></li>');
           var content = "<ul>";
           for(i=0; i < 10; i++){
               content += template({link: articles[i].link, title: articles[i].title});
           }
           content += "</ul>";
           showInfo(marker, content);
        });
    }
    // 
}



/**
 * Configures application.
 */
function configure()
{
    //  listen for a dragend event on the map, calling the anonymous function 
    // provided when we hear it. That anonymous function, meanwhile, simply calls update
    // update UI after map has been dragged
    // dragend is "fired" (i.e., broadcasted) "when the user stops dragging the map."
    google.maps.event.addListener(map, "dragend", function() {
        update();
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // remove markers whilst dragging
    google.maps.event.addListener(map, "dragstart", function() {
        removeMarkers();
    });

    // configure typeahead
    // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
    $("#q").typeahead({
        autoselect: true,
        highlight: true,
        minLength: 1
    },
    {
        source: search,
        templates: {
            empty: "no places found yet",
            // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md 
            //  the value of source (i.e., search) is the function that the plugin will 
            // call as soon as the user starts typing so that the function can r
            // espond with an array of search results based on the user’s input
            // Ultimately, you’ll want to change that tvalue to something like
            // <p><%- place_name %>, <%- admin_name1 %></p>
            suggestion: _.template("<p><%- place_name %>, <%- admin_code1 %> <%- postal_code %></p>")
        }
    });

    // re-center map after place is selected from drop-down
    // we want jQuery to call an anonymous function whose second argument, 
    // suggestion, will be an object that represents the entry selected. 
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // ensure coordinates are numbers
        var latitude = (_.isNumber(suggestion.latitude)) ? suggestion.latitude : parseFloat(suggestion.latitude);
        var longitude = (_.isNumber(suggestion.longitude)) ? suggestion.longitude : parseFloat(suggestion.longitude);

        // set map's center
        map.setCenter({lat: latitude, lng: longitude});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        hideInfo();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true; 
        event.stopPropagation && event.stopPropagation(); 
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Hides info window.
 */
function hideInfo()
{
    info.close();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    // TODO
    _.each(
        markers, function(marker){
            marker.setMap(null);
        }
    );
    markers = [];
}

/**
 * Searches database for typeahead's suggestions.
 */
 // cb = callback
 // in this case, the cb is a function that search should call as 
 // soon as it’s done searching for matches
 // search uses jQuery’s getJSON method to contact search.php asynchronously, 
 // passing in one parameter, geo, the value of which is query. Once search.php 
 // responds (however many milliseconds or seconds later), the anonymous 
 // function passed to done will be called and passed data, whose value will be 
 // whatever JSON that search.php has emitted
function search(query, cb)
{
    // get places matching query (asynchronously)
    var parameters = {
        geo: query
    };
    $.getJSON("search.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console, not to terminal
        console.log(errorThrown.toString());
    });
}

function getArticlesContent(query, cb)
{
    // get places matching query (asynchronously)
    var parameters = {
        geo: query
    };
    $.getJSON("articles.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        cb(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console, not to terminal
        console.log(errorThrown.toString());
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) === "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='img/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update() 
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON("update.php", parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers();

        // add new markers to map
        for (var i = 0; i < data.length; i++)
        {
            addMarker(data[i]);
        }
     })
     .fail(function(jqXHR, textStatus, errorThrown) {

         // log error to browser's console
         console.log(errorThrown.toString());
     });
}