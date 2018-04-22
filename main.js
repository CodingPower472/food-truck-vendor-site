
console.log('is working');

var signUpBtn = $('#sign-up-btn');
var signInBtn = $('#sign-in-btn');
var nameInput = $('#name');
var emailInput = $('#email');
var passwordInput = $('#password');
var blocksWrapper = $('#blocks-wrapper');
var submitSignUpBtn = $('#submit-sign-up');
var submitSignInBtn = $('#submit-sign-in');
var addBlockBtn = $('#add-block-btn');
var changeScheduleBtn = $('#change-schedule-btn');
var error = $('#error');
var typeInput = $('#type');

var nameLbl = $('#name-lbl');
var emailPswdLbls = $('#email-lbl, #pswd-lbl');

var numBlocks = 0;
var baseUrl = 'https://54.202.150.58:8080/api';

var token;

var INIT_NUM_BLOCKS = 1;

var gMapsApiKey = 'AIzaSyBGfixl6FkjPxzggtHfEOhN-S1ROMQ8q-I';
var gMapsBaseUrl = 'https://maps.googleapis.com/api/geocode/json';

function getLatLng(address) {
    return $.ajax({
        type: 'GET',
        url: gMapsBaseUrl,
        data: {
            address: address,
            key: gMapsApiKey
        }
    });
}

$('#schedule-wrapper').hide();
nameLbl.hide();
emailPswdLbls.hide();
submitSignInBtn.hide();
submitSignUpBtn.hide();
blocksWrapper.hide();
$('#type-lbl').hide();
$('#change-schedule-btn').hide();

function saveToken() {
    localStorage.setItem('token', JSON.stringify(token))
}

function getToken() {
    return localStorage.getItem('token');
}

token = getToken();

if (token) {
    loadInUsingToken();
}

function loadInUsingToken() {
    $.ajax({
        method: 'GET',
        url: baseUrl + '/api/vendors/info',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            token: token
        })
    })
}

function parseTime(timeInput) {

    console.log('Parsing time: ' + timeInput);

    var splitted = timeInput.split(' ');
    var msInMinute = 60 * 1000;
    var msInHour = 60 * msInMinute;
    var msInDay = 24 * msInHour;
    var ms = 0;
    
    var day = splitted[0].toLowerCase();
    console.log(splitted);
    var splittedHrMin = splitted[1].split(':');
    var hr = parseInt(splittedHrMin[0]);
    console.log("Hour/minute: " + splittedHrMin);
    var min = parseInt(splittedHrMin[1]);
    var amPm = splitted[2].toLowerCase();
    console.log('AM/PM: ' + amPm);

    var dayNumMap = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };

    console.log('Day value: ' + dayNumMap[day]);

    ms += dayNumMap[day] * msInDay;
    ms += (hr % 12) * msInHour
    ms += min * msInMinute
    if (amPm == 'pm') {
        ms += 12 * msInHour;
    }

    return ms;

}

function parseLoc(locInput) {
    console.log('Parsing location: ' + locInput);
    return $.ajax({
        method: 'GET',
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        data: {
            address: locInput,
            key: gMapsApiKey
        },
        dataType: 'json'
    });
}

function getSchedule() {
    var blocks = [];
    var promises = [];
    console.log('Num blocks: ' + numBlocks);
    for (var i = 0; i < numBlocks; i++) {
        console.log('Searching block-' + i);
        var startTimeInput = $('#block-start-' + i).val();
        var endTimeInput = $('#block-end-' + i).val();
        var locationInput = $('#location-' + i).val();
        try {
            var startTimeMs = parseTime(startTimeInput);
            var endTimeMs = parseTime(endTimeInput);
            var latLong = parseLoc(locationInput);
            promises.push(latLong);
            blocks.push({
                startTime: startTimeMs,
                endTime: endTimeMs
            });
        } catch (err) {
            console.log(err);
        }
    }
    return Promise.all(promises)
        .then(function(latLongs) {
            var res = [];
            for (var i = 0; i < blocks.length; i++) {
                var latLong = latLongs[i];
                console.log(latLong);
                var loc = latLong.results[0].geometry.location;
                var lat = loc.lat;
                var lng = loc.lng;
                res.push({
                    startTime: blocks[i].startTime,
                    endTime: blocks[i].endTime,
                    lat: lat,
                    long: lng
                });
            }
            console.log(res);
            return res;
        });
}

function addBlock() {
    var str = '';
    var divWrapperStr = '<div id="block-' + numBlocks + '"></div>';
    var divWrapper = $(divWrapperStr);

    str += '<label>Start of block: <input id="block-start-' + numBlocks + '" placeholder="e.g. Sunday 7:00 AM"></label>';
    str += '\n';
    str += '<label>End of block: <input id="block-end-' + numBlocks + '" placeholder="e.g. Sunday 12:00 PM"></label>';
    str += '\n';
    str += '<label>Location: <input id="location-' + numBlocks + '" placeholder="1600 Ampitheatre Parkway, Mountain View, CA 94043"></label>'

    divWrapper.append(str);

    divWrapper.appendTo(blocksWrapper);
    
    numBlocks++;
}

function reverseParseTime(ms) {

    var seconds = Math.floor(ms / 1000);
    var minute = Math.floor(seconds / 60);
    var seconds = seconds % 60;
    var hour = Math.floor(minute / 60);
    var minute = minute % 60;
    var day = Math.floor(hour / 24);
    var hour = hour % 24;

    var dow;

    switch(day) {
        case 0:
            dow = 'Sunday';
            break;
        case 1:
            dow = 'Monday';
            break;
        case 2:
            dow = 'Tuesday';
            break;
        case 3:
            dow = 'Wednesday';
            break;
        case 4:
            dow = 'Thursday';
            break;
        case 5:
            dow = 'Friday';
            break;
        case 6:
            dow = 'Saturday';
            break;
    }

    var amPm = 'AM';

    if (hour === 0) {
        hour = 12;
    } else if (hour == 12) {
        amPm = 'PM';
    } else if (hour > 12) {
        amPm = 'PM';
        hour = hour - 12;
    }

    var minuteStr = minute;

    if (minute < 10) {
        minuteStr = '0' + minute;
    }

    return dow + ' ' + hour + ':' + minuteStr + ' ' + amPm;

}

function updateSchedule() {

    var schedulePromise = getSchedule();

    schedulePromise.then(function(schedule) {

        $.ajax({
            type: 'PUT',
            url: baseUrl + '/vendors',
            data: JSON.stringify({
                schedule: schedule,
                token: token
            }),
            dataType: 'json',
            contentType: 'application/json'
        });

    });

}

function reverseGeo(lat, long) {
    return $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        data: {
            latlng: lat + ',' + long,
            key: gMapsApiKey
        }
    })
        .then(function(data) {
            console.log(data);
            return data.results[0]["formatted_address"];
        });
}

function loadInSchedule(schedule) {
    blocksWrapper.html('');
    blocksWrapper.show();
    $('#schedule-wrapper').show();
    numBlocks = 0;
    var promises = [];
    for (var i = 0; i < schedule.length; i++) {
        var block = schedule[i];

        promises.push(reverseGeo(block.lat, block.long));
            
    }
    Promise.all(promises)
        .then(function(addresses) {

            for (var i = 0; i < addresses.length; i++) {

                var block = schedule[i];
                var address = addresses[i];

                var startStr = reverseParseTime(block.startTime);
                var endStr = reverseParseTime(block.endTime);

                var str = '';
                var divWrapperStr = '<div id="block-' + i + '"></div>';
                var divWrapper = $(divWrapperStr);

                console.log(address);

                var block = schedule[numBlocks];

                str += '<label>Start of block: <input id="block-start-' + i + '" placeholder="e.g. Sunday 7:00 AM" value="' + startStr + '"></label>';
                str += '\n';
                str += '<label>End of block: <input id="block-end-' + i + '" placeholder="e.g. Sunday 12:00 PM" value="' + endStr + '"></label>';
                str += '\n';
                str += '<label>Location: <input id="location-' + i + '" placeholder="e.g. 1600 Ampitheatre Parkway, Mountain View, CA 94043" value="' + address + '"></label>'

                divWrapper.append(str);

                divWrapper.appendTo(blocksWrapper);

                console.log('Appended');
                
                numBlocks++;

            }

        });
}

function signUp() {

    console.log('Signing up');

    var name = nameInput.val();
    var email = emailInput.val();
    var password = passwordInput.val();
    var type = typeInput.val().toLowerCase().replace(' ', '');

    if (type === 'a') {
        error.text('Please select a type');
        return;
    }

    console.log('Signing up with details: ');

    var schedulePromise = getSchedule();

    schedulePromise.then(function(schedule) {

        console.log(schedule);

        $.ajax({
            type: 'POST',
            url: baseUrl + '/vendors',
            data: JSON.stringify({
                name: name,
                email: email,
                pswd: password,
                schedule: schedule,
                type: type
            }),
            success: function(data, textStatus, jqXHR) {
                if (data.code === 0) {
                    console.log('Success');
                    console.log(data);
                    token = data.token;
                    saveToken();
                    changeScheduleBtn.show();
                    $('.auth').hide();
                } else if (data.code == 1) {
                    error.text('Email is already registered');
                } else {
                    error.text('An unrecognized error occured');
                }
            },
            error: function(jqXhr, textStatus, errorThrown) {
                console.log('Error: ' + errorThrown);
            },
            dataType: 'json',
            contentType: 'application/json'
        });

    });

   /* $.post(baseUrl + '/vendors', JSON.stringify({
        name: name,
        email: email,
        pswd: password,
        schedule: schedule
    }), function(a, b) {
        console.log(a);
        $('.auth').hide();
    });*/

}

function signIn() {
    console.log('Signing in');
    var email = emailInput.val();
    var password = passwordInput.val();
    /*$.post(baseUrl + '/login', {
        email: email,
        pswd: password
    })
        .done(function(data) {
            loadInSchedule(data);
        })
        .fail(function(err) {
            console.log('Error signing in: ' + err);
        });*/
    $.ajax({
        type: 'POST',
        url: baseUrl + '/login',
        data: JSON.stringify({
            email: email,
            pswd: password
        }),
        success: function(data, textStatus, jqXhr) {
            if (data.code === 0) {
                console.log('Successfully logged in');
                var user = data.user;
                console.log(user);
                token = user['_id'];
                changeScheduleBtn.show();
                $('.auth').hide();
                loadInSchedule(user.schedule);
            } else if (data.code === 1) {
                console.log('Email not recognized');
                error.text('Email not recognized.');
            } else if (data.code === 2) {
                console.log('Vendor not accepted yet');
                error.text('Vendor not accepted yet');
            } else if (data.code === 3) {
                console.log('Email/password incorrect.');
                error.text('Email/password incorrect.');
            }
        },
        contentType: 'application/json',
        dataType: 'json'
    })
}

signUpBtn.click(function(e) {
    console.log('sign up btn');
    nameLbl.show();
    emailPswdLbls.show();
    signUpBtn.hide();
    signInBtn.show();
    submitSignInBtn.hide();
    submitSignUpBtn.show();
    $('#schedule-wrapper').show();
    blocksWrapper.show();
    $('#type-lbl').show();
    for (var i = 0; i < INIT_NUM_BLOCKS; i++) {
        addBlock();
    }
});

submitSignUpBtn.click(signUp);

signInBtn.click(function(e) {
    nameLbl.hide();
    emailPswdLbls.show();
    submitSignInBtn.show();
    submitSignUpBtn.hide();
    signInBtn.hide();
    signUpBtn.show();
    $('#schedule-wrapper').hide();
    blocksWrapper.hide();
});

submitSignInBtn.click(signIn);

addBlockBtn.click(addBlock);

changeScheduleBtn.click(updateSchedule);
