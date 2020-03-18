class OpenBrewery {
    constructor(name, type, street, city, state, zip, country, lat, lon, phone, website, taglist) {
        this.name = name;
        this.type = type;
        this.street = street;
        this.city = city;
        this.state = state;
        this.zip = zip;
        this.country = country;
        this.latitude = lat;
        this.longitude = lon;
        this.phone = phone;
        this.website = website;
        this.taglist = taglist || [];
    }
}
var openBreweries = [];

$( document ).ready(function() {
    var searchBtn = $("#search-button");
    var citySearch = $("#brewery-search-city");
    var myMap = L.map('mapid').setView([33.7490, 84.3880], 12);
    var myLat, myLong;
    var myCity, myState;
    var markers = [];
    var responseDataEl = document.getElementById("response-data");
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiZnVua2Fwb3RhbXVzIiwiYSI6ImNrN3RrZ3I0ZzBhZG0zZXAwcDE2cWJ0ZW8ifQ.Lo81UrYUl6eRUmh3MxzO6g'
    }).addTo(myMap);
    $.ajax({
        url: "https://ipinfo.io",
        method: "GET",
        data: {token: "d31c84f34635a4"}
    }).then(function(response) {
        console.log(response);
        //responseDataEl.textContent += `${JSON.stringify(response, null, 2)}\n`;
        //console.log(JSON.stringify(response, null, 2))
        var latLong = response.loc.split(",");
        myLat = parseFloat(latLong[0]);
        myLong = parseFloat(latLong[1]);
        myMap.setView([myLat, myLong], 12);
        breweryResult(response.city, response.region);
        //populateTable();
    });

     function breweryResult(city, state) {
        $.ajax({
            url: "https://api.openbrewerydb.org/breweries",
            method: "GET",
            data: {by_city: city, by_state: state, per_page: 50}
        }).then(function(response) {
            console.log(response)
            // clear out the old list
            openBreweries = [];
            //responseDataEl.textContent += `${JSON.stringify(response, null, 2)}\n`;
            for (var i=0; i < response.length; i++) {
                // does it have lat/long?
                openBreweries.push(new OpenBrewery(response[i].name, response[i].brewery_type, response[i].street,
                                                   response[i].city, response[i].state, response[i].postal_code,
                                                   response[i].country, response[i].latitude, response[i].longitude,
                                                   response[i].phone, response[i].website, response[i].taglist));
                if (!response[i].longitude) continue;
                var marker = L.marker([parseFloat(response[i].latitude), parseFloat(response[i].longitude)]).addTo(myMap);
                marker.bindPopup(`<strong>${response[i].name}</strong><br>${response[i].brewery_type}`).openPopup();
                markers.push(marker);
            }
            console.log("populate the effing table")
  
              populateTable();
      });
    }

    function populateTable() {
        // we'll populate the table based on what's in the openBreweries array

        // <tr>
        //           <td>Rick Grimes</td>
        //           <td>rgrimes@gmail.com</td>
        //           <td>555-555-5555</td>
        //         </tr>
        for (var i=0; i < openBreweries.length; i++) {
            var nameTd = $("<td>").text(openBreweries[i].name);
            var streetTd = $("<td>").text(openBreweries[i].street);
            var phoneTd = $("<td>").text(openBreweries[i].phone) ;
            var tableRow = $("<tr>").append(nameTd).append(streetTd).append(phoneTd);
            console.log(tableRow);
            $("#brewery-table").append(tableRow);       
        }

    }


});