class OpenBrewery {
    constructor(id, name, type, street, city, state, zip, country, lat, lon, phone, website, taglist) {
        this.id = id;
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
        this.rating = 0;
    }
}
var openBreweries = [];
var pastBreweries = [];
var selectedBrewery = null;
var selectedBreweryIndex = -1;

$(document).ready(function () {
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
        console.log(brewery)
        $(".fa-star").on("click", function () {
            brewery.rating = parseInt($(this).attr("data-rating"))
            updateSelectedBreweryDisplay();
        })
    }

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

    // $(".past-brewery").on("click", function(event) {
    //     console.log(this);
    //     console.log($(this));
    // })

    loadFromLocalStorage();
    var searchBtn = $("#search-button");
    var citySearch = $("#brewery-search-city");
    var myMap = L.map('mapid').setView([33.7490, 84.3880], 12);
    var myLat, myLong;
    // var myCity, myState;
    var markers = [];
    // var responseDataEl = document.getElementById("response-data");
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
        var latitudes = 0;
        var longitudes = 0;
        var count = 0;
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
            // data: {
            //     by_city: city,
            //     by_state: state,
            //     per_page: 50
            // }
        }).then(function (response) {
            console.log(response)
            // clear out the old list
            openBreweries = [];
            //responseDataEl.textContent += `${JSON.stringify(response, null, 2)}\n`;
            for (var i = 0; i < response.length; i++) {
                // does it have lat/long?
                openBreweries.push(new OpenBrewery(response[i].id, response[i].name, response[i].brewery_type, response[i].street,
                    response[i].city, response[i].state, response[i].postal_code,
                    response[i].country, response[i].latitude, response[i].longitude,
                    response[i].phone, response[i].website_url, response[i].taglist));
                console.log(response[i].website_url);
                if (!response[i].longitude) continue;
                var lat = parseFloat(response[i].latitude);
                var lon = parseFloat(response[i].longitude);
                latitudes += lat;
                longitudes += lon;
                count++;
                var marker = L.marker([lat, lon]).addTo(myMap);
                marker.bindPopup(`<strong>${response[i].name}</strong><br>${response[i].brewery_type}`).openPopup();
                markers.push(marker);
            }
            if (count > 0) {
                var latitude = latitudes / count;
                var longitude = longitudes / count;
                myMap.setView([latitude, longitude], 12);
            }
            // console.log("populate the effing table")

            populateTable();
            searchBtn.removeClass("is-loading");
        });
    }

    function populateTable() {
        // we'll populate the table based on what's in the openBreweries array

        // <tr>
        //           <td>Rick Grimes</td>
        //           <td>rgrimes@gmail.com</td>
        //           <td>555-555-5555</td>
        //         </tr>
        var breweryTable = $("#brewery-table");
        breweryTable.empty()
        for (var i = 0; i < openBreweries.length; i++) {
            var nameTd = $("<td>").text(openBreweries[i].name);
            var streetTd = $("<td>").text(openBreweries[i].street);
            // var cityTd = $("<td>").text(openBreweries[i].city)
            var phoneTd = $("<td>").text(openBreweries[i].phone);
            var buttonTd = $("<td>").append($("<button>").text("Add").addClass("button is-primary add-button is-small").attr("data-index", i))
            var tableRow = $("<tr>").append(nameTd).append(streetTd).append(phoneTd).append(buttonTd);
            // console.log(tableRow);
            breweryTable.append(tableRow);
        }
        $(".add-button").on("click", function () {
            addBrewery(openBreweries[$(this).attr("data-index")]);
            // updatePastBreweryDisplay();
        });

    }

    searchBtn.on("click", function (event) {
        searchBtn.addClass("is-loading");
        event.preventDefault();
        var searchValue = citySearch.val();
        if (!searchValue) {
            console.log("nothing to search");
            searchBtn.removeClass("is-loading");
            return;
        }
        breweryResult(searchValue);
    });

    citySearch.on('keyup', function (e) {
        if (e.keyCode === 13) {
        searchBtn.addClass("is-loading");
        event.preventDefault();
        var searchValue = citySearch.val();
        if (!searchValue) {
            console.log("nothing to search");
            searchBtn.removeClass("is-loading");
            return;
        }
        breweryResult(searchValue);
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

    $("#twenty-one-plus").on("click", function() {
        $("#legal-modal").removeClass("is-active");
    })
});