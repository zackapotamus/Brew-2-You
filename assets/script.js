// VARIABLES:
class OpenBrewery {
    constructor(id, name, type, street, city, state, zip, country, lat, lon, phone, website, taglist) {
        this.id = id;
        this.name = name;
        // Name of Brewery
        this.type = type;
        // Type of Brewery
        this.street = street;
        // Street Address of Brewery
        this.city = city;
        // City of Brewery
        this.state = state;
        // State in Brewery
        this.zip = zip;
        // Zip Code of Brewery
        this.country = country;
        // Country of Brewery
        this.latitude = lat;
        // Latitude of Brewery
        this.longitude = lon;
        // Longitude of Brewery
        this.phone = phone;
        // Phone Number of Brewery
        this.website = website;
        // Website of Brewery
        this.taglist = taglist || [];
        this.rating = 0;
    }
}
var openBreweries = [];
var pastBreweries = [];
var selectedBrewery = null;
var selectedBreweryIndex = -1;

$(document).ready(function () {
    // Function to load from localStorage
    function loadFromLocalStorage() {
        pastBreweries = JSON.parse(localStorage.getItem("pastBreweries")) || [];
        updatePastBreweryDisplay();
        $(".past-brewery").on("click", function (event) {
            event.preventDefault();
            _this = $(this).first();
            if (selectedBrewery) {
                selectedBrewery.removeClass("is-active");
            }
            selectedBrewery = _this;
            selectedBreweryIndex = _this.attr("data-index");
            updateSelectedBreweryDisplay();
            _this.addClass("is-active");
        });
    }
    // Function that adds data to selected brewery display on page load/on button click 
    function updateSelectedBreweryDisplay() {
        var brewery = pastBreweries[selectedBreweryIndex];
        var rating = "";
        for (var i = 0; i < 5; i++) {
            if (i < brewery.rating) {
                rating += "<span class=\"fa fa-star checked-star\" data-rating=\"" + (i + 1) + "\"></span>";
            } else {
                rating += "<span class=\"fa fa-star\" data-rating=\"" + (i + 1) + "\"></span>";
            }
        }
        $("#brewery-name").text(brewery.name);
        $("#brewery-type").text(brewery.type);
        $("#brewery-address").text(brewery.street);
        $("#brewery-city").text(brewery.city);
        $("#brewery-state").text(brewery.state);
        $("#brewery-zip").text(brewery.zip);
        $("#brewery-phone").text(brewery.phone);
        if (brewery.website) {
            $("#brewery-website").html(`<a href="${brewery.website}" target="_blank">${brewery.website}</a>`)
        } else {
            $("#brewery-website").empty();
        }
        $("#brewery-rating").html(rating);
        $(".fa-star").on("click", function () {
            brewery.rating = parseInt($(this).attr("data-rating"))
            updateSelectedBreweryDisplay();
        })
    }
    // Function that updates the past brewery display following an on click event
    function updatePastBreweryDisplay() {

        var breweryList = $("#brewery-list").empty();
        for (var i = 0; i < pastBreweries.length; i++) {
            var listNode = $("<li>").addClass("brewery-item");
            var linkNode = $("<a>").attr("href", "#").attr("data-index", i).addClass("past-brewery").text(pastBreweries[i].name);
            if (i == selectedBreweryIndex) {
                linkNode.addClass("is-active");
                selectedBrewery = linkNode;
            }
            listNode.append(linkNode);
            breweryList.append(listNode);
        }
    }


    loadFromLocalStorage();
    var searchBtn = $("#city-search-button");
    // Search Button 
    var citySearch = $("#brewery-search-city");
    // Search Input Field
    var myMap = L.map('mapid').setView([33.7490, 84.3880], 12);
    // Map variable
    var myLat, myLong;
    var myCity, myState;
    var markers = [];

    // Api Call for MapBox api
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
        data: {
            token: "d31c84f34635a4"
        }
    }).then(function (response) {
        var latLong = response.loc.split(",");
        myLat = parseFloat(latLong[0]);
        myLong = parseFloat(latLong[1]);
        myMap.setView([myLat, myLong], 12);
        breweryResult(response.city, response.region);
    });

    function breweryResult(city, state) {
        myCity = city;
        myState = state;
        $("#map-location").text(cityStateDisplay());
        var latitudes = 0;
        var longitudes = 0;
        var latLongCount = 0;
        var zipCodes = [];
        var zipMap = {};
        var data = {
            by_city: city,
            per_page: 50
        }
        if (state) {
            data.by_state = state;
        }

        $.ajax({
            url: "https://api.openbrewerydb.org/breweries",
            method: "GET",
            data: data
        }).then(function (response) {
            openBreweries = [];
            for (var i = 0; i < response.length; i++) {
                openBreweries.push(new OpenBrewery(response[i].id, response[i].name, response[i].brewery_type, response[i].street,
                    response[i].city, response[i].state, response[i].postal_code,
                    response[i].country, response[i].latitude, response[i].longitude,
                    response[i].phone, response[i].website_url, response[i].taglist));
                if (response[i].postal_code) {
                    zipCodes.push(response[i].postal_code);
                    zipMap[response[i].postal_code.substr(0, 5)] = {
                        name: response[i].name,
                        type: response[i].brewery_type
                    }
                }
                if (!response[i].longitude) continue;
                var lat = parseFloat(response[i].latitude);
                var lon = parseFloat(response[i].longitude);
                latitudes += lat;
                longitudes += lon;
                latLongCount++;
                var marker = L.marker([lat, lon]).addTo(myMap);
                marker.bindPopup(`<strong>${response[i].name}</strong><br>${response[i].brewery_type}`).openPopup();
                markers.push(marker);
            }
            if (latLongCount > 0) {
                var latitude = latitudes / latLongCount;
                var longitude = longitudes / latLongCount;
                myMap.setView([latitude, longitude], 12);
            }
            console.log(zipMap);
            // if ("name" in zipMap[zipCodes[i]])
            // console.log('("name" in zipMap["30040-0301"]): ' + ("name" in zipMap["30040-0301"]));
            if (latLongCount == 0 && openBreweries.length > 0 && zipCodes.length > 0) {
                console.log("breweries without lat/long but with zips encountered");
                // do the api call to get lat/long for the zip codes we have
                $.ajax({
                    url: `https://www.zipcodeapi.com/rest/js-Nnn7hLGxyH23bgyKajKNzc2VzJWHRTnB4khm2upnBUmfRGBcJv0mWBWZtP37HhC1/multi-info.json/${zipCodes.join(",")}/degrees`,
                    method: "GET",
                }).then(function (response) {
                    console.log(response);
                    console.log("inside the ajax 'then'")
                    var lats = 0;
                    var longs = 0;
                    var latLongCount = 0;
                    var zipCodes = Object.keys(response);
                    for (var i = 0; i < zipCodes.length; i++) {
                        console.log(response[zipCodes[i]]);
                        var lat = response[zipCodes[i]].lat;
                        var lon = response[zipCodes[i]].lng;
                        lats += lat;
                        longs += lon;
                        latLongCount++;
                        // console.log('zipMap[response[zipCodes[i]]]' + zipMap[response[zipCodes[i]]]);
                        // if ("name" in zipMap[response[zipCodes[i]]]) {
                        var marker = L.marker([lat, lon]).addTo(myMap);
                        marker.bindPopup(`<strong>${zipMap[[zipCodes[i]].name]}</strong><br>${zipMap[zipCodes[i]].type}`).openPopup();
                        markers.push(marker);
                        // }
                    }
                    var latitude = lats / latLongCount;
                    var longitude = longs / latLongCount;
                    if (latLongCount > 0) {
                        myMap.setView([latitude, longitude], 12);
                    }
                });
            }

            populateTable();
            searchBtn.removeClass("is-loading");
        });
    }

    function cityStateDisplay() {
        return myState ? `${myCity}, ${myState}` : `${myCity}`;
    }
    // Populates table with the data called from the breweryResult function
    function populateTable() {
        breweryResultsTable = $("#brewery-results");
        cityStateSpan = $("#city-state");
        noBreweriesNotification = $("#no-breweries");
        // we'll populate the table based on what's in the openBreweries array

        console.log("populateTable() called. openBreweries length: " + openBreweries.length);
        if (openBreweries.length === 0) {
            document.location.href = "#results-column";
            var cityState = cityStateDisplay();
            cityStateSpan.text(cityState);
            breweryResultsTable.attr("style", "display: none;");
            noBreweriesNotification.attr("style", "display: block;");
        } else {
            noBreweriesNotification.attr("style", "display: none;");
            breweryResultsTable.attr("style", "display: block;");
        }

        var breweryTable = $("#brewery-table");
        breweryTable.empty()
        for (var i = 0; i < openBreweries.length; i++) {
            var nameTd = $("<td>").text(openBreweries[i].name);
            var streetTd = $("<td>").text(openBreweries[i].street);
            var phoneTd = $("<td>").text(openBreweries[i].phone);
            var buttonTd = $("<td>").append($("<button>").text("Add").addClass("button is-primary add-button is-small").attr("data-index", i))
            var tableRow = $("<tr>").append(nameTd).append(streetTd).append(phoneTd).append(buttonTd);
            breweryTable.append(tableRow);
        }
        $(".add-button").on("click", function () {
            addBrewery(openBreweries[$(this).attr("data-index")]);
        });

    }

    searchBtn.on("click", function (event) {
        doSearch();
    });

    function doSearch() {
        searchBtn.addClass("is-loading");
        event.preventDefault();
        var searchValue = citySearch.val();
        if (!searchValue) {
            searchBtn.removeClass("is-loading");
            return;
        }
        breweryResult(searchValue);
    }

    citySearch.on('keyup', function (e) {
        if (e.keyCode === 13) {
            doSearch()
        }
    });

    function addBrewery(brewery) {
        for (var i = 0; i < pastBreweries.length; i++) {
            if (pastBreweries[i].id === brewery.id) return;
        }
        pastBreweries.push(brewery);
        localStorage.setItem("pastBreweries", JSON.stringify(pastBreweries));
        loadFromLocalStorage();
    }

    $("#twenty-one-plus").on("click", function () {
        $("#legal-modal").removeClass("is-active");
    })
});