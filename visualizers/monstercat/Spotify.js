//If you're interested in setting up spotify support in your app, you're free to use the following code so long as you provide recognition
//Its a jumbled mess, if you need help decyphering my spaghetti, just message me :)

let spotify = {
    tokenTimer: Date.now()-10000,
    dataTimer: Date.now()-10000,
    position: 0,
    duration: 0
}

let getSpotifyData = () => {
    if(!settings.spotify.accessToken) return;
    let req = new XMLHttpRequest()
    req.open('GET', "https://api.spotify.com/v1/me/player/currently-playing", true);
    req.setRequestHeader('Accept', 'application/json');
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Authorization', 'Bearer ' + settings.spotify.accessToken);
    req.send();
    processRequest(req);
}

const getToken = () => {
    if (settings.spotify.refreshToken.length < 120) {
        settings.header.text = "Token not found";
        settings.subheader.text = "Please fill in the token parameter"
    } else if (Date.now() - spotify.tokenTimer > 10000) {
        spotify.tokenTimer = Date.now();
        let request = new XMLHttpRequest();
        request.open('GET', "https://spotify-visualiser.vercel.app/api/refresh?refresh_token=" + settings.spotify.refreshToken, true);
        request.send();
        request.onreadystatechange = function () {
            if (request.readyState == 4 && request.status == 200) {
                var response = JSON.parse(request.responseText);
                if (response.access_token) {
                    settings.spotify.accessToken = response.access_token;
                } else if(response.error) {
                    settings.header.text = "Error";
                    settings.subheader.text = response.error;
                }
            }
        };
    }
}

let processRequest = (req) => {
    req.onreadystatechange = () => {
        if (req.readyState == 4 && req.status == 200) {
            let response = JSON.parse(req.responseText);
            if (response.is_playing) {
                if (response.item.name) {
                    if (response.item.duration_ms && response.progress_ms && settings.spotify.progressBar) {
                        spotify.position = response.progress_ms;
                        spotify.duration = response.item.duration_ms;
                    }
                    if (!settings.spotify.swapTitle) {
                        if (response.item.name != settings.header.text) {
                            settings.header.text = (settings.spotify.shortenTitle ? response.item.name.replace(/ *\([^)]*\) */g, "").split("-")[0] : response.item.name);
                        }
                    } else {
                        if (response.item.name != settings.subheader.text) {
                            settings.subheader.text = (settings.spotify.shortenTitle ? response.item.name.replace(/ *\([^)]*\) */g, "").split("-")[0] : response.item.name);
                        }
                    }
                }
                if (response.item.artists) {
                    let res = "";
                    for (let i = 0; i < response.item.artists.length; i++) {
                        res += response.item.artists[i].name + (i == response.item.artists.length - 1 ? "" : ", ");
                    }
                    if (!settings.spotify.swapTitle) {
                        settings.subheader.text = res;
                    } else {
                        settings.header.text = res
                    }
                }
                if (response.item.album.images) {
                    if (settings.spotify.logoSync) {
                        settings.logo.custom = true;
                        if (logo.src != response.item.album.images[0].url) {
                            loadImage(logo, response.item.album.images[0].url, (img) => {
                                if (settings.spotify.colourSync) {
                                    let colour;
                                    if(settings.spotify.vibrant) {
                                        Vibrant.from(logo.src).getPalette((err, palette) => {
                                            if (err) {
                                                colour = getAverageRGB(logo)
                                            } else {
                                                colour = { r: 0, g: 0, b: 0 }
                                                colourAvg = getAverageRGB(logo)
                                                colour.r = Math.min(palette.Vibrant._rgb[0] * settings.spotify.vibrancy / 100,  255)
                                                colour.g = Math.min(palette.Vibrant._rgb[1] * settings.spotify.vibrancy / 100,  255)
                                                colour.b = Math.min(palette.Vibrant._rgb[2] * settings.spotify.vibrancy / 100,  255)
                                            }
                                            settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";                 
                                        })
                                    } else {
                                        colour = getAverageRGB(logo)
                                        settings.bars.colour = "rgb(" + colour.r + ", " + colour.g + ", " + colour.b + ")";  
                                    }   
                                }
                            })
                        }
                    }
                }
            } else {
                settings.header.text = "Spotify";
                settings.subheader.text = "No music is currently playing";
            }
        } else if (req.readyState == 4) {
            if (req.responseText != "") {
                var response = JSON.parse(req.responseText);
                if (response.error.status == 401 && response.error.message == "The access token expired") {
                    settings.header.text = "Loading...";
                    settings.subheader.text = "Loading...";
                    getToken();
                } else if (response.error.status == 429) { // This is the dumbest error
                    return;
                } else {
                    settings.header.text = "Error " + response.error.status;
                    settings.subheader.text = response.error.message;
                }
            }
        }
    };
}